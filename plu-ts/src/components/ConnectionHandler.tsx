// src/components/ConnectionHandler.tsx
import React from "react";
import { useWallet, useConnectedWallet } from "@meshsdk/react";

export function ConnectionHandler() {
  const { connect, disconnect, connected, walletName } = useWallet();
  const connectedWallet = useConnectedWallet();

  return (
    <div>
      {connected && walletName === "eternl" ? (
        <>
          <p>Connected: {connectedWallet?.getUsedAddress()}</p>
          <button onClick={() => disconnect()}>Disconnect</button>
        </>
      ) : (
        <button onClick={() => connect("eternl")}>
          Connect Eternl
        </button>
      )}
    </div>
  );
}
