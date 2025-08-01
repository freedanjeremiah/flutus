// src/offchain/refundTx.ts

import { BrowserWallet, Transaction } from "@meshsdk/core";
import { htlcAddress, htlcScript, createRefundRedeemer } from "../../contracts/htlc";

export async function refundHTLC(
  wallet: BrowserWallet,
  projectId: string
): Promise<string> {
  
  const myAddress = await wallet.getChangeAddress();
  
  console.log("Refunding HTLC:");
  console.log("- My Address:", myAddress);
  console.log("- Script Address:", htlcAddress);
  
  try {
    // Get UTxOs at the script address using Blockfrost
    const blockfrostUrl = process.env.NEXT_PUBLIC_BLOCKFROST_API_URL || "https://cardano-preprod.blockfrost.io/api/v0";
    const response = await fetch(`${blockfrostUrl}/addresses/${htlcAddress}/utxos`, {
      headers: {
        'project_id': projectId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Blockfrost API error: ${response.status} ${response.statusText}`);
    }
    
    const utxos = await response.json();
    console.log("Found UTxOs:", utxos);
    
    if (!utxos || utxos.length === 0) {
      throw new Error("No UTxOs found at script address");
    }
    
    // Use the first UTxO
    const utxo = utxos[0];
    console.log("Using UTXO:", utxo.tx_hash + "#" + utxo.output_index);
    
    // Create the refund redeemer
    const redeemer = createRefundRedeemer();
    console.log("Created refund redeemer:", redeemer);
    
    // Create transaction to spend from script
    const tx = new Transaction({ initiator: wallet });
    
    // Prepare the script UTxO for spending
    const scriptUtxo = {
      input: {
        outputIndex: utxo.output_index,
        txHash: utxo.tx_hash,
      },
      output: {
        address: htlcAddress,
        amount: utxo.amount,
        dataHash: utxo.data_hash,
        datum: utxo.inline_datum,
      },
    };
    
    console.log("Script UTxO prepared:", scriptUtxo);
    
    // Add script input with refund redeemer
    tx.redeemValue({
      value: scriptUtxo,
      script: {
        version: "V2",
        code: htlcScript.cbor.toString(),
      },
      datum: utxo.inline_datum || utxo.data_hash,
      redeemer: {
        data: redeemer,
        budget: {
          mem: 10000000,
          steps: 10000000,
        }
      }
    });
    
    // Calculate output amount (subtract estimated fees)
    const lovelaceAmount = utxo.amount.find((a: any) => a.unit === "lovelace")?.quantity || 0;
    const outputAmount = parseInt(lovelaceAmount) - 500000; // Reserve 0.5 ADA for fees
    
    if (outputAmount > 0) {
      tx.sendLovelace(myAddress, outputAmount.toString());
    }
    
    console.log("Building transaction...");
    const unsignedTx = await tx.build();
    
    console.log("Signing transaction...");
    const signedTx = await wallet.signTx(unsignedTx);
    
    console.log("Submitting transaction...");
    const txHash = await wallet.submitTx(signedTx);
    
    console.log("Refund transaction submitted successfully:", txHash);
    return txHash;
    
  } catch (error) {
    console.error("Detailed refund error:", error);
    throw new Error(`Failed to refund HTLC: ${error}`);
  }
}
