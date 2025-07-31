// src/offchain/getTxBuilder.ts
import { TxBuilder, NetworkParams } from "@meshsdk/core";

export async function getTxBuilder(): Promise<TxBuilder> {
  const networkParams: NetworkParams = await TxBuilder.getDefaultNetworkParams({
    network: "preprod"
  });
  return TxBuilder.create({ networkParams });
}
