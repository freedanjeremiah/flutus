// scripts/deploy.ts

import { config } from "dotenv";
import { deployHTLCContract } from "../src/offchain/deployContract";

// Load environment variables
config();

async function main() {
  console.log("🚀 Deploying HTLC Contract...");
  console.log("===============================\n");

  try {
    const deploymentInfo = await deployHTLCContract();

    console.log("\n📋 Deployment Summary:");
    console.log("======================");
    console.log(`Contract: ${deploymentInfo.contractName}`);
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Script Hash: ${deploymentInfo.scriptHash}`);
    console.log(`Script Address: ${deploymentInfo.scriptAddress}`);
    console.log(`Script Size: ${deploymentInfo.scriptSizeBytes} bytes`);
    console.log(`Blockfrost Connected: ${deploymentInfo.blockfrostConnected}`);
    console.log(`Deployed At: ${deploymentInfo.deployedAt}`);

    console.log("\n✅ Deployment Complete!");
    console.log("\n🔗 You can now:");
    console.log("1. Copy the script address and check it on CardanoScan");
    console.log("2. Use the frontend to interact with the contract");
    console.log("3. Test lock/unlock functionality");

    console.log(`\n🌐 CardanoScan Link (Preprod):`);
    console.log(`https://preprod.cardanoscan.io/address/${deploymentInfo.scriptAddress}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    console.log("\n💡 Make sure you have:");
    console.log("1. BLOCKFROST_API_KEY set in your .env file");
    console.log("2. SEED_PHRASE set in your .env file");
    console.log("3. Internet connection for Blockfrost access");
    process.exit(1);
  }
}

main().catch(console.error);
