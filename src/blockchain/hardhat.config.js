import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config = {
  solidity: "0.8.19",
  networks: {}
};

// Only add networks if we have a valid private key
if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64) {
  config.networks["base-sepolia"] = {
    url: "https://sepolia.base.org",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 84532,
  };
  config.networks["base-mainnet"] = {
    url: "https://mainnet.base.org", 
    accounts: [process.env.PRIVATE_KEY],
    chainId: 8453,
  };
}

export default config;
