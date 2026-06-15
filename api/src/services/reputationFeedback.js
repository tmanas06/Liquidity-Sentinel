export async function submitOnChainFeedback(agentId, score, config) {
  if (config.reputationMode === "mock" || !config.reputationRegistryAddress || !config.sentinelPrivateKey) {
    return {
      status: "skipped",
      reason: "Mock mode active, or ReputationRegistry address / Sentinel key is not configured."
    };
  }

  try {
    const { JsonRpcProvider, Wallet, Contract } = await import("ethers");
    const provider = new JsonRpcProvider(config.fujiRpcUrl);
    const wallet = new Wallet(config.sentinelPrivateKey, provider);
    const contract = new Contract(
      config.reputationRegistryAddress,
      ["function submitFeedback(uint256 agentId, uint256 score) external"],
      wallet
    );
    
    console.log(`Submitting on-chain feedback: agentId ${agentId} -> score ${score}`);
    const tx = await contract.submitFeedback(BigInt(agentId), BigInt(score));
    
    // Wait for confirmation asynchronously
    tx.wait(1).then((receipt) => {
      console.log(`Reputation feedback tx confirmed at block ${receipt.blockNumber}`);
    }).catch((err) => {
      console.error(`Feedback tx confirmation failed: ${err.message}`);
    });

    return {
      status: "broadcasted",
      txHash: tx.hash
    };
  } catch (err) {
    console.error(`Failed to submit feedback: ${err.message}`);
    return {
      status: "failed",
      error: err.message
    };
  }
}
