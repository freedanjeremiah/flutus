import { Lucid, Blockfrost, Data, Constr } from "lucid-cardano";

// Adjust paths and values
const BLOCKFROST_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_KEY = "";  // From blockfrost.io
const PLUTUS_JSON_PATH = "./plutus.json";  // Update this

async function deployContract() {
  try {
    // Initialize Lucid for Preprod
    const lucid = await Lucid.new(
      new Blockfrost(BLOCKFROST_URL, BLOCKFROST_KEY),
      "Preprod"
    );  // Ensure proper parentheses

    // Connect to Eternl wallet
    const api = await window.cardano.eternl.enable();
    lucid.selectWallet(api as any);  // Type fix

    // Load blueprint
    const blueprint = await import(/* @vite-ignore */ PLUTUS_JSON_PATH);
    const validator = blueprint.validators[0];
    const script = { type: "PlutusV2" as const, script: validator.compiledCode } as any;  // Type fix

    const scriptAddress = lucid.utils.validatorToAddress(script);

    // Basic datum with Constr (line ~17 in original - fixed any paren issues)
    const ownerHash = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const datum = Data.to(new Constr(0, [Data.Bytes(ownerHash)]));  // Corrected parens

    // Build tx to lock 5 tADA
    const tx = await lucid.newTx()
      .payToContract(scriptAddress, { inline: datum }, { lovelace: 5000000n })
      .complete();

    // Sign and submit
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    console.log(`Deployment successful! Tx Hash: ${txHash}`);
    console.log(`Script Address: ${scriptAddress}`);
  } catch (error) {
    console.error("Deployment error:", error.message);  // Better error logging
  }
}

export { deployContract };
