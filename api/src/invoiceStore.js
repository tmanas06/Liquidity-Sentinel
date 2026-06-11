import { randomUUID } from "node:crypto";

export function createInvoiceStore() {
  const invoices = new Map();

  return {
    create({ agentId, reputation, amount, pricingTier, config }) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.invoiceTtlSeconds * 1000);
      const requestId = `sentinel_${randomUUID()}`;
      const invoice = {
        requestId,
        agentId: String(agentId),
        network: config.network,
        amount: String(amount),
        decimals: config.tokenDecimals,
        token: config.tokenAddress,
        destination: config.sentinelVaultAddress,
        expiresAt: expiresAt.toISOString(),
        pricingTier,
        reputationScore: reputation.score,
        reputationSource: reputation.source,
        createdAt: now.toISOString(),
        paid: false
      };

      invoices.set(requestId, invoice);
      return invoice;
    },

    get(requestId) {
      return invoices.get(requestId);
    },

    markPaid(requestId, txHash) {
      const invoice = invoices.get(requestId);
      if (!invoice) {
        return undefined;
      }
      invoice.paid = true;
      invoice.paymentTx = txHash;
      invoice.paidAt = new Date().toISOString();
      return invoice;
    },

    isExpired(invoice) {
      return new Date(invoice.expiresAt).getTime() < Date.now();
    }
  };
}

