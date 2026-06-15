import { ethers } from "ethers";
import fs from "fs";

const USDC_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)"
];

async function fundVault() {
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  
  // Use the AGENT_PRIVATE_KEY from .env which we know is funded
  const privateKey = "7c3214520d7e4c06e6e146af08550d6e02bdb9845527187f5a60b3f212c74fc1";
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
  const MOCK_VAULT_ADDRESS = "0xd9cFAad4e9ad195e08ec894e54Fc4462590549F0";
  
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
  
  console.log("Sending 100,000 USDC to MockFlashLoanVault...");
  
  // 100,000 USDC with 6 decimals
  const amount = ethers.parseUnits("100000", 6);
  
  try {
      const tx = await usdc.transfer(MOCK_VAULT_ADDRESS, amount);
      console.log(`Transaction broadcasted: ${tx.hash}`);
      await tx.wait();
      console.log("Vault successfully funded!");
  } catch (err) {
      console.error("Failed to fund vault:", err.message);
  }
}

fundVault();
