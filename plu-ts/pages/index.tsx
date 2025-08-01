import React from "react";
import dynamic from "next/dynamic";

// Import components dynamically to avoid SSR issues with wallet hooks
const ConnectionHandler = dynamic(() => import("../src/components/ConnectionHandler").then(mod => ({ default: mod.ConnectionHandler })), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

const HTLCContract = dynamic(() => import("../src/components/HTLCContract"), {
  ssr: false,
  loading: () => <p>Loading HTLC Contract...</p>
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            HTLC Contract Deployment
          </h1>
          <p className="text-lg text-gray-600">
            Real Plutus contract deployment using plu-ts and MeshSDK
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ConnectionHandler />
          <div className="mt-8">
            <HTLCContract />
          </div>
        </div>
        
        <div className="mt-8 max-w-4xl mx-auto p-6 bg-blue-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">How it works:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>HTLC contract is compiled from plu-ts to plutus.json format</li>
            <li>Script address is generated from the compiled contract</li>
            <li>Deploy button sends ADA to script address to deploy the contract</li>
            <li>Lock function sends ADA with secret hash as datum</li>
            <li>Redeem function unlocks funds by providing the correct secret</li>
          </ol>
          
          <p className="mt-4 text-sm text-gray-600">
            <strong>Note:</strong> This is a real implementation using actual blockchain transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
