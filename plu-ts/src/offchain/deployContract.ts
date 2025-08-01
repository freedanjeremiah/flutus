// src/offchain/deployContract.ts

import { htlcScript, htlcAddress, scriptHash } from "../../contracts/htlc";
import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";
import { TxBuilder } from "@harmoniclabs/plu-ts";
import { fromHex, toHex } from "@harmoniclabs/uint8array-utils";
import { BrowserWallet, Transaction, BlockfrostProvider } from "@meshsdk/core";

/**
 * Real deployment of HTLC contract to Cardano testnet
 * This involves creating plutus.json, generating address, and funding it
 */
export async function deployHTLCContract(
  wallet: BrowserWallet,
  blockfrostApiKey: string,
  deploymentAmount: number = 2 // ADA to send to script address
): Promise<any> {
  
  const apiKey = blockfrostApiKey || process.env.BLOCKFROST_API_KEY || process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  
  if (!apiKey) {
    throw new Error("Blockfrost API key is required");
  }

  if (!wallet) {
    throw new Error("Wallet connection is required");
  }

  try {
    // Step 1: Generate Plutus JSON format
    const plutusJson = {
      type: "PlutusScriptV2",
      description: "HTLC (Hash Time Lock Contract)",
      cborHex: htlcScript.cbor.toString()
    };

    // Step 2: Get the script address (already generated in contract)
    const scriptAddress = htlcAddress;
    const deployerAddress = await wallet.getChangeAddress();

    // Step 3: Initialize Blockfrost provider
    const blockfrost = new BlockfrostProvider(apiKey, 0); // 0 for preprod

    // Step 4: Create deployment transaction - send ADA to script address
    const tx = new Transaction({ initiator: wallet });
    
    // Send deployment amount to script address to make it "live"
    tx.sendLovelace(
      scriptAddress,
      (deploymentAmount * 1_000_000).toString() // Convert ADA to lovelace
    );

    // Step 5: Build, sign and submit transaction
    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);

    // Step 6: Wait for transaction confirmation
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Step 7: Verify deployment by checking script address has funds
    const response = await fetch(`https://cardano-preprod.blockfrost.io/api/v0/addresses/${scriptAddress}`, {
      headers: { 'project_id': apiKey }
    });
    
    const addressInfo = await response.json();
    const balance = addressInfo.amount?.find((a: any) => a.unit === "lovelace")?.quantity || "0";

    // Step 8: Create deployment record
    const deploymentInfo = {
      contractName: "HTLC",
      scriptHash: scriptHash,
      scriptAddress: scriptAddress,
      plutusJson: plutusJson,
      deploymentTxHash: txHash,
      deployerAddress: deployerAddress,
      deploymentAmount: deploymentAmount,
      actualBalance: parseInt(balance),
      network: "preprod",
      deployedAt: new Date().toISOString(),
      version: "1.0.0",
      status: parseInt(balance) > 0 ? "deployed" : "pending"
    };

    // Step 9: Contract deployed successfully  
    console.log("✅ HTLC Contract deployed to blockchain!");
    console.log("📋 Plutus JSON:", JSON.stringify(plutusJson, null, 2));
    console.log("🚀 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

    return deploymentInfo;
    
  } catch (error) {
    throw new Error(`Contract deployment failed: ${error}`);
  }
}

/**
 * Check if contract is already deployed by checking if script address has funds
 */
export async function checkDeploymentStatus(blockfrostApiKey: string): Promise<any> {
  const apiKey = blockfrostApiKey || process.env.BLOCKFROST_API_KEY || process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  
  if (!apiKey) {
    throw new Error("Blockfrost API key is required");
  }

  try {
    const response = await fetch(`https://cardano-preprod.blockfrost.io/api/v0/addresses/${htlcAddress}`, {
      headers: { 'project_id': apiKey }
    });
    
    if (!response.ok) {
      return { deployed: false, balance: 0, error: "Address not found" };
    }
    
    const addressInfo = await response.json();
    const balance = addressInfo.amount?.find((a: any) => a.unit === "lovelace")?.quantity || "0";
    
    return {
      deployed: parseInt(balance) > 0,
      balance: parseInt(balance),
      scriptAddress: htlcAddress,
      scriptHash: scriptHash
    };
  } catch (error) {
    return { deployed: false, balance: 0, error: error };
  }
}

/**
 * Get contract info without deployment
 */
export function getContractInfo() {
  return {
    contractName: "HTLC",
    scriptHash: scriptHash,
    scriptAddress: htlcAddress,
    network: "preprod",
    version: "1.0.0"
  };
}
