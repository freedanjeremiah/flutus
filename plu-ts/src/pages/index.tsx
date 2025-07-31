// src/pages/index.tsx
import React, { useState } from "react";
import { ConnectionHandler } from "../components/ConnectionHandler";
import { lockHTLC } from "../offchain/lockTx";
import { unlockHTLC } from "../offchain/unlockTx";
import { refundHTLC } from "../offchain/refundTx";
import type { UTxO } from "@meshsdk/core";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [amount, setAmount] = useState(0);
  const [secret, setSecret] = useState("");
  const [hash, setHash] = useState("");
  const [receiver, setReceiver] = useState("");
  const [timelock, setTimelock] = useState(0);
  const [utxo, setUtxo] = useState<UTxO | null>(null);

  const generateHash = async () => {
    const buf = new TextEncoder().encode(secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
    setHash(Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join(""));
  };

  return (
    <div className={styles.container}>
      <ConnectionHandler />

      <h1>HTLC Demo</h1>

      <div>
        <h2>Lock Funds</h2>
        <input type="number" placeholder="Amount (lovelace)" onChange={e => setAmount(Number(e.target.value))} />
        <input type="text" placeholder="Receiver Address" onChange={e => setReceiver(e.target.value)} />
        <input type="text" placeholder="Secret" onChange={e => setSecret(e.target.value)} />
        <button onClick={generateHash}>Generate Hash</button>
        <p>Hash: {hash}</p>
        <input type="number" placeholder="Timelock Slot" onChange={e => setTimelock(Number(e.target.value))} />
        <button onClick={async () => {
          const txHash = await lockHTLC(amount, hash, receiver, timelock);
          alert("Lock Tx Submitted: " + txHash);
        }}>
          Lock
        </button>
      </div>

      <div>
        <h2>Unlock Funds</h2>
        {/* In real use, fetch UTxOs at the script address and select one */}
        <button onClick={async () => {
          if (!utxo) return alert("Set UTxO first");
          const txHash = await unlockHTLC(utxo, secret);
          alert("Unlock Tx Submitted: " + txHash);
        }}>
          Unlock
        </button>
      </div>

      <div>
        <h2>Refund Funds</h2>
        <button onClick={async () => {
          if (!utxo) return alert("Set UTxO first");
          const txHash = await refundHTLC(utxo);
          alert("Refund Tx Submitted: " + txHash);
        }}>
          Refund
        </button>
      </div>
    </div>
  );
}
