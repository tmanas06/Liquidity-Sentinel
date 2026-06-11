import { createHash } from "node:crypto";

export function normalizeAddress(value) {
  return String(value || "").trim().toLowerCase();
}

export function settlementFingerprint(invoice) {
  return [
    invoice.requestId,
    invoice.agentId,
    invoice.amount,
    normalizeAddress(invoice.destination),
    normalizeAddress(invoice.token)
  ].join(":");
}

export function createMockTxHash(invoice) {
  const digest = createHash("sha256")
    .update(settlementFingerprint(invoice))
    .digest("hex");
  return `0x${digest}`;
}

export function encodePaymentHeader(txHash) {
  return Buffer.from(txHash, "utf8").toString("base64");
}

export function decodePaymentHeader(headerValue) {
  if (!headerValue) {
    return { ok: false, error: "Missing X-PAYMENT header" };
  }

  try {
    const decoded = Buffer.from(String(headerValue), "base64").toString("utf8").trim();
    if (!decoded) {
      return { ok: false, error: "X-PAYMENT decoded to an empty value" };
    }

    if (decoded.startsWith("{")) {
      const parsed = JSON.parse(decoded);
      return { ok: true, txHash: parsed.txHash || parsed.transactionHash, raw: parsed };
    }

    return { ok: true, txHash: decoded, raw: decoded };
  } catch (error) {
    return { ok: false, error: `Invalid base64 X-PAYMENT header: ${error.message}` };
  }
}

