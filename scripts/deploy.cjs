const hre = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy IdentityRegistry
  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log("IdentityRegistry deployed to:", identityRegistryAddress);

  // 2. Deploy ReputationRegistry
  const ReputationRegistry = await hre.ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy(identityRegistryAddress);
  await reputationRegistry.waitForDeployment();
  const reputationRegistryAddress = await reputationRegistry.getAddress();
  console.log("ReputationRegistry deployed to:", reputationRegistryAddress);

  // 3. Deploy MockFlashLoanVault
  const MockFlashLoanVault = await hre.ethers.getContractFactory("MockFlashLoanVault");
  const mockVault = await MockFlashLoanVault.deploy(deployer.address); // Deployer acts as Sentinel API for simplicity
  await mockVault.waitForDeployment();
  const mockVaultAddress = await mockVault.getAddress();
  console.log("MockFlashLoanVault deployed to:", mockVaultAddress);

  // 4. Mint a test agent NFT (representing agentId = 1)
  console.log("Registering test agent: agent1.sentinel.test ->", deployer.address);
  const tx = await identityRegistry.newAgent("agent1.sentinel.test", deployer.address);
  await tx.wait();
  console.log("Test Agent ID 1 registered successfully!");

  // 5. Write deployed addresses to a JSON configuration file for the API and agent
  const configDir = path.resolve(__dirname, "../api/src/config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const addresses = {
    identityRegistry: identityRegistryAddress,
    reputationRegistry: reputationRegistryAddress,
    mockVault: mockVaultAddress,
    sentinelApiAddress: deployer.address
  };

  fs.writeFileSync(
    path.join(configDir, "addresses.json"),
    JSON.stringify(addresses, null, 2),
    "utf8"
  );
  console.log("Saved deployed addresses to api/src/config/addresses.json");

  // 6. Write contract ABIs to allow API to interact with them
  const abiDir = path.resolve(__dirname, "../shared/abis");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  // Helper to extract ABI from build artifacts
  const saveAbi = (contractName) => {
    const artifactPath = path.resolve(
      __dirname,
      `../artifacts/contracts/${contractName}.sol/${contractName}.json`
    );
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(
        path.join(abiDir, `${contractName}.json`),
        JSON.stringify(artifact.abi, null, 2),
        "utf8"
      );
      console.log(`Saved ABI for ${contractName} to shared/abis/${contractName}.json`);
    } else {
      console.warn(`Artifact not found for ${contractName} at ${artifactPath}`);
    }
  };

  saveAbi("IdentityRegistry");
  saveAbi("ReputationRegistry");
  saveAbi("MockFlashLoanVault");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
