# Liquidity Sentinel - Project Overview

**Last updated:** June 21, 2026  
**Status:** Hackathon vertical slice implemented; Fuji execution still requires funded/configured wallets

## Purpose

Liquidity Sentinel demonstrates reputation-gated x402 capital access. An autonomous buyer requests capital, receives an HTTP 402 invoice priced from its reputation, settles the invoice, and retries with an `X-PAYMENT` header to unlock a capital permission.

## Implemented flow

1. The agent sends `POST /api/v1/request-capital`.
2. The API reads reputation from mock configuration or `ReputationRegistry.getSummary()`.
3. The API issues an expiring invoice using one of three tiers:
   - score 80-100: `trusted-agent`, 10,000 USDC units ($0.01 at 6 decimals)
   - score 40-79: `standard-risk`, 100,000 units ($0.10)
   - score 0-39: `new-agent`, 500,000 units ($0.50)
4. The agent creates a deterministic mock payment or broadcasts an ERC-20 transfer on Fuji.
5. The API validates the payment, invoice expiry, and replay state.
6. The API returns the capital permission and optionally submits on-chain reputation feedback.

## Components

| Component | Location | Responsibility |
|---|---|---|
| API | `api/src/server.js` | 402 state machine, SSE logs, payment and replay validation |
| Agent | `agent/src/agent.js` | Invoice handling, optional AI decision, mock/Fuji settlement |
| Payment verifier | `api/src/services/paymentVerifier.js` | Mock hash or Fuji ERC-20 `Transfer` receipt validation |
| Reputation | `api/src/services/reputation.js` | Mock/RPC score lookup and three-tier pricing |
| Feedback | `api/src/services/reputationFeedback.js` | Optional `submitFeedback()` transaction in RPC mode |
| Frontend | `frontend/src/` | Dashboard, wallet flow, tier telemetry, SnowTrace links |
| Contracts | `contracts/` | Identity, reputation, and mock vault contracts |

## Run and verify

```bash
npm install
npm run demo
npm run smoke
npm run smoke:negative
npm run demo:two-agent
```

Frontend:

```bash
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

For a real Fuji settlement, copy `.env.example` to `.env`, configure funded keys, set `PAYMENT_MODE=fuji` and `REPUTATION_MODE=rpc`, then run:

```bash
npm run demo -- --fuji
```

Never commit private keys. Any key previously committed must be rotated because removing it from the current files does not remove it from Git history.

## Current limitations

- Invoices and replay state are in memory and reset when the API restarts.
- The frontend production bundle is large and would benefit from route/vendor code splitting.
- Fuji mode depends on RPC availability, funded wallets, deployed contract state, and configured keys.
- The API faucet is demo-only and must not be exposed without authentication and rate limiting.
