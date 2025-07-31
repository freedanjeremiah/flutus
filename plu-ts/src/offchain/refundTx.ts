// src/offchain/refundTx.ts
import { getTxBuilder } from "./getTxBuilder";
import { htlcScript } from "../../contracts/htlc";
import type { UTxO } from "@meshsdk/core";

export async function refundHTLC(
  lockUtxo: UTxO
) {
  const txBuilder = await getTxBuilder();

  txBuilder
    .collectFrom(
      [lockUtxo],
      { refund: true }
    )
    .attachScript(htlcScript);

  const tx = await txBuilder.build();
  const signedTx = await tx.sign();
  return await signedTx.submit();
}
