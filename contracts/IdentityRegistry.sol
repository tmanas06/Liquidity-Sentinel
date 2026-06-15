// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {Constants} from "./libraries/Constants.sol";

contract IdentityRegistry is IIdentityRegistry {
    // --- ERC-721 Storage & Interface ---
    string public constant name = "ERC-8004 Agent Identity";
    string public constant symbol = "AGENT";

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) {
            revert AgentNotFound(tokenId);
        }
        return owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        if (owner == address(0)) {
            revert InvalidAddress();
        }
        return _balances[owner];
    }

    // --- ERC-8004 Registries ---
    uint256 private _agentCount;
    mapping(uint256 => Agent) private _agentById;
    mapping(string => uint256) private _agentIdByDomain;
    mapping(address => uint256) private _agentIdByAddress;

    constructor() {
        _agentCount = 0;
    }

    /// @inheritdoc IIdentityRegistry
    function newAgent(string calldata agentDomain, address agentAddress) external override returns (uint256 agentId_) {
        if (bytes(agentDomain).length == 0) {
            revert InvalidDomain();
        }
        if (agentAddress == address(0)) {
            revert InvalidAddress();
        }
        if (_agentIdByDomain[agentDomain] != 0) {
            revert DomainAlreadyRegistered(agentDomain);
        }
        if (_agentIdByAddress[agentAddress] != 0) {
            revert AddressAlreadyRegistered(agentAddress);
        }
        // Deployer or agentAddress itself can mint
        if (msg.sender != agentAddress) {
            revert Unauthorized(msg.sender, agentAddress);
        }

        unchecked {
            agentId_ = ++_agentCount;
        }

        // Store agent card info
        _agentById[agentId_] = Agent({domain: agentDomain, addr: agentAddress});
        _agentIdByDomain[agentDomain] = agentId_;
        _agentIdByAddress[agentAddress] = agentId_;

        // Mint ERC-721 Token representing agent identity
        _balances[agentAddress] += 1;
        _owners[agentId_] = agentAddress;

        emit Transfer(address(0), agentAddress, agentId_);
        emit AgentRegistered(agentId_, agentDomain, agentAddress);
    }

    /// @inheritdoc IIdentityRegistry
    function updateAgent(uint256 agentId, string calldata newAgentDomain, address newAgentAddress)
        external
        override
        returns (bool success_)
    {
        Agent storage agent = _agentById[agentId];
        address currentOwner = _owners[agentId];

        if (currentOwner == address(0)) {
            revert AgentNotFound(agentId);
        }
        if (msg.sender != currentOwner) {
            revert Unauthorized(msg.sender, currentOwner);
        }

        if (
            bytes(newAgentDomain).length != 0 && _agentIdByDomain[newAgentDomain] != 0
                && keccak256(bytes(newAgentDomain)) != keccak256(bytes(agent.domain))
        ) {
            revert DomainAlreadyRegistered(newAgentDomain);
        }
        if (
            newAgentAddress != address(0) && _agentIdByAddress[newAgentAddress] != 0
                && _agentIdByAddress[newAgentAddress] != agentId
        ) {
            revert AddressAlreadyRegistered(newAgentAddress);
        }

        string memory previousDomain = agent.domain;
        address previousAddress = agent.addr;

        if (bytes(newAgentDomain).length != 0) {
            delete _agentIdByDomain[agent.domain];
            agent.domain = newAgentDomain;
            _agentIdByDomain[newAgentDomain] = agentId;
        }
        if (newAgentAddress != address(0)) {
            delete _agentIdByAddress[agent.addr];
            agent.addr = newAgentAddress;
            _agentIdByAddress[newAgentAddress] = agentId;

            // Move the ERC-721 token ownership
            _balances[currentOwner] -= 1;
            _balances[newAgentAddress] += 1;
            _owners[agentId] = newAgentAddress;

            emit Transfer(currentOwner, newAgentAddress, agentId);
        }

        success_ = true;
        emit AgentUpdated(agentId, previousDomain, agent.domain, previousAddress, agent.addr);
    }

    /// @inheritdoc IIdentityRegistry
    function getAgent(uint256 agentId)
        external
        view
        override
        returns (uint256 agentId_, string memory agentDomain_, address agentAddress_)
    {
        Agent storage agent = _agentById[agentId];

        if (agent.addr == address(0)) {
            return (Constants.AGENT_ID_NONE, Constants.AGENT_DOMAIN_NONE, Constants.AGENT_ADDRESS_NONE);
        }

        agentId_ = agentId;
        agentDomain_ = agent.domain;
        agentAddress_ = agent.addr;
    }

    /// @inheritdoc IIdentityRegistry
    function resolveAgentByDomain(string calldata agentDomain)
        external
        view
        override
        returns (uint256 agentId_, string memory agentDomain_, address agentAddress_)
    {
        uint256 agentId = _agentIdByDomain[agentDomain];
        if (agentId == 0) {
            return (Constants.AGENT_ID_NONE, Constants.AGENT_DOMAIN_NONE, Constants.AGENT_ADDRESS_NONE);
        }

        Agent storage agent = _agentById[agentId];
        agentId_ = agentId;
        agentDomain_ = agent.domain;
        agentAddress_ = agent.addr;
    }

    /// @inheritdoc IIdentityRegistry
    function resolveAgentByAddress(address agentAddress)
        external
        view
        override
        returns (uint256 agentId_, string memory agentDomain_, address agentAddress_)
    {
        uint256 agentId = _agentIdByAddress[agentAddress];
        if (agentId == 0) {
            return (Constants.AGENT_ID_NONE, Constants.AGENT_DOMAIN_NONE, Constants.AGENT_ADDRESS_NONE);
        }

        Agent storage agent = _agentById[agentId];
        agentId_ = agentId;
        agentDomain_ = agent.domain;
        agentAddress_ = agent.addr;
    }
}
