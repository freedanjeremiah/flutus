// components/DisplayContractAddress.tsx

import React from "react";
import { contractAddress } from "../../contracts/basicContract";

const DisplayContractAddress: React.FC = () => {
  return (
    <div>
      <h3>Smart Contract Address</h3>
      <p>{contractAddress}</p>
    </div>
  );
};

export default DisplayContractAddress;
