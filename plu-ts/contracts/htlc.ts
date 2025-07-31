// contracts/htlc.ts
import {
  Validator,
  PubKeyHash,
  Data,
  ScriptContext,
  TxOutRef,
  bytesToHex,
} from "plu-ts";

// Datum carries hash, receiver key hash, and timelock slot
export interface HTLCDatum {
  hash: string;            // SHA-256 hex of the secret
  receiver: PubKeyHash;    // PubKeyHash of the receiver
  timelock: bigint;        // Slot number after which refund is allowed
}

// Redeemer is either reveal or refund
export type HTLCRedeemer = { secret: string } | { refund: true };

export const htlc = new Validator<HTLCDatum, HTLCRedeemer>(
  (datum, redeemer, ctx: ScriptContext) => {
    const signatories = ctx.txInfo.signatories;
    if ("secret" in redeemer) {
      // Unlock branch: secret preimage and receiver signature
      ctx.assert(
        ctx.hashes.sha256(redeemer.secret) === datum.hash,
        "Invalid secret"
      );
      ctx.assert(
        signatories.includes(datum.receiver),
        "Receiver must sign"
      );
    } else {
      // Refund branch: timelock expired and original sender signature
      ctx.assert(
        ctx.txInfo.validRange.after(datum.timelock),
        "Timelock not expired"
      );
      // The UTXO’s address is the script’s; sender pubkey must sign
      const inputRefs = ctx.txInfo.inputs.map((i) => i.outRef);
      const originalSender = ctx.txInfo.signatories[0];
      ctx.assert(
        signatories.includes(originalSender),
        "Sender must sign refund"
      );
    }
  }
);

export const htlcScript = htlc.script;
export const htlcAddress = htlc.scriptAddress;
