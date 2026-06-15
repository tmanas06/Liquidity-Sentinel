const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Liquidity Sentinel Contracts", function () {
  let identityRegistry;
  let reputationRegistry;
  let mockVault;
  let owner;
  let validator;
  let agentWallet;
  let attacker;

  beforeEach(async function () {
    [owner, validator, agentWallet, attacker] = await ethers.getSigners();

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy ReputationRegistry
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    reputationRegistry = await ReputationRegistry.deploy(await identityRegistry.getAddress());
    await reputationRegistry.waitForDeployment();

    // Deploy MockFlashLoanVault with validator address as Sentinel API
    const MockFlashLoanVault = await ethers.getContractFactory("MockFlashLoanVault");
    mockVault = await MockFlashLoanVault.deploy(validator.address);
    await mockVault.waitForDeployment();
  });

  describe("IdentityRegistry", function () {
    it("should allow an agent to register and mint an identity NFT", async function () {
      const tx = await identityRegistry.connect(agentWallet).newAgent("agent1.sentinel.test", agentWallet.address);
      await tx.wait();

      const [id, domain, addr] = await identityRegistry.getAgent(1);
      expect(id).to.equal(1n);
      expect(domain).to.equal("agent1.sentinel.test");
      expect(addr).to.equal(agentWallet.address);

      // Verify ERC-721 ownership and balance
      expect(await identityRegistry.ownerOf(1)).to.equal(agentWallet.address);
      expect(await identityRegistry.balanceOf(agentWallet.address)).to.equal(1n);
    });

    it("should revert if domain or address is already registered", async function () {
      await identityRegistry.connect(agentWallet).newAgent("agent1.sentinel.test", agentWallet.address);

      await expect(
        identityRegistry.connect(attacker).newAgent("agent1.sentinel.test", attacker.address)
      ).to.be.revertedWithCustomError(identityRegistry, "DomainAlreadyRegistered");

      await expect(
        identityRegistry.connect(attacker).newAgent("agent2.sentinel.test", agentWallet.address)
      ).to.be.revertedWithCustomError(identityRegistry, "AddressAlreadyRegistered");
    });
  });

  describe("ReputationRegistry", function () {
    beforeEach(async function () {
      // Register agent first
      await identityRegistry.connect(agentWallet).newAgent("agent1.sentinel.test", agentWallet.address);
    });

    it("should return a default score of 95 for registered agents with no feedback", async function () {
      const score = await reputationRegistry.getSummary(1);
      expect(score).to.equal(95n);
    });

    it("should allow the owner/validator to submit feedback and update the score", async function () {
      // Set validator status
      await reputationRegistry.setValidator(validator.address, true);

      // Submit feedback as validator
      const tx = await reputationRegistry.connect(validator).submitFeedback(1, 85);
      await tx.wait();

      const newScore = await reputationRegistry.getSummary(1);
      expect(newScore).to.equal(85n);
    });

    it("should reject feedback submissions from unauthorized addresses", async function () {
      await expect(
        reputationRegistry.connect(attacker).submitFeedback(1, 40)
      ).to.be.reverted;
    });

    it("should reject scores greater than 100", async function () {
      await reputationRegistry.setValidator(validator.address, true);
      await expect(
        reputationRegistry.connect(validator).submitFeedback(1, 105)
      ).to.be.revertedWith("Score must be between 0 and 100");
    });
  });

  describe("MockFlashLoanVault", function () {
    it("should allow execution when called by the authorized Sentinel API", async function () {
      const tx = await mockVault.connect(validator).executeMockFlashLoan(agentWallet.address, ethers.parseEther("100"));
      expect(tx).to.not.be.reverted;
    });

    it("should revert when execution is triggered by an unauthorized caller", async function () {
      await expect(
        mockVault.connect(attacker).executeMockFlashLoan(agentWallet.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Only Sentinel API can trigger flash loan");
    });
  });
});
