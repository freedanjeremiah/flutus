import { useEffect, useState } from "react";
import type { NextPage } from "next";
//@ts-expect-error
import { useWallet } from "@meshsdk/react";
//@ts-expect-error
import { CardanoWallet } from "@meshsdk/react";

import {
  BlockfrostProvider,
  PlutusScript,
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
} from "@meshsdk/core";
import { lockHTLC } from "../../lib/lockTx";
import { randomBytes } from "crypto";
import { uint8ArrayToHex } from "@1inch/byte-utils";
import { redeemHTLC } from "../../lib/unlockTx";

const Home: NextPage = () => {
  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<number | null>(null);

  const secret = uint8ArrayToHex(randomBytes(32));
  const provider = new BlockfrostProvider(
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || ""
  );

  // useEffect(() => {
  //   if (wallet) {
  //     fetchBalance();
  //   }
  // }, [wallet]);

  // const fetchBalance = async () => {
  //   const bal = await wallet.getBalance();
  //   setBalance(bal);
  // };

  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }

  const handleLockHTLC = async () => {
    const amountInAda = 5; // amount to lock
    const makerSecret = uint8ArrayToHex(randomBytes(32));
    const takerAddress =
      "addr_test1qppxszq5h705yktg84a003mg6jxm2sky4mztjc5jqwkwmm6qqagg2sn8xlfwzt5l6n6j54rczcs8zqm2dqe467s5wa9qaujnrl"; // replace with actual taker address
    const takerSecret = uint8ArrayToHex(randomBytes(32));

    const timeoutHours = 24;

    const result = await lockHTLC(
      wallet,
      amountInAda,
      makerSecret,
      takerAddress,
      takerSecret,
      timeoutHours
    );

    console.log("Transaction submitted!");
    console.log("Tx Hash:", result.txHash);
    console.log("Datum Hash:", result.datumHash);
  };

  const handleUnLockHTLC = async () => {
    // Implement unlock logic here
    console.log("Unlock HTLC clicked");
    const result = await redeemHTLC(wallet, secret, provider);

    console.log("Unlock transaction submitted!");
    console.log("Tx Hash:", result.txHash);
    console.log("Redeemer:", result.redeemer);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 font-sans p-8">
      <div className="bg-white rounded-2xl shadow-lg px-10 py-8 min-w-[340px] max-w-[90vw] flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-slate-800">
          Connect Your Cardano Wallet
        </h1>
        <CardanoWallet />

        {wallet && (
          <div className="mt-4 text-slate-600">
            <p>Balance: {balance} ADA</p>
          </div>
        )}
        {connected && (
          <>
            <h2 className="text-xl font-semibold mt-8 mb-3 text-slate-700">
              Wallet Assets
            </h2>
            {assets ? (
              <pre className="bg-slate-100 rounded-lg p-4 max-h-60 overflow-auto text-base w-full mb-4">
                <code className="language-js">
                  {JSON.stringify(assets, null, 2)}
                </code>
              </pre>
            ) : (
              <button
                type="button"
                onClick={getAssets}
                disabled={loading}
                className={`my-3 mb-6 px-7 py-2.5 rounded-lg font-semibold text-base shadow transition-colors ${
                  loading
                    ? "bg-orange-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                } text-white`}
              >
                {loading ? "Loading..." : "Get Wallet Assets"}
              </button>
            )}
          </>
        )}
        <button
          onClick={handleLockHTLC}
          className="mt-6 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-lg shadow transition-colors"
        >
          Lock HTLC
        </button>

        <button
          onClick={handleUnLockHTLC}
          className="mt-4 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg shadow transition-colors"
        >
          Unlock HTLC
        </button>
      </div>
      <footer className="mt-8 text-slate-400 text-base">
        Powered by Mesh SDK &amp; Cardano
      </footer>
    </div>
  );
};

export default Home;
