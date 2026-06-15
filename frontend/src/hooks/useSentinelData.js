import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAddresses from '../addresses.json';

const INT_IDENTITY_ABI = [
  "event AgentRegistered(uint256 indexed agentId, string indexed agentDomain, address indexed agentAddress)"
];

const INT_REPUTATION_ABI = [
  "function getSummary(uint256 agentId) external view returns (uint256)",
  "function submitFeedback(uint256 agentId, uint256 score) external"
];

const INT_VAULT_ABI = [
  "event FlashLoanExecuted(address indexed recipient, uint256 amount)"
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

const USDC_FUJI_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
const API_URL = "http://localhost:4020/api/v1";

export function useSentinelData() {
  const [agents, setAgents] = useState([]);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [liveBlocks, setLiveBlocks] = useState(0);
  const [eventsFeed, setEventsFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const providerUrl = import.meta.env.VITE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
    // Fallback array for resilience as approved by the founder
    const provider = new ethers.FallbackProvider([
        new ethers.JsonRpcProvider(providerUrl),
        new ethers.JsonRpcProvider("https://rpc.ankr.com/avalanche_fuji"),
        new ethers.JsonRpcProvider("https://avalanche-fuji.publicnode.com")
    ]);

    const identityContract = new ethers.Contract(contractAddresses.identityRegistry, INT_IDENTITY_ABI, provider);
    const repContract = new ethers.Contract(contractAddresses.reputationRegistry, INT_REPUTATION_ABI, provider);
    const vaultContract = new ethers.Contract(contractAddresses.mockVault, INT_VAULT_ABI, provider);
    const usdcContract = new ethers.Contract(USDC_FUJI_ADDRESS, ERC20_ABI, provider);

    async function initializeOnChainState() {
      try {
        const currentBlock = await provider.getBlockNumber();
        setLiveBlocks(currentBlock);

        // Fetch Real Vault Liquidity
        const balance = await usdcContract.balanceOf(contractAddresses.mockVault);
        setVaultBalance(ethers.formatUnits(balance, 6));

        // Scan Event Logs for Dynamic Agent Discovery
        const registrationFilter = identityContract.filters.AgentRegistered();
        const logs = await identityContract.queryFilter(registrationFilter, -2000); 

        const uniqueAgents = logs.map(e => ({
            id: e.args.agentId.toString(),
            domain: e.args.agentDomain
        }));
        
        const uniqueIds = [...new Map(uniqueAgents.map(item => [item.id, item])).values()];

        const dataset = await Promise.all(uniqueIds.map(async (agent) => {
          let score = 0n;
          try {
             score = await repContract.getSummary(BigInt(agent.id));
          } catch(e) {}
          
          const numScore = Number(score);
          return {
            id: agent.id,
            score: numScore,
            validations: 1, 
            riskProfile: numScore > 90 ? 1 : 10 
          };
        }));

        setAgents(dataset);
        setLoading(false);
      } catch (err) {
        console.error("On-chain indexing failure:", err);
        setLoading(false);
      }
    }

    initializeOnChainState();

    // Setup Server-Sent Events (SSE) from Express API
    const evtSource = new EventSource(`${API_URL}/logs`);
    
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const time = new Date(data.ts).toLocaleTimeString();
      
      let feedItem = null;

      if (data.event === "api.started") {
         feedItem = {
           time,
           type: 'SYSTEM',
           msg: 'Live x402 Protocol Gatekeeper connection established.'
         };
      } 
      else if (data.event === "invoice.created") {
         const scoreFormat = data.score > 90 ? `<span class="text-[#4edea3] font-bold">${data.score}/100</span>` : `<span class="text-[#ffb4ab] font-bold">${data.score}/100</span>`;
         const amountFmt = ethers.formatUnits(data.amount, 6);
         const agentLabel = data.score > 90 ? "Trusted Flow Agent" : "Standard Risk Agent";
         
         feedItem = {
           time,
           type: 'x402 CHALLENGE ISSUED',
           msg: `req-${data.requestId.slice(-4)}: Assigned $${amountFmt} USDC invoice to ${agentLabel} ${data.agentId} (Score: ${scoreFormat}).`,
           isHtml: true
         };
      }
      else if (data.event === "payment.verified") {
         feedItem = {
           time,
           type: 'WEB3 SETTLED',
           msg: `Verified transaction hash <span class="text-[#bbcabf]">${data.txHash.slice(0,6)}...${data.txHash.slice(-4)}</span> on Fuji C-Chain. Releasing Vault Payload.`,
           isHtml: true,
           isSuccess: true
         };
      }

      if (feedItem) {
        setEventsFeed(prev => [feedItem, ...prev].slice(0, 50));
      }
    };

    // Live Vault FlashLoan Listener
    const onFlashLoanExecuted = (recipient, amount) => {
      const feedItem = {
        time: new Date().toLocaleTimeString(),
        type: 'FLASH_LOAN',
        msg: `Mock Flash Loan Executed for ${recipient.slice(0,6)}... ($${ethers.formatUnits(amount, 6)} allocated)`
      };
      setEventsFeed(prev => [feedItem, ...prev].slice(0, 50));
    };

    vaultContract.on("FlashLoanExecuted", onFlashLoanExecuted);
    
    // Setup regular block ticker
    const blockInterval = setInterval(async () => {
      try {
        const num = await provider.getBlockNumber();
        setLiveBlocks(num);
      } catch(e) {}
    }, 4000);

    return () => {
      vaultContract.off("FlashLoanExecuted", onFlashLoanExecuted);
      clearInterval(blockInterval);
      evtSource.close();
    };
  }, []);

  const executeAdminSlash = async (agentId, targetsScore) => {
    if (!window.ethereum) throw new Error("No web3 browser injector located");
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const writeInstance = new ethers.Contract(contractAddresses.reputationRegistry, INT_REPUTATION_ABI, signer);

    const tx = await writeInstance.submitFeedback(BigInt(agentId), BigInt(targetsScore));
    await tx.wait();
    
    setAgents(prev => prev.map(a => a.id === String(agentId) ? { ...a, score: Number(targetsScore) } : a));
    
    return tx.hash;
  };

  return { agents, vaultBalance, liveBlocks, eventsFeed, loading, executeAdminSlash };
}
