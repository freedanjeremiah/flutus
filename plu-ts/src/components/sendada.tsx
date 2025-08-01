import React, { useState } from 'react';
import { useWallet } from '@meshsdk/react';
import { BlockfrostProvider, Transaction } from '@meshsdk/core';

const SendAdaTestPreprod: React.FC = () => {
  const { wallet, connected } = useWallet();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recipientAddress = 'addr_test1qzhgw3v89tqwk3mcgtekn2wp8ne04pl2luj5a2kffp33478xwxkpxxpa9p9ragkfxvmm2std5uwc4n7q542cvqxgdmfq2w7mzg';

  const sendAda = async () => {
    if (!wallet || !connected) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Initialize Blockfrost provider with your project ID - this might not be needed if wallet handles it internally
      const blockfrost = new BlockfrostProvider('preprodmD7cnzGbJ1BUPxqZqOPSYGCZm13tggaq', 0);

      // Create transaction with only the initiator wallet
      const tx = new Transaction({ initiator: wallet });

      // Add output as string amount of lovelace
      tx.sendLovelace(recipientAddress, '5000000');

      // Build your transaction
      const unsignedTx = await tx.build();

      // Sign the transaction
      const signedTx = await wallet.signTx(unsignedTx);

      // Submit the transaction
      const txHash = await wallet.submitTx(signedTx);

      setTxHash(txHash);
    } catch (e: any) {
      setError(e?.message || 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Send 5 ADA (Test Preprod)</h3>
      <button onClick={sendAda} disabled={!connected || loading}>
        {loading ? 'Sending...' : 'Send 5 ADA'}
      </button>
      {txHash && (
        <p>
          Transaction submitted!<br />
          TX Hash: <code>{txHash}</code>
        </p>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};

export default SendAdaTestPreprod;
