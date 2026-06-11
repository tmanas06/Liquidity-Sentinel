import { spawn } from "node:child_process";

const PORT = 4220;
const baseUrl = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }
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
    child.stdout.on("data", (chunk) => {
      output += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
      process.stderr.write(chunk);
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function main() {
  const server = spawn(process.execPath, ["api/src/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, API_PORT: String(PORT), MOCK_REPUTATION_SCORE: "95" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await waitForHealth();
    const output = await runChild(process.execPath, ["agent/src/agent.js"], {
      API_BASE_URL: baseUrl,
      AGENT_ID: "1"
    });

    if (!output.includes("agent.capital_permission.received")) {
      throw new Error("Agent did not receive capital permission");
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: "root_agent.smoke.passed"
    }));
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    event: "root_agent.smoke.failed",
    message: error.message,
    stack: error.stack
  }));
  process.exitCode = 1;
});

