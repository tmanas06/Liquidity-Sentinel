import { ethers } from "ethers";
import { loadAgentConfig } from "../agent/src/config.js";
import { loadConfig } from "../api/src/config.js";

const USDC_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)"
];

async function fundVault() {
  const agentConfig = loadAgentConfig();
  const apiConfig = loadConfig();
  if (!agentConfig.agentPrivateKey) {
    throw new Error("AGENT_PRIVATE_KEY is required in .env or the shell environment");
  }

  const provider = new ethers.JsonRpcProvider(agentConfig.fujiRpcUrl);
  const wallet = new ethers.Wallet(agentConfig.agentPrivateKey, provider);
  
  const usdc = new ethers.Contract(apiConfig.tokenAddress, USDC_ABI, wallet);
  
  console.log("Sending 100,000 USDC to MockFlashLoanVault...");
  
  // 100,000 USDC with 6 decimals
  const amount = ethers.parseUnits("100000", 6);
  
  try {
      const tx = await usdc.transfer(apiConfig.mockVaultAddress, amount);
      console.log(`Transaction broadcasted: ${tx.hash}`);
      await tx.wait();
      console.log("Vault successfully funded!");
  } catch (err) {
      console.error("Failed to fund vault:", err.message);
  }
}

fundVault();
