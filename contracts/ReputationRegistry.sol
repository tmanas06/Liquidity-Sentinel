// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";
import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {Constants} from "./libraries/Constants.sol";

contract ReputationRegistry is IReputationRegistry {
    IIdentityRegistry public immutable identityRegistry;

    address public owner;
    uint256 private _feedbackCount;

    // Track numerical scores (0-100) for agents
    mapping(uint256 => uint256) private _agentScores;
    // Track authorized validators who can submit scores/feedback
    mapping(address => bool) public authorizedValidators;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized(msg.sender, owner);
        }
        _;
    }

    modifier onlyValidator() {
        if (!authorizedValidators[msg.sender] && msg.sender != owner) {
            revert Unauthorized(msg.sender, owner);
        }
        _;
    }

    constructor(address identityRegistryAddress) {
        if (identityRegistryAddress == address(0)) {
            revert InvalidIdentityRegistryAddress();
        }
        owner = msg.sender;
        authorizedValidators[msg.sender] = true;
        identityRegistry = IIdentityRegistry(identityRegistryAddress);
    }

    function setValidator(address validator, bool status) external onlyOwner {
        authorizedValidators[validator] = status;
    }

    /// @inheritdoc IReputationRegistry
    function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external override {
        (,, address agentClientAddress) = identityRegistry.getAgent(agentClientId);
        if (agentClientAddress == Constants.AGENT_ADDRESS_NONE) {
            revert AgentNotFound(agentClientId);
        }

        (,, address agentServerAddress) = identityRegistry.getAgent(agentServerId);
        if (agentServerAddress == Constants.AGENT_ADDRESS_NONE) {
            revert AgentNotFound(agentServerId);
        }
        if (msg.sender != agentServerAddress) {
            revert Unauthorized(msg.sender, agentServerAddress);
        }

        bytes32 feedbackAuthId = _generateFeedbackAuthId(agentClientId, agentServerId);
        emit AuthFeedback(agentClientId, agentServerId, feedbackAuthId);
    }

    /// @inheritdoc IReputationRegistry
    function getSummary(uint256 agentId) external view override returns (uint256) {
        (,, address agentAddr) = identityRegistry.getAgent(agentId);
        if (agentAddr == Constants.AGENT_ADDRESS_NONE) {
            revert AgentNotFound(agentId);
        }
        
        uint256 score = _agentScores[agentId];
        if (score == 0) {
            // Default score for registered agents without feedback
            return 95;
        }
        return score;
    }

    /// @inheritdoc IReputationRegistry
    function readFeedback(uint256 agentId) external view override returns (uint256) {
        return this.getSummary(agentId);
    }

    /// @inheritdoc IReputationRegistry
    function submitFeedback(uint256 agentId, uint256 score) external override onlyValidator {
        (,, address agentAddr) = identityRegistry.getAgent(agentId);
        if (agentAddr == Constants.AGENT_ADDRESS_NONE) {
            revert AgentNotFound(agentId);
        }
        
        if (score > 100) {
            revert("Score must be between 0 and 100");
        }

        _agentScores[agentId] = score;
        emit FeedbackSubmitted(agentId, score, msg.sender);
    }

    function _generateFeedbackAuthId(uint256 agentClientId, uint256 agentServerId)
        private
        returns (bytes32 feedbackAuthId_)
    {
        unchecked {
            feedbackAuthId_ = keccak256(
                abi.encodePacked(block.chainid, address(this), agentClientId, agentServerId, ++_feedbackCount)
            );
        }
    }
}
