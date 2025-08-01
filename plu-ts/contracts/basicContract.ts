// contracts/basicContract.ts

import {
  bool,
  compile,
  makeValidator,
  pBool,
  pfn,
  Script,
  ScriptType,
  V2,
  Address,
  PaymentCredentials
} from "@harmoniclabs/plu-ts";

// Define a validator with no constraints - the contract always succeeds
// It takes three arguments: datum, redeemer, and the script context
const contract = pfn(
  [
    // datum type (e.g. unit)
    bool.type,
    // redeemer type (e.g. unit)
    bool.type,
    // context type
    V2.PScriptContext.type,
  ],
  bool
)((_datum, _redeemer, _ctx) => {
  // Always succeeds
  return pBool(true);
});

// Create an untyped validator for on-chain use
export const untypedValidator = makeValidator(contract);

// Compile the validator to Plutus Core
export const compiledContract = compile(untypedValidator);

// Wrap the compiled script in a Script class for off-chain usage
export const script = new Script(ScriptType.PlutusV2, compiledContract);

// Get the contract address on the testnet (or change to "mainnet")
export const contractAddress = new Address(
  "testnet",
  new PaymentCredentials("script", script.hash)
).to_bech32();
