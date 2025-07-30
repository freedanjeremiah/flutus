use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKey}

type Datum {
  owner: Hash<Blake2b_224, VerificationKey>,
}

type Redeemer {
  msg: ByteArray,
}

validator {
  fn gift(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool {
    let must_be_signed = list.has(context.transaction.extra_signatories, datum.owner)
    let must_match_msg = redeemer.msg == "unlock"
    must_be_signed && must_match_msg
  }
}

test gift_pass() {
  let datum = Datum { owner: #"deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" }
  let redeemer = Redeemer { msg: "unlock" }
  let mock_context = ScriptContext {
    transaction: Transaction {
      extra_signatories: [datum.owner],
    },
    purpose: Spend(#"placeholder_tx_id", 0),
  }
  gift(datum, redeemer, mock_context)
}
