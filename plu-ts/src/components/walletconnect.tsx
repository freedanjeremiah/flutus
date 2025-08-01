// components/ConnectEternlWallet.tsx
import React, { useEffect, useState } from 'react';
import { useWallet, useWalletList } from '@meshsdk/react';

const ConnectEternlWallet: React.FC = () => {
  const { connect, disconnect, connected, connecting, name, error } = useWallet();
  const wallets = useWalletList();
  const [attempted, setAttempted] = useState(false);

  // Auto-connect to Eternl if available
  useEffect(() => {
    if (!attempted && !connected && !connecting) {
      const eternl = wallets.find(w => w.name.toLowerCase() === 'eternl');
      if (eternl) {
        connect(eternl.name);
      }
      setAttempted(true);
    }
  }, [wallets, connected, connecting, connect, attempted]);

  return (
    <div>
      <h2>Connect to Eternl Wallet</h2>

      {!connected && (
        <button onClick={() => connect('eternl')}>
          Connect Eternl
        </button>
      )}

      {connecting && <p>Connecting to Eternl…</p>}

      {connected && (
        <div>
          <p>🗸 Connected: {name}</p>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}

     {error !== undefined && (
  <>
    {error instanceof Error ? (
      <p style={{ color: 'red' }}>
        {error.message.includes('account changed')
          ? 'Account changed in wallet—please reconnect your wallet.'
          : `Error: ${error.message}`}
      </p>
    ) : typeof error === 'string' ? (
      <p style={{ color: 'red' }}>{error}</p>
    ) : (
      <p style={{ color: 'red' }}>An unknown error occurred</p>
    )}
  </>
)}

      <h3>Available Wallets:</h3>
      <ul>
        {wallets.map(wallet => (
          <li key={wallet.name}>
            {wallet.name} {wallet.icon && <img src={wallet.icon} alt={wallet.name} width={20} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectEternlWallet;
