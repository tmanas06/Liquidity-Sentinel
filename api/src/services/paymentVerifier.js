import { createMockTxHash, decodePaymentHeader, normalizeAddress } from "../../../shared/settlement.js";

const ERC20_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function verifyPaymentHeader({ headerValue, invoice, config }) {
  const decoded = decodePaymentHeader(headerValue);
  if (!decoded.ok) {
    return { ok: false, reason: decoded.error };
  }

  if (!decoded.txHash) {
    return { ok: false, reason: "X-PAYMENT did not contain a txHash" };
  }

  if (config.paymentMode === "mock") {
    return verifyMockPayment(decoded.txHash, invoice);
  }

  return verifyFujiPayment(decoded.txHash, invoice, config);
}

function verifyMockPayment(txHash, invoice) {
  const expected = createMockTxHash(invoice);
  if (normalizeAddress(txHash) !== normalizeAddress(expected)) {
    return {
      ok: false,
      txHash,
      reason: "Mock payment hash does not match this invoice"
    };
  }

  return {
    ok: true,
    txHash,
    mode: "mock",
    reason: "Mock payment hash matched invoice fingerprint"
  };
}

async function verifyFujiPayment(txHash, invoice, config) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { ok: false, txHash, reason: "Payment reference is not a valid transaction hash" };
  }

  const receipt = await rpc(config.fujiRpcUrl, "eth_getTransactionReceipt", [txHash]);
  if (!receipt) {
    return { ok: false, txHash, reason: "Transaction receipt not found yet" };
  }

  if (receipt.status && receipt.status !== "0x1") {
    return { ok: false, txHash, reason: "Transaction receipt status is failed" };
  }

  const token = normalizeAddress(invoice.token);
  if (token === ZERO_ADDRESS) {
    return verifyNativeTransfer(txHash, invoice, config);
  }

  return verifyErc20TransferLog(receipt, invoice, txHash);
}

async function verifyNativeTransfer(txHash, invoice, config) {
  const tx = await rpc(config.fujiRpcUrl, "eth_getTransactionByHash", [txHash]);
  if (!tx) {
    return { ok: false, txHash, reason: "Transaction not found" };
  }

  const sentToExpectedDestination =
    normalizeAddress(tx.to) === normalizeAddress(invoice.destination);
  const amountOk = BigInt(tx.value || "0x0") >= BigInt(invoice.amount);

  return {
    ok: sentToExpectedDestination && amountOk,
    txHash,
    mode: "fuji-native",
    reason: sentToExpectedDestination && amountOk
      ? "Native transfer matched invoice"
      : "Native transfer did not match invoice destination or amount"
  };
}

function verifyErc20TransferLog(receipt, invoice, txHash) {
  const expectedToken = normalizeAddress(invoice.token);
  const expectedDestinationTopic = addressToTopic(invoice.destination);
  const requiredAmount = BigInt(invoice.amount);

  const matchingLog = (receipt.logs || []).find((log) => {
    const topics = log.topics || [];
    if (normalizeAddress(log.address) !== expectedToken) {
      return false;
    }
    if (normalizeAddress(topics[0]) !== ERC20_TRANSFER_TOPIC) {
      return false;
    }
    if (normalizeAddress(topics[2]) !== expectedDestinationTopic) {
      return false;
    }
    return BigInt(log.data || "0x0") >= requiredAmount;
  });

  return {
    ok: Boolean(matchingLog),
    txHash,
    mode: "fuji-erc20",
    reason: matchingLog
      ? "ERC-20 Transfer log matched invoice"
      : "No ERC-20 Transfer log matched invoice token, destination, and amount"
  };
}

function addressToTopic(address) {
  return `0x${normalizeAddress(address).replace(/^0x/, "").padStart(64, "0")}`;
}

async function rpc(url, method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status} for ${method}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(`RPC ${method} failed: ${payload.error.message || JSON.stringify(payload.error)}`);
  }
  return payload.result;
}

