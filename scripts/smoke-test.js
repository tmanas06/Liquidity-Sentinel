import { createSentinelServer } from "../api/src/server.js";
import { runAgent } from "../agent/src/agent.js";

async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server.address();
}

async function main() {
  const server = createSentinelServer({
    paymentMode: "mock",
    reputationMode: "mock",
    mockReputationScore: 96,
    lowTierAmount: "10000",
    highTierAmount: "500000"
  });

  const address = await listen(server);
  const apiBaseUrl = `http://${address.address}:${address.port}`;

  try {
    const result = await runAgent({
      apiBaseUrl,
      paymentMode: "mock",
      agentId: "1"
    });

    if (result.status !== 200) {
      throw new Error(`Smoke test failed with status ${result.status}`);
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: "smoke.passed",
      requestId: result.body.requestId,
      paymentTx: result.body.paymentTx
    }));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    event: "smoke.failed",
    message: error.message,
    stack: error.stack
  }));
  process.exitCode = 1;
});

