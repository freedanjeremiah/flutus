// src/components/ConnectionHandler.tsx

import React from 'react';
import { useWallet } from '@meshsdk/react';

export function ConnectionHandler() {
  const { connected, wallet, connect, disconnect } = useWallet();

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Wallet Connection</h2>
      {connected ? (
        <div>
          <p style={{ color: 'green' }}>✅ Wallet connected</p>
          <button 
            onClick={disconnect}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: 'red' }}>❌ Wallet not connected</p>
          <button 
            onClick={() => connect('eternl')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Connect Eternl Wallet
          </button>
        </div>
      )}
    </div>
  );
}
