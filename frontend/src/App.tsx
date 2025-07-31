import React from "react";
import FundScript from "./components/FundScript";
import RedeemScript from "./components/RedeemScript";

function App() {
  return (
    <div>
      <h1>Cardano DApp: Fund & Redeem</h1>
      <FundScript />
      <hr />
      <RedeemScript />
    </div>
  );
}

export default App;
