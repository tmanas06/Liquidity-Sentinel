# Project Agent Notes

## Blockscout Skills

This project has two Blockscout skills installed under `.agents/skills/` and recorded in `skills-lock.json`:

- `blockscout-analysis`: use for on-chain analysis through Blockscout MCP/REST flows, explorer lookups, balances, transactions, token transfers, contract ABIs, and contract reads.
- `web3-dev`: use for building direct HTTP integrations against the Blockscout PRO API.

For Liquidity Sentinel, prefer these skills when implementing or debugging:

- Fuji C-Chain transaction verification.
- Explorer links and demo evidence for payment transactions.
- ERC-20 transfer history checks for `X-PAYMENT` settlement.
- Contract ABI lookup and read-only contract inspection.
- Agent monitoring scripts that watch wallets, vaults, token transfers, or transaction status.

`web3-dev` requires `BLOCKSCOUT_PRO_API_KEY` for PRO API calls. Do not paste API keys in chat or commit them. Store keys in a local `.env` file or shell environment variable.

