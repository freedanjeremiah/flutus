// src/components/HTLCContract.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '@meshsdk/react';
import { deployHTLCContract, lockFunds, redeemFunds, checkContractDeployment } from '../offchain/deployment';
import { htlcAddress } from '../../contracts/htlc';

export default function HTLCContract() {
  const { wallet, connected } = useWallet();
  const [deploymentStatus, setDeploymentStatus] = useState<string>('not_deployed');
  const [txHash, setTxHash] = useState<string>('');
  const [secretHash, setSecretHash] = useState<string>('mySecretHash123');
  const [secret, setSecret] = useState<string>('mySecretHash123');
  const [amount, setAmount] = useState<string>('2000000');

  useEffect(() => {
    checkDeployment();
  }, []);

  const checkDeployment = async () => {
    try {
      const scriptAddress = htlcAddress.toString();
      const isDeployed = await checkContractDeployment(scriptAddress);
      setDeploymentStatus(isDeployed ? 'deployed' : 'not_deployed');
    } catch (error) {
      setDeploymentStatus('error');
    }
  };

  const handleDeploy = async () => {
    if (!wallet) return;
    
    try {
      setDeploymentStatus('deploying');
      const result = await deployHTLCContract(wallet);
      setTxHash(result.txHash);
      setDeploymentStatus(result.deployed ? 'deployed' : 'pending');
    } catch (error) {
      setDeploymentStatus('error');
    }
  };

  const handleLock = async () => {
    if (!wallet) return;
    
    try {
      const hash = await lockFunds(wallet, secretHash, amount);
      setTxHash(hash);
    } catch (error) {
      alert('Lock failed: ' + error);
    }
  };

  if (!connected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">HTLC Contract</h2>
        <p className="text-gray-600">Please connect your wallet to continue.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">HTLC Contract</h2>
      
      {/* Deployment Status */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Contract Status</h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded text-white ${
            deploymentStatus === 'deployed' ? 'bg-green-500' :
            deploymentStatus === 'deploying' ? 'bg-yellow-500' :
            deploymentStatus === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`}>
            {deploymentStatus === 'deployed' ? 'Deployed' :
             deploymentStatus === 'deploying' ? 'Deploying...' :
             deploymentStatus === 'error' ? 'Error' :
             'Not Deployed'}
          </span>
          <button
            onClick={checkDeployment}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Deploy Button */}
      {deploymentStatus === 'not_deployed' && (
        <div className="mb-4">
          <button
            onClick={handleDeploy}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Deploy Contract (Send 2 ADA to Script Address)
          </button>
        </div>
      )}

      {/* Lock Funds */}
      {deploymentStatus === 'deployed' && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Lock Funds</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Secret Hash"
              value={secretHash}
              onChange={(e) => setSecretHash(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Amount (Lovelace)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleLock}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Lock Funds
            </button>
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Contract Info</h3>
        <p className="text-sm text-gray-600 break-all">
          <strong>Script Address:</strong> {htlcAddress.toString()}
        </p>
        {txHash && (
          <p className="text-sm text-gray-600 break-all mt-2">
            <strong>Last Tx Hash:</strong> {txHash}
          </p>
        )}
      </div>
    </div>
  );
}
