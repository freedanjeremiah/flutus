type HTLCDatum {
  recipient: Address,
  sender: Address,
  resolver: Address,
  hash_secret: ByteArray,
  expiry: Int,
  is_safety_deposit: Bool,
  safety_deposit_amount: Int
}

enum HTLCRedeemer {
  Claim(ByteArray),  // preimage
  Refund,
  Resolve
}

pub fn htlc_destination(
  datum: HTLCDatum,
  redeemer: HTLCRedeemer,
  ctx: ScriptContext
) -> Bool {
  let now = ctx.tx_info.valid_range.start

  match redeemer {
    Claim { preimage } => {
      // Claim only allowed if not safety deposit UTXO
      if datum.is_safety_deposit {
        trace("Destination: Claim failed - not main HTLC UTXO") false
      } else {
        let hash_invalid = keccak_256(preimage) != datum.hash_secret
        let time_expired = now >= datum.expiry
        let signed_by_recipient = tx_signed_by(ctx.tx_info, datum.recipient)
        let value_locked_correctly = value_locked_in_outputs(
          ctx.tx_info.outputs,
          ctx.this_address,
          value_locked_in_input(ctx.tx_info.inputs, ctx.this_input_index)
        )

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
    }
    Refund => {
      // Refund only allowed if not safety deposit UTXO
      if datum.is_safety_deposit {
        trace("Destination: Refund failed - not main HTLC UTXO") false
      } else {
        let time_not_expired = now < datum.expiry
        let signed_by_sender = tx_signed_by(ctx.tx_info, datum.sender)
        let value_locked_correctly = value_locked_in_outputs(
          ctx.tx_info.outputs,
          ctx.this_address,
          value_locked_in_input(ctx.tx_info.inputs, ctx.this_input_index)
        )

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
    Resolve => {
      // Resolve only allowed if safety deposit UTXO
      if !datum.is_safety_deposit {
        trace("Destination: Resolve failed - not safety deposit UTXO") false
      } else {
        let past_expiry = now >= datum.expiry
        let signed_by_resolver = tx_signed_by(ctx.tx_info, datum.resolver)
        let value_locked_correctly = value_locked_in_outputs(
          ctx.tx_info.outputs,
          ctx.this_address,
          value_locked_in_input(ctx.tx_info.inputs, ctx.this_input_index)
        )

        if !past_expiry {
          trace("Destination: Resolve failed - not expired") false
        } else if !signed_by_resolver {
          trace("Destination: Resolve failed - resolver signature missing") false
        } else if !value_locked_correctly {
          trace("Destination: Resolve failed - insufficient value locked") false
        } else {
          true
        }
      }
    }
  }
}
