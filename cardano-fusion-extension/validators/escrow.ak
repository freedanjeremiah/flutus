use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{VerificationKey}

type Datum {
  owner: Hash<Blake2b_224, VerificationKey>,
}

type Redeemer {
  msg: ByteArray,
}

validator {
  fn hello_validator(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool {
    let must_say_hello = redeemer.msg == "Hello, Cardano!"
    let must_be_signed = list.has(context.transaction.extra_signatories, datum.owner)
    must_say_hello && must_be_signed
  }
}
test hello_validator_pass() {
  let datum = Datum { owner: #"deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" }  // Sample owner pubkey hash
  let redeemer = Redeemer { msg: "Hello, Cardano!" }
  let mock_context = ScriptContext {
    transaction: Transaction {
      extra_signatories: [datum.owner],
      // Other fields can be mocked or left default
    },
    purpose: Spend(#"placeholder_tx_id", 0),  // Mock purpose
  }
  hello_validator(datum, redeemer, mock_context)
}
test hello_validator_fail() {
  let datum = Datum { owner: #"deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" }
  let redeemer = Redeemer { msg: "Wrong Message!" }
  let mock_context = ScriptContext {
    transaction: Transaction {
      extra_signatories: [],  // No signature
    },
    purpose: Spend(#"placeholder_tx_id", 0),
  }
  !hello_validator(datum, redeemer, mock_context)  // Expect false (use ! to invert for pass)
}
