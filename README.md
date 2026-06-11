# Liquidity Sentinel

Dev B implementation for the Sentinel API gateway and autonomous execution agent.

## What Exists Now

- `api/`: Node.js Sentinel API with HTTP 402 invoice flow.
- `agent/`: autonomous buyer agent that handles 402 and retries with `X-PAYMENT`.
- `shared/`: shared settlement helpers for payment header encoding and mock tx hashes.
- `scripts/smoke-test.js`: local end-to-end test of the Dev B loop.

The current default is `mock` mode so the protocol can run without testnet funding. Real Fuji adapters are staged in the code and documented in `.env.example`.

## Quick Start

```bash
npm run smoke
```

On Windows PowerShell, if `npm.ps1` is blocked by execution policy, use:

```bash
npm.cmd run smoke
```

Expected result: the agent receives a 402 invoice, produces a mock payment reference, retries with `X-PAYMENT`, and receives a 200 response with `capitalPermission`.

## Run API

```bash
npm run dev:api
```

PowerShell-safe form:

```bash
npm.cmd run dev:api
```

Default URL:

```text
http://localhost:4020
```

Health check:

```text
GET /health
```

Capital request:

```text
POST /api/v1/request-capital
```

## Run Agent

In another terminal:

```bash
npm run dev:agent
```

PowerShell-safe form:

```bash
npm.cmd run dev:agent
```

## Main Demo Flow

1. Agent sends `POST /api/v1/request-capital`.
2. API returns `402 Payment Required`.
3. Agent settles invoice in mock mode or real payment mode.
4. Agent retries with:
   - `X-REQUEST-ID: <invoice.requestId>`
   - `X-PAYMENT: <base64 tx hash>`
5. API verifies payment and releases capital permission payload.

## Next Real-Fuji Work

1. Add real contract addresses to `api/.env` and `agent/.env`.
2. Install dependencies for real signing, especially `ethers`.
3. Switch `PAYMENT_MODE` from `mock` to `fuji`.
4. Wire Dev A's final `ReputationRegistry` ABI into `api/src/services/reputation.js`.
