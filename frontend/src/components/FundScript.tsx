import React, { useState } from "react";
import { initLucid } from "../lucid";
import { getScriptAddress } from "../utils/address";
import { sendAdaToScript, signAndSubmitTransaction } from "../utils/tx";

export default function FundScript() {
  const [connected, setConnected] = useState(false);
  const [scriptAddr, setScriptAddr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleConnect() {
    try {
      await initLucid();
      setConnected(true);
      setScriptAddr(getScriptAddress());
    } catch (e) {
      alert("Connect wallet failed: " + e);
    }
  }

  async function handleFundScript() {
    if (!connected) {
      alert("Please connect wallet first");
      return;
    }
    try {
      const tx = await sendAdaToScript(5_000_000n); // 5 ADA
      const hash = await signAndSubmitTransaction(tx);
      setTxHash(hash);
      alert("Transaction submitted! Tx Hash: " + hash);
    } catch (e) {
      alert("Transaction failed: " + e);
    }
  }

  return (
    <div>
      {!connected && <button onClick={handleConnect}>Connect Eternl Wallet</button>}
      {connected && (
        <>
          <p>Script Address: {scriptAddr}</p>
          <button onClick={handleFundScript}>Send 5 ADA to Script</button>
        </>
      )}
      {txHash && (
        <p>
          Transaction Hash:{" "}
          <a
            href={`https://preprod.cexplorer.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash}
          </a>
        </p>
      )}
    </div>
  );
}
