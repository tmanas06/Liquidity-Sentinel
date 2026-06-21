export async function readReputation(agentId, config) {
  if (config.reputationMode === "mock") {
    return {
      agentId: String(agentId),
      score: config.mockReputationScore,
      source: "mock"
    };
  }

  if (config.reputationMode === "static-low") {
    return {
      agentId: String(agentId),
      score: 50,
      source: "static-low"
    };
  }

  try {
    const { JsonRpcProvider, Contract } = await import("ethers");
    const provider = new JsonRpcProvider(config.fujiRpcUrl);
    const contract = new Contract(
      config.reputationRegistryAddress,
      ["function getSummary(uint256 agentId) view returns (uint256)"],
      provider
    );
    const score = await contract.getSummary(BigInt(agentId));
    return {
      agentId: String(agentId),
      score: Number(score),
      source: "rpc"
    };
  } catch (err) {
    return {
      agentId: String(agentId),
      score: 0,
      source: "rpc-error",
      warning: `Failed to read reputation from contract: ${err.message}`
    };
  }
}

export function priceFromReputation(reputation, config) {
  const score = Number(reputation.score);
  if (score >= 80) {
    return {
      amount: config.lowTierAmount,
      pricingTier: "trusted-agent"
    };
  } else if (score >= 40) {
    return {
      amount: config.midTierAmount,
      pricingTier: "standard-risk"
    };
  } else {
    return {
      amount: config.highTierAmount,
      pricingTier: "new-agent"
    };
  }
}

