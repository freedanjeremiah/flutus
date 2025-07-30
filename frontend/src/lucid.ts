import { Lucid, Blockfrost, SpendingValidator } from "lucid-cardano";

let lucid: Lucid;

export async function initLucid() {
  if (!window.cardano || !window.cardano.eternl) {
    alert("Please install the Eternl wallet extension");
    throw new Error("Eternl wallet not found");
  }
  const api = await window.cardano.eternl.enable();

  lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      "preprodmD7cnzGbJ1BUPxqZqOPSYGCZm13tggaq"
    ),
    "Preprod"
  );
  lucid.selectWallet(api);
}

export function getLucid() {
  if (!lucid) throw new Error("Lucid not initialized");
  return lucid;
}
