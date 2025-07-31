import React, { useState } from "react";
import { buildRedeemTx, signAndSubmitRedeem } from "../utils/redeemTx";
import { initLucid } from "../lucid";

export default function RedeemScriptStandalone() {
  const [connected, setConnected] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    try {
      await initLucid();
      setConnected(true);
      alert("Wallet connected!");
    } catch (err: any) {
      alert("Connect failed: " + (err?.message || err));
    }
  }

  async function handleRedeem() {
    if (!connected) {
      alert("Please connect wallet first.");
      return;
    }

    setLoading(true);
    setTxHash(null);
    try {
      const tx = await buildRedeemTx();
      const hash = await signAndSubmitRedeem(tx);
      setTxHash(hash);
      alert("Redeem transaction submitted! Tx Hash: " + hash);
    } catch (err: any) {
      alert("Redeem failed: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!connected && (
        <button onClick={handleConnect} disabled={loading}>
          Connect Wallet (Eternl)
        </button>
      )}
      {connected && (
        <button onClick={handleRedeem} disabled={loading}>
          {loading ? "Redeeming..." : "Redeem (Unlock) Funds"}
        </button>
      )}
      {txHash && (
        <div style={{ marginTop: 10 }}>
          Transaction Hash:{" "}
          <a
            href={`https://preprod.cexplorer.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}
