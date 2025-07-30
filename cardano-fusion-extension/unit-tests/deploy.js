import { Lucid, Blockfrost, Data, Constr } from "lucid-cardano";
import * as CML from "@dcspark/cardano-multiplatform-lib-browser"; // Switch to dcspark for better Vite/WASM compatibility

// Adjust paths and values
const BLOCKFROST_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_KEY = "preprodmD7cnzGbJ1BUPxqZqOPSYGCZm13tggaq"; // From blockfrost.io
const PLUTUS_JSON_PATH = "./plutus.json"; // Ensure this file exists and is correctly formatted

async function deployContract() {
  try {
    // Initialize Lucid with explicit provider check
    const provider = new Blockfrost(BLOCKFROST_URL, BLOCKFROST_KEY);
    const lucid = await Lucid.new(provider, "Preprod");
    
    // Poll for Eternl availability (up to 5 seconds)
    let attempts = 0;
    let api;
    while (attempts < 10) {
      if (window.cardano && window.cardano.eternl) {
        api = await window.cardano.eternl.enable();
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5s per attempt
      attempts++;
    }
    if (!api) {
      throw new Error("Eternl wallet not detected after timeout. Ensure the extension is installed and enabled.");
    }
    lucid.selectWallet(api, { CML }); // Pass new CML explicitly

    // Verify Lucid is initialized before proceeding
    if (!lucid.txBuilderConfig) {
      throw new Error("Lucid txBuilderConfig is undefined - check serialization lib or provider.");
    }

    // Load blueprint and check for errors
    let blueprint;
    try {
      blueprint = await import(PLUTUS_JSON_PATH);
    } catch (importError) {
      throw new Error(`Failed to load blueprint from ${PLUTUS_JSON_PATH}: ${importError.message}`);
    }
    const validator = blueprint.validators[0];
    const script = { type: "PlutusV2", script: validator.compiledCode };

    const scriptAddress = lucid.utils.validatorToAddress(script);

    // Basic datum with Constr (fetch real owner hash from wallet)
    const address = await lucid.wallet.address();
    const paymentCred = CML.Address.from_bech32(address).payment_cred();
    const ownerHash = paymentCred.to_keyhash()?.to_hex() || ""; // Dynamic from wallet, with null check
    if (!ownerHash) throw new Error("Failed to derive owner hash from wallet address.");
    const datum = Data.to(new Constr(0, [Data.bytes(ownerHash)]));

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
    console.error("Deployment error:", error.message, error.stack); // Log message + full stack
  }
}

export { deployContract };
