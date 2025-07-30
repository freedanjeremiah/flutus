import type { SpendingValidator } from "lucid-cardano";
import plutusJson from "../gift.plutus.json"; // or the actual path

// Defensive extraction, with error if structure is wrong
let compiledCode: string;

if (Array.isArray(plutusJson.validators) && plutusJson.validators.length > 0) {
  compiledCode = plutusJson.validators[0].compiledCode;
} else {
  throw new Error("No validators array or compiledCode found in JSON file.");
}

export function getValidatorFromJson(): SpendingValidator {
  return {
    type: "PlutusV2",
    script: compiledCode,
  };
}
