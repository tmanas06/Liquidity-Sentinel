import { Wallet } from 'ethers';
import { loadAgentConfig } from '../agent/src/config.js';

const { agentPrivateKey } = loadAgentConfig();
if (!agentPrivateKey) {
  throw new Error('AGENT_PRIVATE_KEY is required in .env or the shell environment');
}
const w = new Wallet(agentPrivateKey);
console.log('Wallet Address:', w.address);
