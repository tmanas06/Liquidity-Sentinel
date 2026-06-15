import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAddresses from '../addresses.json';

const IDENTITY_ABI = [
  "event AgentRegistered(uint256 indexed agentId, string agentDomain, address agentAddress)"
];

const REPUTATION_ABI = [
  "function getSummary(uint256 agentId) external view returns (uint256)",
  "function submitFeedback(uint256 agentId, uint256 score) external"
];

export function useRegistry() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function scanRegistry() {
      try {
        const providerUrl = import.meta.env.VITE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
        const provider = new ethers.JsonRpcProvider(providerUrl);
        
        const identityContract = new ethers.Contract(contractAddresses.identityRegistry, IDENTITY_ABI, provider);
        const reputationContract = new ethers.Contract(contractAddresses.reputationRegistry, REPUTATION_ABI, provider);

        console.log("⚡ [RPC Sync] Scanning C-Chain for AgentRegistered events...");
        
        const filter = identityContract.filters.AgentRegistered();
        const events = await identityContract.queryFilter(filter, -2000); 

        const uniqueAgents = events.map(e => ({
            id: e.args.agentId.toString(),
            domain: e.args.agentDomain,
            address: e.args.agentAddress
        }));

        // Deduplicate in case of multiple events for same ID (though shouldn't happen for AgentRegistered)
        const uniqueIds = [...new Map(uniqueAgents.map(item => [item.id, item])).values()];
        
        const agentProfiles = await Promise.all(
          uniqueIds.map(async (agent) => {
            let score;
            try {
                score = await reputationContract.getSummary(BigInt(agent.id));
            } catch (e) {
                console.error("Error fetching summary for", agent.id, e);
                score = 0n;
            }
            
            return {
              id: agent.id,
              domain: agent.domain,
              addr: agent.address,
              score: Number(score),
              tier: Number(score) > 90 ? "Trusted Flow" : "Standard Risk",
              fee: Number(score) > 90 ? "$0.01 USDC" : "$0.50 USDC"
            };
          })
        );

        setAgents(agentProfiles);
        setLoading(false);
      } catch (err) {
        console.error("Failed on-chain event indexing:", err);
        setLoading(false);
      }
    }

    scanRegistry();
  }, []);

  const updateAgentReputation = async (agentId, newScore) => {
    if (!window.ethereum) throw new Error("No browser wallet detected");
    
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const writeContract = new ethers.Contract(contractAddresses.reputationRegistry, REPUTATION_ABI, signer);

    console.log(`[WRITE] Broadcasting reputation update for Agent ${agentId} to Fuji C-Chain...`);
    const tx = await writeContract.submitFeedback(BigInt(agentId), BigInt(newScore));
    await tx.wait();
    console.log(`[WRITE] Tx Confirmed: ${tx.hash}`);
    return tx.hash;
  };

  return { agents, loading, updateAgentReputation };
}
