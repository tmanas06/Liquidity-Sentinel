import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
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
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4020/api/v1";

export function useSentinelData() {
  const [agents, setAgents] = useState([]);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [liveBlocks, setLiveBlocks] = useState(0);
  const [eventsFeed, setEventsFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wallets } = useWallets();

  useEffect(() => {
    // Use a single primary RPC with manual failover.
    // FallbackProvider requires quorum agreement between nodes, but public Fuji
    // RPCs often disagree on block height by 1-2 blocks, causing constant
    // "quorum not met" crashes. A single provider is far more stable for testnet.
    const RPC_URLS = [
      import.meta.env.VITE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche_fuji',
      'https://avalanche-fuji.publicnode.com'
    ];

    function createProvider(index = 0) {
      return new ethers.JsonRpcProvider(RPC_URLS[index % RPC_URLS.length]);
    }

    let provider = createProvider(0);

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
    if (wallets.length === 0) throw new Error("No wallet connected. Please connect your wallet via Privy first.");
    const activeWallet = wallets[0];
    const eip1193Provider = await activeWallet.getEthereumProvider();
    const browserProvider = new ethers.BrowserProvider(eip1193Provider);
    const signer = await browserProvider.getSigner();
    const writeInstance = new ethers.Contract(contractAddresses.reputationRegistry, INT_REPUTATION_ABI, signer);

    const tx = await writeInstance.submitFeedback(BigInt(agentId), BigInt(targetsScore));
    await tx.wait();
    
    setAgents(prev => prev.map(a => a.id === String(agentId) ? { ...a, score: Number(targetsScore) } : a));
    
    return tx.hash;
  };

  const addLog = (type, msg, isSuccess = false) => {
    setEventsFeed(prev => [{
      time: new Date().toLocaleTimeString(),
      type,
      msg,
      isSuccess
    }, ...prev].slice(0, 50));
  };

  return { agents, vaultBalance, liveBlocks, eventsFeed, loading, executeAdminSlash, addLog };
}
