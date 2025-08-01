// src/offchain/txBuilder.ts

import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";
import { TxBuilder, TxOut, UTxO, Address, Value } from "@harmoniclabs/plu-ts";
import { htlcScript, htlcAddress } from "../../contracts/htlc";

/**
 * Initialize a real plu-ts TxBuilder with Blockfrost
 */
export async function initializeTxBuilder(blockfrostApiKey: string): Promise<TxBuilder> {
  const blockfrost = new BlockfrostPluts({
    projectId: blockfrostApiKey.replace(/^preprod/, ""),
    network: "preprod"
  });
  
  const protocolParams = await blockfrost.getProtocolParameters();
  return new TxBuilder(protocolParams);
}

/**
 * Build a real lock transaction using plu-ts
 */
export async function buildLockTransaction(
  txBuilder: TxBuilder,
  senderAddress: string,
  amount: bigint,
  datum: any
): Promise<string> {
  
  console.log("Building lock transaction with plu-ts...");
  
  // Create the transaction output to the script address
  const scriptOutput = new TxOut(
    Address.fromString(htlcAddress),
    Value.lovelace(amount),
    datum // Include the datum
  );
  
  // Build the transaction
  const tx = txBuilder.buildSync({
    inputs: [], // Will be filled automatically by txBuilder
    outputs: [scriptOutput],
    fee: Value.lovelace(200000n), // Estimated fee
    changeAddress: Address.fromString(senderAddress)
  });
  
  return tx.toCbor().toString();
}

/**
 * Build a real unlock transaction using plu-ts
 */
export async function buildUnlockTransaction(
  txBuilder: TxBuilder,
  blockfrost: BlockfrostPluts,
  receiverAddress: string,
  secret: string
): Promise<string> {
  
  console.log("Building unlock transaction with plu-ts...");
  
  // Get UTxOs at script address
  const scriptUtxos = await blockfrost.utxosAt(htlcAddress);
  
  if (scriptUtxos.length === 0) {
    throw new Error("No UTxOs found at script address");
  }
  
  const utxoToSpend = scriptUtxos[0];
  const outputValue = utxoToSpend.resolved.value;
  
  // Create redeemer with secret
  const redeemer = {
    alternative: 0, // Reveal
    fields: [Array.from(new TextEncoder().encode(secret))]
  };
  
  // Create output to receiver
  const receiverOutput = new TxOut(
    Address.fromString(receiverAddress),
    Value.lovelace(outputValue.lovelace - 300000n), // Subtract fees
  );
  
  // Build transaction with script input
  const tx = txBuilder.buildSync({
    inputs: [{
      utxo: utxoToSpend,
      inputScript: {
        script: htlcScript,
        redeemer: redeemer
      }
    }],
    outputs: [receiverOutput],
    fee: Value.lovelace(300000n),
    changeAddress: Address.fromString(receiverAddress)
  });
  
  return tx.toCbor().toString();
}

/**
 * Submit transaction using Blockfrost
 */
export async function submitTransaction(
  blockfrost: BlockfrostPluts,
  txCbor: string
): Promise<string> {
  const txHash = await blockfrost.submitTx(txCbor);
  return txHash;
}
