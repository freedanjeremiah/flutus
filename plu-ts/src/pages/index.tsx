import React from "react";
import { ConnectionHandler } from "../components/ConnectionHandler";

export default function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>plu-ts Cardano Connection</h1>
      
      <div style={{ marginBottom: "30px" }}>
        <ConnectionHandler />
      </div>
      
      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f5f5f5" }}>
        <h3>Cardano Wallet Connection</h3>
        <p>Connect your Cardano wallet to interact with the blockchain.</p>
        <p>Make sure your wallet is set to the Cardano testnet/preprod network.</p>
      </div>
    </div>
  );
}
