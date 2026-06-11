# Liquidity Sentinel Dev B Implementation Plan

## Goal

Build the off-chain half of Liquidity Sentinel: a Sentinel API gateway that sells mock capital access through an HTTP 402 payment challenge, and an autonomous execution agent that pays the invoice and retries without human intervention.

## Current Build Strategy

The first implementation uses a dependency-light mock loop so the team can demo the full x402-style handshake immediately:

1. API receives `POST /api/v1/request-capital`.
2. API reads a mock reputation score and chooses a fee tier.
3. API returns `402 Payment Required` with an invoice.
4. Agent computes a deterministic mock payment hash for that invoice.
5. Agent retries with `X-PAYMENT: base64(txHash)` and `X-REQUEST-ID`.
6. API verifies the mock payment hash and returns the capital permission payload.

After the loop is stable, replace the mock adapters with Fuji RPC, Dev A contract ABIs, and real ERC-20 settlement.

## Milestone 1: Local Protocol Loop

Requirements:

- API starts locally with no database.
- `POST /api/v1/request-capital` returns 402 when no payment header exists.
- Invoice contains request id, network, token, destination, amount, expiration, and pricing tier.
- Agent catches 402, pays in mock mode, retries automatically, and receives 200.
- Logs are clear enough for a demo recording.

Acceptance:

- `npm run smoke` completes with a final `capitalPermission` response.

## Milestone 2: Fuji Payment Verification

Requirements:

- API verifies real Fuji transaction receipts through JSON-RPC.
- ERC-20 `Transfer` logs are checked for token, destination, and amount.
- Invalid destination, wrong amount, missing receipt, and failed receipt are rejected.

Acceptance:

- A manually supplied Fuji tx hash can unlock a matching invoice.

## Milestone 3: Real Agent Settlement

Requirements:

- Agent loads a funded private key from `.env`.
- Agent signs token transfer using `ethers`.
- Agent waits for the receipt, then retries with `X-PAYMENT`.

Acceptance:

- Agent pays test USDC on Fuji and unlocks the API payload without manual copy-paste.

## Milestone 4: Reputation Contract Integration

Requirements:

- API reads Dev A's `ReputationRegistry.getSummary(agentId)` using final ABI/address.
- Score over 90 receives low-tier pricing.
- Missing or low score receives high-tier pricing.
- Post-execution feedback call is added if Dev A exposes the function in time.

Acceptance:

- Changing an agent's score changes the 402 invoice amount.

## Milestone 5: Demo Polish

Requirements:

- One command starts API.
- One command starts agent.
- Terminal logs show request id, score, tier, amount, tx hash, verification, and payload.
- README contains setup and recording instructions.

Acceptance:

- Split-screen demo shows API/agent terminals and Fuji explorer evidence.

## Hard Scope Boundaries

- No production frontend.
- No mainnet.
- No real DEX routes.
- No complex persistent database unless needed after the demo loop works.

