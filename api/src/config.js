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

function intEnv(name, fallback) {
  const raw = env(name, String(fallback));
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(overrides = {}) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  loadDotEnvFile(path.resolve(process.cwd(), ".env"));
  loadDotEnvFile(path.resolve(here, "../.env"));

  return {
    port: intEnv("API_PORT", 4020),
    network: env("NETWORK", "avalanche-fuji"),
    paymentMode: env("PAYMENT_MODE", "mock"),
    reputationMode: env("REPUTATION_MODE", "mock"),
    mockReputationScore: intEnv("MOCK_REPUTATION_SCORE", 95),
    fujiRpcUrl: env("FUJI_RPC_URL", "https://api.avax-test.network/ext/bc/C/rpc"),
    tokenAddress: env("USDC_FUJI_ADDRESS", "0x0000000000000000000000000000000000000001"),
    sentinelVaultAddress: env("SENTINEL_VAULT_ADDRESS", "0x0000000000000000000000000000000000000402"),
    reputationRegistryAddress: env("REPUTATION_REGISTRY_ADDRESS", ""),
    mockVaultAddress: env("MOCK_VAULT_ADDRESS", "0x0000000000000000000000000000000000000F1A"),
    lowTierAmount: env("LOW_TIER_AMOUNT", "10000"),
    highTierAmount: env("HIGH_TIER_AMOUNT", "500000"),
    tokenDecimals: intEnv("TOKEN_DECIMALS", 6),
    invoiceTtlSeconds: intEnv("INVOICE_TTL_SECONDS", 300),
    ...overrides
  };
}

