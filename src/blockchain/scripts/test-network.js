import { ethers } from "hardhat";

async function testNetwork() {
  try {
    console.log("🔍 Testing Base Sepolia connection...");
    
    // Test RPC connection
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log("✅ Connected to network:", network.name, "Chain ID:", network.chainId);
    
    // Test block number
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Latest block:", blockNumber);
    
    // Test account
    const [signer] = await ethers.getSigners();
    console.log("✅ Signer address:", signer.address);
    
    // Test balance
    const balance = await provider.getBalance(signer.address);
    console.log("✅ Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Low balance! Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    }
    
    console.log("🎉 Network test successful!");
    
  } catch (error) {
    console.error("❌ Network test failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("could not detect network")) {
      console.log("💡 Fix: Check your PRIVATE_KEY in .env file");
    }
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Fix: Get testnet ETH from Base faucet");
    }
  }
}

testNetwork();