// scripts/compile.ts
// Compiles the HTLC contract and creates plutus.json

import { getContractInfo } from "../src/offchain/deployContract";
import { htlcScript } from "../contracts/htlc";
import { writeFileSync } from "fs";
import { join } from "path";

// Create plutus.json file
const plutusJson = {
  type: "PlutusScriptV2",
  description: "HTLC (Hash Time Lock Contract)",
  cborHex: htlcScript.cbor.toString()
};

// Get contract info
const contractInfo = getContractInfo();

// Save plutus.json
const plutusPath = join(process.cwd(), "plutus.json");
writeFileSync(plutusPath, JSON.stringify(plutusJson, null, 2));

// Save contract info
const contractPath = join(process.cwd(), "contract-info.json");
writeFileSync(contractPath, JSON.stringify(contractInfo, null, 2));

console.log("✅ Contract compiled successfully!");
console.log("\nFiles created:");
console.log("- plutus.json");
console.log("- contract-info.json");
console.log("\n📋 Contract Information:");
console.log("Script Address:", contractInfo.scriptAddress);
console.log("Script Hash:", contractInfo.scriptHash);
console.log("Network:", contractInfo.network);

console.log("\n🚀 Next Steps:");
console.log("1. Start the development server: npm run dev");
console.log("2. Connect your wallet in the UI");
console.log("3. Click 'Deploy Contract' to send ADA to the script address");
console.log("4. Use Lock/Redeem functions to test the HTLC");

console.log("\n🌐 Monitor deployment:");
console.log(`https://preprod.cardanoscan.io/address/${contractInfo.scriptAddress}`);
