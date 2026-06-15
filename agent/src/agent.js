delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import { fileURLToPath } from "node:url";

import { loadAgentConfig } from "./config.js";
import { createMockTxHash, encodePaymentHeader } from "../../shared/settlement.js";

function log(event, details = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...details }));
}

export async function runAgent(configOverrides = {}) {
  const config = loadAgentConfig(configOverrides);
  const requestBody = {
    agentId: config.agentId,
    capitalAmount: config.capitalAmount,
    asset: config.asset,
    strategyHint: config.strategyHint
  };

  log("agent.request.initial", {
    apiBaseUrl: config.apiBaseUrl,
    agentId: requestBody.agentId
  });

  const first = await postCapitalRequest(config.apiBaseUrl, requestBody);
  if (first.status !== 402) {
    log("agent.unexpected_response", { status: first.status, body: first.body });
    return first;
  }

  const invoice = first.body.invoice;
  log("agent.invoice.received", {
    requestId: invoice.requestId,
    amount: invoice.amount,
    destination: invoice.destination,
    pricingTier: invoice.pricingTier,
    reputationScore: invoice.reputationScore
  });

  const txHash = await settleInvoice(invoice, config);
  log("agent.payment.sent", { requestId: invoice.requestId, txHash });

  const retry = await postCapitalRequest(config.apiBaseUrl, requestBody, {
    "x-request-id": invoice.requestId,
    "x-payment": encodePaymentHeader(txHash)
  });

  if (retry.status === 200 && retry.body.capitalPermission) {
    log("agent.capital_permission.received", {
      requestId: invoice.requestId,
      paymentTx: txHash,
      permission: retry.body.capitalPermission
    });
  } else {
    log("agent.retry.response", { status: retry.status, body: retry.body });
  }
  return retry;
}

async function postCapitalRequest(apiBaseUrl, body, headers = {}) {
  const response = await fetch(`${apiBaseUrl}/api/v1/request-capital`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  return {
    status: response.status,
    body: payload
  };
}

async function settleInvoice(invoice, config) {
  if (config.paymentMode === "mock") {
    return createMockTxHash(invoice);
  }

  return settleInvoiceWithEthers(invoice, config);
}

async function settleInvoiceWithEthers(invoice, config) {
  if (!config.agentPrivateKey) {
    throw new Error("AGENT_PRIVATE_KEY is required for non-mock payment mode");
  }

  let ethers;
  try {
    ethers = await import("ethers");
  } catch {
    throw new Error("Install ethers before using real payment mode: npm install ethers");
  }

  const provider = new ethers.JsonRpcProvider(config.fujiRpcUrl);
  const wallet = new ethers.Wallet(config.agentPrivateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) {
      console.error(`🚨 [CRITICAL] Signer ${wallet.address} has 0 AVAX. Fund gas at faucet.avax.network first!`);
      process.exit(1);
  }

  const erc20 = new ethers.Contract(
    invoice.token,
    ["function transfer(address to, uint256 amount) returns (bool)"],
    wallet
  );

  const tx = await erc20.transfer(invoice.destination, BigInt(invoice.amount));
  log("agent.payment.broadcast", { txHash: tx.hash });
  await tx.wait(1);
  return tx.hash;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runAgent().catch((error) => {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: "agent.error",
      message: error.message,
      stack: error.stack
    }));
    process.exitCode = 1;
  });
}
