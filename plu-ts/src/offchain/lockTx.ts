// src/offchain/lockTx.ts
import { getTxBuilder } from "./getTxBuilder";
import { htlcScript } from "../../contracts/htlc";
import { Data, Value, utils } from "@meshsdk/core";

export async function lockHTLC(
  amount: number,
  hash: string,
  receiverAddress: string,
  timelock: number
) {
  const txBuilder = await getTxBuilder();

  const datum = {
    hash,
    receiver: utils.getPubKeyHashFromAddress(receiverAddress),
    timelock: BigInt(timelock),
  };

  txBuilder
    .payToContract(
      htlcScript.address,
      Data.to(datum),
      Value.lovelace(amount)
    )
    .attachScript(htlcScript);

  const tx = await txBuilder.build();
  const signedTx = await tx.sign();
  return await signedTx.submit();
}
