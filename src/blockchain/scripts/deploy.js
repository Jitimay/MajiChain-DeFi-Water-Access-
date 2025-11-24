import { ethers } from "hardhat";

async function main() {
  console.log("Deploying WaterBroker contract...");
  
  const WaterBroker = await ethers.getContractFactory("WaterBroker");
  const waterBroker = await WaterBroker.deploy();
  
  await waterBroker.waitForDeployment();
  
  const address = await waterBroker.getAddress();
  console.log("WaterBroker deployed to:", address);
  
  // Save deployment info
  const deploymentInfo = {
    address: address,
    network: "base-sepolia",
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };
  
  console.log("Deployment Info:", deploymentInfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
