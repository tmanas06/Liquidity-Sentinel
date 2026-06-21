# Liquidity Sentinel Frontend

React/Vite dashboard for the Liquidity Sentinel x402 and reputation demo.

## Run locally

Start the API from the repository root:

```bash
npm run dev:api
```

Then start the frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed.

## Checks

```bash
npm run lint
npm run build
```

`VITE_API_URL` defaults to `http://localhost:4020/api/v1`. `VITE_GROQ_API_KEY` is optional and is only needed for the frontend AI assistant.
