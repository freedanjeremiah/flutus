use aiken/collection/list
use aiken/crypto.{sha2_256}
use aiken/interval.{Finite}
use cardano/transaction.{OutputReference, Transaction}

// Datum: Data stored with the UTXO
pub type Datum {
  sender: ByteArray,           // Public key hash of sender
  recipient: ByteArray,        // Public key hash of recipient  
  secret_hash: ByteArray,      // Hash of the secret
  expiry_time: Int,           // Expiration timestamp (POSIX time)
}

// Redeemer: Action to unlock the UTXO
pub type Redeemer {
  secret: ByteArray,          // The secret to reveal (for claim)
}

validator htlc {
  spend(
    datum: Option<Datum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(Datum { sender, recipient, secret_hash, expiry_time }) = datum

    // Check if the provided secret matches the hash
    let secret_matches = sha2_256(redeemer.secret) == secret_hash
    
    // Check if recipient signed the transaction
    let signed_by_recipient = list.has(tx.extra_signatories, recipient)
    
    // Check if sender signed the transaction  
    let signed_by_sender = list.has(tx.extra_signatories, sender)
    
    // Simple expiry check using validity range start
    let has_expired = when tx.validity_range.lower_bound.bound_type is {
      Finite(time) -> time >= expiry_time
      _ -> False
    }

    // Two ways to unlock:
    // 1. Claim: Recipient provides correct secret
    let can_claim = secret_matches && signed_by_recipient
    
    // 2. Refund: Sender reclaims after expiry
    let can_refund = has_expired && signed_by_sender

    can_claim || can_refund
  }
}
