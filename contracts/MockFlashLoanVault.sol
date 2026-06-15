// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockFlashLoanVault {
    address public sentinelApi;
    address public owner;

    event FlashLoanExecuted(address indexed recipient, uint256 amount);
    event SentinelApiUpdated(address indexed previousApi, address indexed newApi);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlySentinel() {
        require(msg.sender == sentinelApi, "Only Sentinel API can trigger flash loan");
        _;
    }

    constructor(address _sentinelApi) {
        owner = msg.sender;
        sentinelApi = _sentinelApi;
    }

    function setSentinelApi(address _sentinelApi) external onlyOwner {
        emit SentinelApiUpdated(sentinelApi, _sentinelApi);
        sentinelApi = _sentinelApi;
    }

    function executeMockFlashLoan(address recipient, uint256 amount) external onlySentinel returns (bool) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        
        emit FlashLoanExecuted(recipient, amount);
        return true;
    }
}
