import { Lucid, Blockfrost, Data, Script, Constr, BytesSchema } from "lucid-cardano";  // Added BytesSchema

// Helper function for string to hex bytes (unchanged)
function stringToHex(str: string): string {
  return new TextEncoder().encode(str)
    .reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
}

// Adjust these from deployment output
const BLOCKFROST_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_KEY = "your-blockfrost-project-id";
const PLUTUS_JSON_PATH = "./path/to/your/build/hello-world/plutus.json";
const SCRIPT_ADDRESS = "your-script-address-from-deployment";
const UTXO_TX_HASH = "your-deployment-tx-hash";
const UTXO_INDEX = 0;

async function interactWithContract() {
  const lucid = await Lucid.new(new Blockfrost(BLOCKFROST_URL, BLOCKFROST_KEY), "Preprod");

  // Connect to Eternl
  const api = await window.cardano.eternl.enable();
  lucid.selectWallet(api as any);

  // Load blueprint
  const blueprint = await import(PLUTUS_JSON_PATH);
  const validator = blueprint.validators[0];

  // Script (from previous fix)
  const script = { type: "PlutusV2" as const, script: validator.compiledCode } as Script;

  // Fixed redeemer construction with cast
  const msgHex = stringToHex("unlock");
  const msgData = Data.Bytes(msgHex);
  const redeemer = Data.to(new Constr(0, [Data.castTo(BytesSchema, msgData)]));

  // Fetch full UTXO (from previous fix)
  const utxoRefs = [{ txHash: UTXO_TX_HASH, outputIndex: UTXO_INDEX }];
  const utxos = await lucid.utxosByOutRef(utxoRefs);
  
  if (utxos.length === 0) {
    throw new Error("UTXO not found!");
  }
  const targetUtxo = utxos[0];

  // Build tx
  const tx = await lucid.newTx()
    .collectFrom([targetUtxo], redeemer)
    .attachSpendingValidator(script)
    .complete();

  // Sign and submit
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  console.log(`Interaction successful! Unlock Tx Hash: ${txHash}`);
}

interactWithContract().catch(console.error);
