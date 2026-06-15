// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationRegistry {
    event AuthFeedback(uint256 indexed agentClientId, uint256 indexed agentServerId, bytes32 indexed feedbackAuthId);
    event FeedbackSubmitted(uint256 indexed agentId, uint256 score, address indexed validator);

    error InvalidIdentityRegistryAddress();
    error AgentNotFound(uint256 agentId);
    error Unauthorized(address caller, address expected);

    function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external;
    
    // Custom functions for dynamic pricing
    function getSummary(uint256 agentId) external view returns (uint256);
    function readFeedback(uint256 agentId) external view returns (uint256);
    function submitFeedback(uint256 agentId, uint256 score) external;
}
