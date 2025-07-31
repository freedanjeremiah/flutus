// src/offchain/unlockTx.ts
import { getTxBuilder } from "./getTxBuilder";
import { htlcScript } from "./../../contracts/htlc";
import { Data } from "@meshsdk/core";
import type { UTxO } from "@meshsdk/core";

export async function unlockHTLC(
  lockUtxo: UTxO,
  secret: string
) {
  const txBuilder = await getTxBuilder();

  txBuilder
    .collectFrom(
      [lockUtxo],
      { secret }
    )
    .attachScript(htlcScript);

  const tx = await txBuilder.build();
  const signedTx = await tx.sign();
  return await signedTx.submit();
}
