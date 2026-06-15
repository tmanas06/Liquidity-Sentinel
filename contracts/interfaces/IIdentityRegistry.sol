// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIdentityRegistry {
    struct Agent {
        string domain;
        address addr;
    }

    event AgentRegistered(uint256 indexed agentId, string indexed agentDomain, address indexed agentAddress);
    event AgentUpdated(
        uint256 indexed agentId,
        string previousAgentDomain,
        string indexed newAgentDomain,
        address previousAgentAddress,
        address indexed newAgentAddress
    );

    error Unauthorized(address caller, address expected);
    error InvalidDomain();
    error InvalidAddress();
    error DomainAlreadyRegistered(string domain);
    error AddressAlreadyRegistered(address agentAddress);
    error AgentNotFound(uint256 agentId);

    function newAgent(string calldata agentDomain, address agentAddress) external returns (uint256 agentId_);
    function updateAgent(uint256 agentId, string calldata newAgentDomain, address newAgentAddress) external returns (bool success_);
    function getAgent(uint256 agentId) external view returns (uint256 agentId_, string memory agentDomain_, address agentAddress_);
    function resolveAgentByDomain(string calldata agentDomain) external view returns (uint256 agentId_, string memory agentDomain_, address agentAddress_);
    function resolveAgentByAddress(address agentAddress) external view returns (uint256 agentId_, string memory agentDomain_, address agentAddress_);
}
