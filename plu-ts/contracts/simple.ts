// contracts/simple.ts

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

// A validator that always returns True
const validator = pfn(
  [ bool.type, bool.type, V2.PScriptContext.type ],
  bool
)((_datum, _redeemer, _ctx) => pBool(true));

export const untypedValidator = makeValidator(validator);
export const compiled = compile(untypedValidator);
export const script = new Script(ScriptType.PlutusV2, compiled);

// Contract address on testnet
export const contractAddress = new Address(
  "testnet",
  new PaymentCredentials("script", script.hash)
).to_bech32();
