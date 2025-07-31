pub fn htlc_source(
  datum: HTLCDatum,
  redeemer: HTLCRedeemer,
  ctx: ScriptContext
) -> Bool {
  let now = ctx.tx_info.valid_range.start

  match redeemer {
    Claim preimage => {
      let hash_invalid = blake2b_256(preimage) != datum.hash_secret
      let past_expiry = now >= datum.expiry
      let signed_by_recipient = tx_signed_by(ctx.tx_info, datum.recipient)

      if hash_invalid {
        trace("Claim failed: invalid preimage") false
      } else if past_expiry {
        trace("Claim failed: past expiry") false
      } else if !signed_by_recipient {
        trace("Claim failed: recipient signature missing") false
      } else {
        true
      }
    }
    Refund => {
      let not_expired = now < datum.expiry
      let signed_by_sender = tx_signed_by(ctx.tx_info, datum.sender)

      if not_expired {
        trace("Refund failed: not expired") false
      } else if !signed_by_sender {
        trace("Refund failed: sender signature missing") false
      } else {
        true
      }
    }
  }
}
