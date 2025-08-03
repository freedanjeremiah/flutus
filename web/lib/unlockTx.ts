// src/offchain/unlockTx.ts

import {
  Asset,
  BlockfrostProvider,
  BrowserWallet,
  Data,
  resolveDataHash,
  Transaction,
} from "@meshsdk/core";

import {
  htlcAddress,
  htlcScript, // { cborHex: string, version: "PlutusScriptV3" or "V2" }
  createRevealRedeemer, // → { data: Data, budget: { mem: number; steps: number } }
} from "./htlc";

/**
 * Redeems the first available HTLC UTxO at the script address.
 *
 * @param wallet        The connected Eternl/Mesh wallet
 * @param secret        Preimage that hashes to the HTLC datum
 * @param provider      BlockfrostProvider instance (must match networkId)
 * @returns             Transaction hash upon successful submission
 */
export async function redeemHTLC(
  wallet: BrowserWallet,
  secret: string,
  provider: BlockfrostProvider,
  usePublic = false
): Promise<{ txHash: string; redeemer: Data }> {
  console.log("Starting HTLC redemption journey…");

  console.log("⚡ Starting HTLC redeem…");
  console.log("Script address:", htlcAddress);

  const utxos = await provider.fetchAddressUTxOs(htlcAddress);
  console.log("Found script UTxOs:", utxos.length);

  if (utxos.length === 0) {
    throw new Error(`No UTxOs to redeem at script address`);
  }

  const utxo = utxos[0];
  console.log("⇨ Using UTxO:", utxo.input?.txHash, utxo.input?.outputIndex);

  // Build redeemer
  const { data: redeemerData, budget } = createRevealRedeemer(
    secret,
    usePublic
  );
  console.log("➽ Redeemer:", JSON.stringify(redeemerData));

  const tx = new Transaction({
    initiator: wallet,
    fetcher: provider,
    evaluator: provider,
    submitter: provider,
  });

  tx.redeemValue({
    value: utxo,
    script: {
      version: htlcScript.type === "PlutusScriptV2" ? "V2" : "V3",
      code: htlcScript.cborHex,
    },
    // omit 'datum' if the UTxO already includes inline_datum
    redeemer: {
      data: redeemerData,
      budget,
    },
  });

  // Return change to sender, reserving ~0.5 ADA redundancy
  const myAddr = await wallet.getChangeAddress();
  const lovelace = extractLovelace(utxo.output.amount);
  const giveBack =
    lovelace > BigInt(500_000) ? lovelace - BigInt(500_000) : BigInt(0);
  if (giveBack > BigInt(0)) {
    tx.sendLovelace(myAddr, giveBack.toString());
  }

  console.log("Built Tx — now evaluation…");
  try {
    const unsigned = await tx.build();
    const signed = await wallet.signTx(unsigned);
    const txHash = await provider.submitTx(signed);
    console.log("✅ Success:", txHash);
    return { txHash, redeemer: redeemerData };
  } catch (err: any) {
    console.error("TX build/eval failed:", err);

    // If it comes with a blockfrost JSON error, print script failures
    if (err && typeof err === "object" && "result" in err) {
      const evalFail = (err as any).result?.EvaluationFailure;
      console.error("📌 Plutus script failed:", JSON.stringify(evalFail));
    }
    throw err;
  }
}

function extractLovelace(assets: Asset[]): bigint {
  const findAda = assets.find((a) => a.unit === "lovelace");
  return findAda ? BigInt(findAda.quantity) : BigInt(0);
}
