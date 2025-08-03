import {
  resolvePaymentKeyHash,
  Data,
  Transaction,
  resolveDataHash,
  unixTimeToEnclosingSlot,
  SLOT_CONFIG_NETWORK,
  BrowserWallet,
} from "@meshsdk/core";
import * as Sdk from "@1inch/cross-chain-sdk";
import { createHash } from "crypto";

function keccak256Hex(secret: string): string {
  const hash = Sdk.HashLock.forSingleFill(secret);
  return hash.toString();
}

function createSwapDatum(
  secret: string,
  takerAddr: string,
  makerAddr: string,
  takerSecret: string,
  amountInAda: number,
  timeoutHours: number,
  slotConfig: (typeof SLOT_CONFIG_NETWORK)["testnet" | "preview" | "mainnet"]
): Data {
  const makerPKH = resolvePaymentKeyHash(makerAddr);
  const takerPKH = resolvePaymentKeyHash(takerAddr);

  const makerSecretHash = keccak256Hex(secret);
  const takerSecretHash = takerSecret ? keccak256Hex(takerSecret) : "0x";

  const deadlineMs = Date.now() + timeoutHours * 60 * 60 * 1000;
  const expirySlot = unixTimeToEnclosingSlot(deadlineMs, slotConfig);

  return {
    alternative: 0, // replaces "alternative" for latest Mesh SDK
    fields: [
      toData(makerPKH),
      toData(takerPKH),
      toData(makerSecretHash),
      toData(takerSecretHash),
      toData(amountInAda * 1_000_000),
      toData(BigInt(expirySlot)),
      toData(true),
    ],
  };
}

function toData(value: string | number | bigint | boolean): Data {
  if (typeof value === "string") {
    return value.startsWith("0x")
      ? { alternative: 0, fields: [value.slice(2)] }
      : {
          alternative: 0,
          fields: [Buffer.from(value, "utf-8").toString("hex")],
        };
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return { alternative: 0, fields: [BigInt(value).toString()] };
  }

  if (typeof value === "boolean") {
    return { alternative: value ? 1 : 0, fields: [] }; // Plutus Bool
  }

  throw new Error("Unsupported type for Data field");
}

export async function lockHTLC(
  wallet: BrowserWallet,
  amount: number,
  makerSecret: string,
  takerAddress: string,
  takerSecret: string,
  timeoutHours = 24
): Promise<{ txHash: string; datumHash: string }> {
  const YOUR_SCRIPT_ADDRESS =
    "addr_test1wr34m428dvfy74a3y8wa9al6pq9t3l0ck90yl7yla4j8pfgwg6qzs";
  const networkId = await wallet.getNetworkId();

  const slotConfig =
    networkId === 0 ? SLOT_CONFIG_NETWORK.preview : SLOT_CONFIG_NETWORK.mainnet;

  const makerAddress = await wallet.getChangeAddress();

  const datum = createSwapDatum(
    makerSecret,
    takerAddress,
    makerAddress,
    takerSecret,
    amount,
    timeoutHours,
    slotConfig
  );

  const tx = new Transaction({ initiator: wallet });

  tx.sendLovelace(
    {
      address: YOUR_SCRIPT_ADDRESS,
      datum: { value: datum, inline: true },
    },
    (amount * 1_000_000).toString()
  );

  const unsigned = await tx.build();
  const signed = await wallet.signTx(unsigned);
  const txHash = await wallet.submitTx(signed);

  return {
    txHash,
    datumHash: resolveDataHash(datum),
  };
}
