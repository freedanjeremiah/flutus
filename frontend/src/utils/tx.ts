// src/utils/tx.ts
import type { TxComplete, SpendingValidator } from "lucid-cardano";
import { Data } from "lucid-cardano"; // For serializing datum
import { getValidatorFromJson } from "./validator";
import { getLucid } from "../lucid";

/**
 * Build a transaction that sends ADA to the script address with a properly serialized datum.
 * 
 * @param amountLovelace Amount of ADA to send in Lovelace (e.g. 5_000_000n for 5 ADA)
 * @returns A built but unsigned TxComplete object
 */
export async function sendAdaToScript(amountLovelace: bigint): Promise<TxComplete> {
  const lucid = getLucid();
  const validator: SpendingValidator = getValidatorFromJson();
  const scriptAddress = lucid.utils.validatorToAddress(validator);

  // Properly serialize datum to CBOR hex string using a simple value (e.g., 0n for integer datum)
  const datum = Data.to(0n);

  const txComplete = await lucid
    .newTx()
    .payToContract(scriptAddress, datum, { lovelace: amountLovelace })
    .complete();

  return txComplete;
}

/**
 * Sign and submit the transaction using the connected wallet (e.g., Eternl).
 * 
 * @param txComplete The built but unsigned transaction
 * @returns Transaction hash string after successful submission
 */
export async function signAndSubmitTransaction(txComplete: TxComplete): Promise<string> {
  // sign() and submit() are chainable methods on TxComplete and signed Tx
  const signedTx = await txComplete.sign().complete();
  const txHash = await signedTx.submit();
  return txHash;
}
