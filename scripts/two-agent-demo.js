delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import { spawn } from "node:child_process";

const scenarios = [
  {
    label: "Agent 1",
    port: 4140,
    agentId: "1",
    score: 95,
    expectedTier: "trusted-agent",
    expectedAmount: "10000"
  },
  {
    label: "Agent 2",
    port: 4141,
    agentId: "2",
    score: 30,
    expectedTier: "new-agent",
    expectedAmount: "500000"
  }
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error(`Server at ${baseUrl} did not become healthy in time`);
}

function startServer(scenario) {
  const server = spawn(process.execPath, ["api/src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(scenario.port),
      PAYMENT_MODE: "mock",
      REPUTATION_MODE: "mock",
      MOCK_REPUTATION_SCORE: String(scenario.score),
      REPUTATION_REGISTRY_ADDRESS: "",
      SENTINEL_PRIVATE_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout.on("data", chunk => process.stdout.write(`[${scenario.label} API] ${chunk}`));
  server.stderr.on("data", chunk => process.stderr.write(`[${scenario.label} API] ${chunk}`));
  return server;
}

function runAgent(scenario) {
  const baseUrl = `http://127.0.0.1:${scenario.port}`;
  return new Promise((resolve, reject) => {
    const agent = spawn(process.execPath, ["agent/src/agent.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        API_BASE_URL: baseUrl,
        AGENT_ID: scenario.agentId,
        PAYMENT_MODE: "mock",
        AGENT_AI_MODE: "off"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let output = "";
    agent.stdout.on("data", chunk => {
      output += chunk;
      process.stdout.write(`[${scenario.label}] ${chunk}`);
    });
    agent.stderr.on("data", chunk => {
      output += chunk;
      process.stderr.write(`[${scenario.label}] ${chunk}`);
    });
    agent.on("exit", code => {
      if (code === 0) resolve(output);
      else reject(new Error(`${scenario.label} exited with ${code}`));
    });
  });
}

function assertPricing(output, scenario) {
  const invoiceLine = output
    .split(/\r?\n/)
    .find(line => line.includes('"event":"agent.invoice.received"'));
  if (!invoiceLine) {
    throw new Error(`${scenario.label} did not log an invoice`);
  }

  const invoice = JSON.parse(invoiceLine);
  if (
    invoice.reputationScore !== scenario.score ||
    invoice.pricingTier !== scenario.expectedTier ||
    invoice.amount !== scenario.expectedAmount
  ) {
    throw new Error(
      `${scenario.label} pricing mismatch: expected score=${scenario.score}, tier=${scenario.expectedTier}, ` +
      `amount=${scenario.expectedAmount}; received score=${invoice.reputationScore}, tier=${invoice.pricingTier}, ` +
      `amount=${invoice.amount}`
    );
  }
}

async function main() {
  const servers = scenarios.map(startServer);

  try {
    await Promise.all(scenarios.map(scenario => waitForHealth(`http://127.0.0.1:${scenario.port}`)));
    console.log("Both mock APIs started. Running agents with scores 95 and 30...\n");

    const outputs = await Promise.all(scenarios.map(runAgent));
    outputs.forEach((output, index) => assertPricing(output, scenarios[index]));

    console.log("\n✅ Differential pricing verified:");
    for (const scenario of scenarios) {
      console.log(
        `   ${scenario.label}: score ${scenario.score} -> ${scenario.expectedTier} -> ${scenario.expectedAmount} USDC units`
      );
    }
  } finally {
    servers.forEach(server => server.kill());
  }
}

main().catch(err => {
  console.error(`Demo failed: ${err.message}`);
  process.exitCode = 1;
});
