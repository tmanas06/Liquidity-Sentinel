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

  return {
    agentId: String(agentId),
    score: 0,
    source: "unimplemented-rpc-adapter",
    warning: "Reputation RPC mode needs Dev A's final ABI return shape before it can read getSummary(agentId)."
  };
}

export function priceFromReputation(reputation, config) {
  const trusted = Number(reputation.score) > 90;
  return {
    amount: trusted ? config.lowTierAmount : config.highTierAmount,
    pricingTier: trusted ? "trusted-agent" : "standard-risk"
  };
}

