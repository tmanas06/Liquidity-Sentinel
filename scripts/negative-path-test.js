delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import { spawn } from "node:child_process";

const PORT = 4130;
const baseUrl = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error("Server did not become healthy in time");
}

function postCapital(headers = {}) {
  return fetch(`${baseUrl}/api/v1/request-capital`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ agentId: "1", capitalAmount: "100000000", asset: "USDC" })
  }).then(res => res.json().then(body => ({ status: res.status, body })));
}

async function main() {
  const server = spawn(process.execPath, ["api/src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(PORT),
      PAYMENT_MODE: "mock",
      REPUTATION_MODE: "mock",
      MOCK_REPUTATION_SCORE: "95",
      INVOICE_TTL_SECONDS: "1",
      REPUTATION_REGISTRY_ADDRESS: "",
      SENTINEL_PRIVATE_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", chunk => process.stdout.write(chunk));
  server.stderr.on("data", chunk => process.stderr.write(chunk));

  try {
    await waitForHealth();
    console.log("API is healthy, starting tests...");

    // Test 1: Wrong payment (mock payment hash mismatch)
    const first = await postCapital();
    if (first.status !== 402) throw new Error(`Expected 402, got ${first.status}`);
    const invoice1 = first.body.invoice;
    const { createMockTxHash } = await import("../shared/settlement.js");
    const wrongHash = createMockTxHash({ ...invoice1, amount: String(BigInt(invoice1.amount) + 1n) });
    const b64Wrong = Buffer.from(wrongHash, "utf8").toString("base64");
    const test1 = await postCapital({ "x-request-id": invoice1.requestId, "x-payment": b64Wrong });
    if (test1.status !== 402) throw new Error(`Test 1: Expected 402 on wrong hash, got ${test1.status}`);
    console.log("✅ Test 1 passed: wrong payment rejected");

    // Test 2: Expired invoice
    const expiryChallenge = await postCapital();
    if (expiryChallenge.status !== 402) throw new Error(`Expected 402, got ${expiryChallenge.status}`);
    const expiryInvoice = expiryChallenge.body.invoice;
    const expiryHash = createMockTxHash(expiryInvoice);
    const expiryPayment = Buffer.from(expiryHash, "utf8").toString("base64");
    const waitMs = Math.max(0, new Date(expiryInvoice.expiresAt).getTime() - Date.now() + 50);
    await wait(waitMs);
    const expired = await postCapital({ "x-request-id": expiryInvoice.requestId, "x-payment": expiryPayment });
    if (expired.status !== 402 || !expired.body.message?.toLowerCase().includes("expired")) {
      throw new Error(`Test 2: Expected expired invoice rejection, got: ${JSON.stringify(expired)}`);
    }
    console.log("✅ Test 2 passed: expired invoice rejected");

    // Test 3: Replay attack
    const third = await postCapital();
    if (third.status !== 402) throw new Error(`Expected 402, got ${third.status}`);
    const invoice3 = third.body.invoice;
    const validHash = createMockTxHash(invoice3);
    const b64Valid = Buffer.from(validHash, "utf8").toString("base64");
    const firstPay = await postCapital({ "x-request-id": invoice3.requestId, "x-payment": b64Valid });
    if (firstPay.status !== 200) throw new Error(`Expected 200 on first valid payment, got ${firstPay.status}`);
    const secondPay = await postCapital({ "x-request-id": invoice3.requestId, "x-payment": b64Valid });
    if (secondPay.status !== 402) throw new Error(`Expected 402 on replay, got ${secondPay.status}`);
    if (!secondPay.body.reason || !secondPay.body.reason.includes("replay")) {
      throw new Error(`Rejection reason should mention replay, got: ${JSON.stringify(secondPay.body)}`);
    }
    console.log("✅ Test 3 passed: replay attack rejected");

    // Test 4: Unknown request ID
    const unknown = await postCapital({ "x-request-id": "sentinel_unknown", "x-payment": Buffer.from("0x123", "utf8").toString("base64") });
    if (unknown.status !== 402) throw new Error(`Expected 402 for unknown requestId, got ${unknown.status}`);
    console.log("✅ Test 4 passed: unknown request ID rejected");

    console.log("\n✅ All negative path tests passed!");
  } finally {
    server.kill();
  }
}

main().catch(err => {
  console.error(`❌ Tests failed: ${err.message}`);
  process.exitCode = 1;
});
