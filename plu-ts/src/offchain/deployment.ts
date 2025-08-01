// src/offchain/deployment.ts
import { 
  BrowserWallet, 
  Transaction, 
  BlockfrostProvider,
  MeshTxBuilder,
  UTxO,
  PlutusScript,
  Asset
} from "@meshsdk/core";
import { htlcScript, htlcAddress } from "../../contracts/htlc";

export interface DeploymentResult {
  txHash: string;
  scriptAddress: string;
  plutusJson: any;
  deployed: boolean;
}

/**
 * Deploy HTLC contract to Cardano testnet
 * 1. Convert plu-ts script to plutus.json format
 * 2. Generate script address 
 * 3. Send ADA to script address to deploy
 */
export async function deployHTLCContract(
  wallet: BrowserWallet,
  amountLovelace: string = "2000000" // 2 ADA minimum
): Promise<DeploymentResult> {
  
  // Step 1: Convert plu-ts script to Plutus JSON format
  const plutusJson = {
    type: "PlutusScriptV2",
    description: "Hash Time Lock Contract",
    cborHex: htlcScript.cbor.toString()
  };
  
  // Step 2: Get script address as bech32 string
  const scriptAddress = htlcAddress.toString();
  
  // Step 3: Create transaction to fund script address (deployment)
  const txBuilder = new MeshTxBuilder({
    fetcher: new BlockfrostProvider(process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!),
    submitter: wallet,
  });
  
  // Get wallet address for change
  const walletAddress = await wallet.getChangeAddress();
  
  // Build funding transaction
  const unsignedTx = await txBuilder
    .txOut(scriptAddress, [
      {
        unit: "lovelace", 
        quantity: amountLovelace
      }
    ])
    .changeAddress(walletAddress)
    .complete();
  
  // Sign and submit transaction
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);
  
  // Wait for confirmation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verify deployment by checking script address balance
  const provider = new BlockfrostProvider(process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!);
  const utxos = await provider.fetchAddressUTxOs(scriptAddress);
  const deployed = utxos.length > 0;
  
  return {
    txHash,
    scriptAddress,
    plutusJson,
    deployed
  };
}

/**
 * Create a lock transaction that sends ADA to the HTLC with secret hash as datum
 */
export async function lockFunds(
  wallet: BrowserWallet,
  secretHash: string,
  amountLovelace: string
): Promise<string> {
  
  const scriptAddress = htlcAddress.toString();
  
  const txBuilder = new MeshTxBuilder({
    fetcher: new BlockfrostProvider(process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!),
    submitter: wallet,
  });
  
  const walletAddress = await wallet.getChangeAddress();
  
  // Build lock transaction with datum
  const unsignedTx = await txBuilder
    .txOut(scriptAddress, [
      {
        unit: "lovelace",
        quantity: amountLovelace
      }
    ])
    .txOutInlineDatumValue(secretHash) // Secret hash as datum
    .changeAddress(walletAddress)
    .complete();
  
  const signedTx = await wallet.signTx(unsignedTx);
  return await wallet.submitTx(signedTx);
}

/**
 * Create a redeem transaction that unlocks HTLC funds with the secret
 */
export async function redeemFunds(
  wallet: BrowserWallet,
  secret: string,
  utxoToSpend: UTxO
): Promise<string> {
  
  const txBuilder = new MeshTxBuilder({
    fetcher: new BlockfrostProvider(process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!),
    submitter: wallet,
  });
  
  const walletAddress = await wallet.getChangeAddress();
  
  // Build redeem transaction
  const unsignedTx = await txBuilder
    .spendingPlutusScript("V2")
    .txIn(
      utxoToSpend.input.txHash,
      utxoToSpend.input.outputIndex,
      utxoToSpend.output.amount,
      utxoToSpend.output.address
    )
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue(secret) // Secret as redeemer
    .txInScript(htlcScript.cbor.toString())
    .changeAddress(walletAddress)
    .complete();
  
  const signedTx = await wallet.signTx(unsignedTx);
  return await wallet.submitTx(signedTx);
}

/**
 * Check if contract is deployed by verifying script address has UTxOs
 */
export async function checkContractDeployment(scriptAddress: string): Promise<boolean> {
  try {
    const provider = new BlockfrostProvider(process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!);
    const utxos = await provider.fetchAddressUTxOs(scriptAddress);
    return utxos.length > 0;
  } catch (error) {
    return false;
  }
}
