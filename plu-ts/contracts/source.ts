// contracts/htlc_with_deposit.ts

import {
  BS,                      // ByteString term type
  bool,
  compile,
  makeValidator,
  pfn,
  Script,
  ScriptType,
  PScriptContext,
  PubKeyHash,
  TermBytes,
  TermBool,
  TermInt,
} from "@harmoniclabs/plu-ts";

// Datum type:
// - hash       : ByteString (keccak_256 hash of the secret)
// - receiver   : PubKeyHash (bytes)
// - timelock   : Int (slot number for refund)
// - isDeposit  : Bool (true if this UTXO is a safety deposit)
export interface HTLCDatum {
  hash: Uint8Array;
  receiver: Uint8Array;
  timelock: bigint;
  isDeposit?: boolean;
}

// Redeemer: ByteString
// - non-empty: treated as the secret preimage to claim main UTXO
// - empty: refund (sender) or safety deposit claim (receiver)
export type HTLCRedeemer = Uint8Array;

// On-chain validator
const htlcValidator = pfn(
  [
    BS.type,              // datum.hash (keccak256)
    PubKeyHash.type,      // datum.receiver
    TermInt.type,         // datum.timelock
    bool.type,            // datum.isDeposit
    PScriptContext.type,  // context
  ],
  bool
)(
  (hashTerm, receiverTerm, lockTerm, isDepositTerm, ctx) => {
    const redeemerBS = ctx.redeemer.get();           // TermBytes
    const isSecret = redeemerBS.length.gt(0);        // TermBool: secret provided if true

    // Check if signed by receiver (resolver)
    const signedByReceiver = ctx.tx.signatories.some(receiverTerm.eqTerm);

    // Check if signed by sender (first input's pubKeyHash)
    const firstInputPKH = ctx.tx.inputs.head
      .resolved.address.paymentCreds.hash;
    const signedBySender = ctx.tx.signatories.some(firstInputPKH.eqTerm);

    // Check secret correctness using keccak_256
    const secretOK = ctx.hashes.keccak_256(redeemerBS).eq(hashTerm);

    // Check if current slot is after timelock for refund
    const afterLock = ctx.tx.validityRange.after(lockTerm);

    // Spending safety deposit allowed only if isDeposit = true and signed by receiver
    const depositSpendAllowed = isDepositTerm.and(signedByReceiver);

    // Spending main HTLC allowed if isDeposit = false and:
    // - either (secret known, secret correct, signed by receiver)
    // - or (no secret, after timelock, signed by sender for refund)
    const mainSpendAllowed = isDepositTerm.not().and(
      isSecret.and(secretOK).and(signedByReceiver)
      .or(
        isSecret.not().and(afterLock).and(signedBySender)
      )
    );

    // Final validation result
    return depositSpendAllowed.or(mainSpendAllowed);
  }
);

// Export untyped, compiled script and address
export const untypedValidator = makeValidator(htlcValidator);
export const compiled = compile(untypedValidator);
export const script = new Script(ScriptType.PlutusV2, compiled);

// Bech32 address on testnet (or use "mainnet")
export const htlcAddress = script.address("testnet");
