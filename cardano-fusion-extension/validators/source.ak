import { 
  Data, 
  Script, 
  Time, 
  bytesToHex, 
  PubKeyHash, 
  toHexString, 
  Validator, 
} from "plu-ts";

interface HTLCDatum {
  hash: string; // hash of the secret
  receiver: PubKeyHash;
  timelock: bigint; // slot/time after which refund is allowed
}
type HTLCRedeemer = { secret: string } | { refund: true };

export const htlc = new Validator<
  HTLCDatum,
  HTLCRedeemer
>((datum, redeemer, ctx) => {
  if ("secret" in redeemer) {
    // Unlocking with preimage
    ctx.assert(
      ctx.hashes.sha256(redeemer.secret) === datum.hash,
      "Invalid secret"
    );
    ctx.assert(
      ctx.tx.signatories.includes(datum.receiver),
      "Receiver must sign"
    );
  } else if ("refund" in redeemer) {
    // Refund path
    ctx.assert(
      ctx.tx.validityRange.after(datum.timelock),
      "Timelock not expired"
    );
    ctx.assert(
      ctx.tx.signatories.includes(ctx.tx.inputs[0].resolved.address.pubKeyHash), // Sender must sign
      "Refund allowed only to sender"
    );
  }
});
export const htlcScript = htlc.script;
// Export script address for UI/off-chain
import { 
  Data, 
  Script, 
  Time, 
  bytesToHex, 
  PubKeyHash, 
  toHexString, 
  Validator, 
} from "plu-ts";

interface HTLCDatum {
  hash: string; // hash of the secret
  receiver: PubKeyHash;
  timelock: bigint; // slot/time after which refund is allowed
}
type HTLCRedeemer = { secret: string } | { refund: true };

export const htlc = new Validator<
  HTLCDatum,
  HTLCRedeemer
>((datum, redeemer, ctx) => {
  if ("secret" in redeemer) {
    // Unlocking with preimage
    ctx.assert(
      ctx.hashes.sha256(redeemer.secret) === datum.hash,
      "Invalid secret"
    );
    ctx.assert(
      ctx.tx.signatories.includes(datum.receiver),
      "Receiver must sign"
    );
  } else if ("refund" in redeemer) {
    // Refund path
    ctx.assert(
      ctx.tx.validityRange.after(datum.timelock),
      "Timelock not expired"
    );
    ctx.assert(
      ctx.tx.signatories.includes(ctx.tx.inputs[0].resolved.address.pubKeyHash), // Sender must sign
      "Refund allowed only to sender"
    );
  }
});
export const htlcScript = htlc.script;
// Export script address for UI/off-chain
