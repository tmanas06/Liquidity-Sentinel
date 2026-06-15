delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { loadConfig } from "./config.js";
import { readJsonBody, sendJson } from "./http.js";
import { createInvoiceStore } from "./invoiceStore.js";
import { priceFromReputation, readReputation } from "./services/reputation.js";
import { verifyPaymentHeader } from "./services/paymentVerifier.js";
import { submitOnChainFeedback } from "./services/reputationFeedback.js";

function log(event, details = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...details }));
}

function validateCapitalRequest(body) {
  const errors = [];
  if (body.agentId === undefined || body.agentId === null || String(body.agentId).trim() === "") {
    errors.push("agentId is required");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      agentId: String(body.agentId ?? "").trim(),
      capitalAmount: String(body.capitalAmount ?? "100000000"),
      asset: String(body.asset ?? "USDC"),
      strategyHint: String(body.strategyHint ?? "mock-arb-v1")
    }
  };
}

export function createSentinelServer(configOverrides = {}) {
  const config = loadConfig(configOverrides);
  const invoiceStore = createInvoiceStore();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, {
          ok: true,
          service: "liquidity-sentinel-api",
          network: config.network,
          paymentMode: config.paymentMode,
          reputationMode: config.reputationMode
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/v1/request-capital") {
        const body = await readJsonBody(req);
        const validation = validateCapitalRequest(body);
        if (!validation.ok) {
          sendJson(res, 400, { status: 400, errors: validation.errors });
          return;
        }

        await handleCapitalRequest({
          req,
          res,
          body: validation.value,
          config,
          invoiceStore
        });
        return;
      }

      sendJson(res, 404, { status: 404, message: "Not found" });
    } catch (error) {
      log("api.error", { message: error.message, stack: error.stack });
      sendJson(res, error.statusCode || 500, {
        status: error.statusCode || 500,
        message: error.message
      });
    }
  });

  server.sentinel = { config, invoiceStore };
  return server;
}

async function handleCapitalRequest({ req, res, body, config, invoiceStore }) {
  const paymentHeader = req.headers["x-payment"];
  const requestId = req.headers["x-request-id"] || req.headers["x-invoice-id"];

  if (!paymentHeader) {
    const reputation = await readReputation(body.agentId, config);
    const pricing = priceFromReputation(reputation, config);
    const invoice = invoiceStore.create({
      agentId: body.agentId,
      reputation,
      amount: pricing.amount,
      pricingTier: pricing.pricingTier,
      config
    });

    log("invoice.created", {
      requestId: invoice.requestId,
      agentId: body.agentId,
      score: reputation.score,
      tier: invoice.pricingTier,
      amount: invoice.amount
    });

    sendJson(res, 402, {
      status: 402,
      message: "Payment Required via x402 Protocol",
      invoice
    });
    return;
  }

  if (!requestId) {
    sendJson(res, 400, {
      status: 400,
      message: "X-REQUEST-ID is required when X-PAYMENT is supplied"
    });
    return;
  }

  const invoice = invoiceStore.get(String(requestId));
  if (!invoice) {
    sendJson(res, 402, {
      status: 402,
      message: "Unknown invoice request id"
    });
    return;
  }

  if (invoiceStore.isExpired(invoice)) {
    sendJson(res, 402, {
      status: 402,
      message: "Invoice expired",
      invoice
    });
    return;
  }

  const verification = await verifyPaymentHeader({ headerValue: paymentHeader, invoice, config });
  log("payment.verified", {
    requestId: invoice.requestId,
    agentId: invoice.agentId,
    ok: verification.ok,
    txHash: verification.txHash,
    reason: verification.reason
  });

  if (!verification.ok) {
    sendJson(res, 402, {
      status: 402,
      message: "Invalid payment",
      reason: verification.reason
    });
    return;
  }

  invoiceStore.markPaid(invoice.requestId, verification.txHash);
  const feedbackResult = await submitOnChainFeedback(invoice.agentId, 98, config);
  sendJson(res, 200, {
    status: 200,
    requestId: invoice.requestId,
    paymentTx: verification.txHash,
    capitalPermission: {
      vault: config.mockVaultAddress,
      asset: body.asset,
      amount: body.capitalAmount,
      strategyHint: body.strategyHint,
      expiresInSeconds: 180
    },
    reputationFeedback: feedbackResult
  });
}

export function startServer(configOverrides = {}) {
  const server = createSentinelServer(configOverrides);
  const { port } = server.sentinel.config;
  server.listen(port, () => {
    log("api.started", {
      port,
      network: server.sentinel.config.network,
      paymentMode: server.sentinel.config.paymentMode,
      reputationMode: server.sentinel.config.reputationMode
    });
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}

