delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import { spawn } from "node:child_process";

const PORT = 4020;
const baseUrl = `http://127.0.0.1:${PORT}`;
const paymentMode = process.argv.includes("--fuji") ? "fuji" : "mock";
const reputationMode = paymentMode === "fuji" ? "rpc" : "mock";

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

function runChild(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let output = "";
    child.stdout.on("data", chunk => {
      output += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", chunk => {
      output += chunk;
      process.stderr.write(chunk);
    });
    child.on("exit", code => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function colored(message, colorCode = 36) {
  return `\x1b[${colorCode}m${message}\x1b[0m`;
}

async function main() {
  console.log(colored(`\n🚀 Starting Liquidity Sentinel Demo (${paymentMode} mode)...\n`, 32));

  const server = spawn(process.execPath, ["api/src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(PORT),
      PAYMENT_MODE: paymentMode,
      REPUTATION_MODE: reputationMode,
      MOCK_REPUTATION_SCORE: "95",
      AGENT_AI_MODE: "off"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", chunk => process.stdout.write(chunk));
  server.stderr.on("data", chunk => process.stderr.write(chunk));

  try {
    console.log(colored(`[API] Starting on port 4020 (${paymentMode} mode)...`, 33));
    await waitForHealth();
    console.log(colored("[API] ✅ Health check passed", 32));

    console.log(colored("[Agent] Starting autonomous agent...", 33));
    const output = await runChild(process.execPath, ["agent/src/agent.js"], {
      API_BASE_URL: baseUrl,
      AGENT_ID: "1",
      PAYMENT_MODE: paymentMode,
      AGENT_AI_MODE: "off"
    });

    if (output.includes("agent.capital_permission.received")) {
      console.log(colored("\n✅ Demo completed successfully!", 32));
    } else {
      throw new Error("Agent did not complete the capital request loop");
    }
  } finally {
    server.kill();
  }
}

main().catch(err => {
  console.error(colored(`\n❌ Demo failed: ${err.message}`, 31));
  process.exitCode = 1;
});
