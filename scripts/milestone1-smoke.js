delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import crypto from "node:crypto";
import { spawn } from "node:child_process";

const PORT = 4120;
const baseUrl = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function expectedMockPayment(invoice) {
  const fingerprint = [
    invoice.requestId,
    invoice.agentId,
    invoice.amount,
    invoice.destination.toLowerCase(),
    invoice.token.toLowerCase()
  ].join(":");

  return `0x${crypto.createHash("sha256").update(fingerprint).digest("hex")}`;
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is not listening yet.
    }
    await wait(250);
  }

  throw new Error("Server did not become healthy in time");
}

async function postCapital(headers = {}) {
  const response = await fetch(`${baseUrl}/api/v1/request-capital`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify({
      agentId: "1",
      capitalAmount: "100000000",
      asset: "USDC"
    })
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

async function main() {
  const child = spawn(process.execPath, ["api/src/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, API_PORT: String(PORT), MOCK_REPUTATION_SCORE: "95" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await waitForHealth();

    const first = await postCapital();
    if (first.status !== 402) {
      throw new Error(`Expected first response to be 402, received ${first.status}`);
    }

    const invoice = first.body.invoice;
    const txHash = expectedMockPayment(invoice);
    const paymentHeader = Buffer.from(txHash, "utf8").toString("base64");

    const second = await postCapital({
      "x-request-id": invoice.requestId,
      "x-payment": paymentHeader
    });

    if (second.status !== 200) {
      throw new Error(`Expected retry response to be 200, received ${second.status}`);
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: "milestone1.smoke.passed",
      requestId: second.body.requestId,
      paymentTx: second.body.paymentTx
    }));
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    event: "milestone1.smoke.failed",
    message: error.message,
    stack: error.stack
  }));
  process.exitCode = 1;
});

