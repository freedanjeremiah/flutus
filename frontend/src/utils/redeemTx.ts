import { Data } from "lucid-cardano";
import type { TxComplete } from "lucid-cardano";
import { getLucid } from "../lucid";
import { getValidatorFromJson } from "./validator";
import { getScriptAddress } from "./address";

/**
 * Build a redeem (spend/unlock) transaction from the script address.
 * Returns a built but unsigned Lucid TxComplete transaction.
 */
export async function buildRedeemTx(): Promise<TxComplete> {
  const lucid = getLucid();
  const validator = getValidatorFromJson();
  const scriptAddress = getScriptAddress();

  // Query all UTXOs locked at the contract script address
  const utxos = await lucid.utxosAt(scriptAddress);
  if (utxos.length === 0)
    throw new Error("No UTXOs found at the script address to redeem.");

  // Select the first locked UTXO to spend (you can select differently if needed)
  const targetUtxo = utxos[0];

  // Redeemer — unit constructor for universal acceptance (cast to `any` avoids TS issues)
  const redeemer = Data.to({ constructor: 0, fields: [] } as any);

  // Build transaction to consume the script locked UTXO and send funds back to wallet
  const tx = await lucid
    .newTx()
    .collectFrom([targetUtxo], redeemer)          // Attach redeemer to unlock funds
    .attachSpendingValidator(validator)           // Attach the compiled validator script
    .payToAddress(
      await lucid.wallet.address(),                // Recipient: your wallet address
      { lovelace: targetUtxo.assets.lovelace }    // Amount matching locked ADA
    )
    .complete();

  return tx;
}

/**
 * Sign and submit the redeem transaction via wallet.
 * @param tx - The built but unsigned Lucid transaction
 * @returns Transaction hash string after submission
 */
export async function signAndSubmitRedeem(tx: TxComplete): Promise<string> {
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  return txHash;
}
