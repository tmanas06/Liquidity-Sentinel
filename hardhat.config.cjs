require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.SENTINEL_DEPLOYER_KEY ? [process.env.SENTINEL_DEPLOYER_KEY] : []
    }
  }
};
