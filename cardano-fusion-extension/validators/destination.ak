pub fn htlc_destination(
  datum: HTLCDatum,
  redeemer: HTLCRedeemer,
  ctx: ScriptContext
) -> Bool {
  let now = ctx.tx_info.valid_range.start

  match redeemer {
    Claim { preimage } => {
      let hash_invalid = blake2b_256(preimage) != datum.hash_secret
      let time_expired = now >= datum.expiry
      let signed_by_recipient = tx_signed_by(ctx.tx_info, datum.recipient)
      let value_locked_correctly = value_locked_in_outputs(ctx.tx_info.outputs, ctx.this_address, value_locked_in_input(ctx.tx_info.inputs, ctx.this_input_index))

      if hash_invalid {
        trace("Destination: Claim failed - invalid preimage") false
      } else if time_expired {
        trace("Destination: Claim failed - past expiry") false
      } else if !signed_by_recipient {
        trace("Destination: Claim failed - recipient signature missing") false
      } else if !value_locked_correctly {
        trace("Destination: Claim failed - insufficient value locked") false
      } else {
        true
      }
    }
    Refund => {
      let time_not_expired = now < datum.expiry
      let signed_by_sender = tx_signed_by(ctx.tx_info, datum.sender)
      let value_locked_correctly = value_locked_in_outputs(ctx.tx_info.outputs, ctx.this_address, value_locked_in_input(ctx.tx_info.inputs, ctx.this_input_index))

      if time_not_expired {
        trace("Destination: Refund failed - not expired yet") false
      } else if !signed_by_sender {
        trace("Destination: Refund failed - sender signature missing") false
      } else if !value_locked_correctly {
        trace("Destination: Refund failed - insufficient value locked") false
      } else {
        true
      }
    }
  }
}
    