// src/offchain/lockTx.ts

import { BrowserWallet, Transaction } from "@meshsdk/core";
import { htlcAddress, createHTLCDatum } from "../../contracts/htlc";

export async function lockHTLC(
  wallet: BrowserWallet,
  amount: number,
  secret: string,
  receiverAddress: string
): Promise<string> {
  
  // Get sender address
  const senderAddress = await wallet.getChangeAddress();
  
  console.log("Locking HTLC:");
  console.log("- Amount:", amount, "ADA");
  console.log("- Secret:", secret);
  console.log("- Receiver:", receiverAddress);
  console.log("- Sender:", senderAddress);
  console.log("- Script Address:", htlcAddress);
  
  try {
    // Create the HTLC datum with proper structure
    const datum = await createHTLCDatum(
      secret,
      receiverAddress,
      senderAddress,
      24 // 24 hour timelock
    );
    
    console.log("Created datum:", datum);
    
    // Create transaction using MeshSDK
    const tx = new Transaction({ initiator: wallet });
    
    // Send to script address with inline datum
    tx.sendLovelace(
      {
        address: htlcAddress,
        datum: {
          value: datum,
          inline: true
        }
      },
      (amount * 1_000_000).toString()
    );
    
    console.log("Building transaction...");
    const unsignedTx = await tx.build();
    
    console.log("Signing transaction...");
    const signedTx = await wallet.signTx(unsignedTx);
    
    console.log("Submitting transaction...");
    const txHash = await wallet.submitTx(signedTx);
    
    console.log("Lock transaction submitted successfully:", txHash);
    return txHash;
    
  } catch (error) {
    console.error("Detailed lock error:", error);
    throw new Error(`Failed to lock HTLC: ${error}`);
  }
}
