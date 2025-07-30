import { getValidatorFromJson } from "./validator";
import { getLucid } from "../lucid";

export function getScriptAddress(): string {
  const validator = getValidatorFromJson();
  return getLucid().utils.validatorToAddress(validator);
}
