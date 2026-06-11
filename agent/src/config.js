import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

export function loadAgentConfig(overrides = {}) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  loadDotEnvFile(path.resolve(process.cwd(), ".env"));
  loadDotEnvFile(path.resolve(here, "../.env"));

  return {
    apiBaseUrl: env("API_BASE_URL", "http://localhost:4020"),
    paymentMode: env("PAYMENT_MODE", "mock"),
    agentId: env("AGENT_ID", "1"),
    agentPrivateKey: env("AGENT_PRIVATE_KEY", ""),
    fujiRpcUrl: env("FUJI_RPC_URL", "https://api.avax-test.network/ext/bc/C/rpc"),
    tokenAddress: env("USDC_FUJI_ADDRESS", "0x0000000000000000000000000000000000000001"),
    capitalAmount: env("CAPITAL_AMOUNT", "100000000"),
    asset: env("ASSET", "USDC"),
    strategyHint: env("STRATEGY_HINT", "mock-arb-v1"),
    ...overrides
  };
}

