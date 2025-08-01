use aiken/collection/list
use aiken/crypto.{keccak_256}
use aiken/interval.{Finite}
use cardano/transaction.{OutputReference, Transaction}

// Datum for the main HTLC (100 ADA)
pub type HTLCDatum {
  sender: ByteArray,           // Public key hash of sender
  receiver: ByteArray,         // Public key hash of receiver  
  secret_hash: ByteArray,      // Keccak256 hash of the secret
  expiry_time: Int,           // Expiration timestamp (POSIX time)
}

// Datum for the safety deposit (5 ADA)
pub type SafetyDatum {
  sender: ByteArray,           // Public key hash of sender
  resolver: ByteArray,         // Public key hash of resolver who can claim
  expiry_time: Int,           // Same expiry as HTLC
}

// Redeemer for both validators
pub type Redeemer {
  secret: ByteArray,          // The secret (for HTLC) or action marker (for safety)
}

// Main HTLC validator for 100 ADA
validator htlc_100_ada {
  spend(
    datum: Option<HTLCDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(HTLCDatum { sender, receiver, secret_hash, expiry_time }) = datum

    // Check if the provided secret matches the keccak256 hash
    let secret_matches = keccak_256(redeemer.secret) == secret_hash
    
    // Check if receiver signed the transaction
    let signed_by_receiver = list.has(tx.extra_signatories, receiver)
    
    // Check if sender signed the transaction  
    let signed_by_sender = list.has(tx.extra_signatories, sender)
    
    // Check if contract has expired (simple time check)
    let has_expired = when tx.validity_range.lower_bound.bound_type is {
      Finite(time) -> time >= expiry_time
      _ -> False
    }

    // Two ways to unlock:
    // 1. Claim: Receiver provides correct keccak256 secret before expiry
    let can_claim = secret_matches && signed_by_receiver && !has_expired
    
    // 2. Refund: Sender reclaims after expiry
    let can_refund = has_expired && signed_by_sender

    can_claim || can_refund
  }
}

// Safety deposit validator for 5 ADA  
validator safety_deposit_5_ada {
  spend(
    datum: Option<SafetyDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(SafetyDatum { sender, resolver, expiry_time }) = datum

    let is_resolver_claim = redeemer.secret == "claim_resolver"
    let is_sender_refund = redeemer.secret == "refund_sender"
    
    // Check if resolver signed the transaction
    let signed_by_resolver = list.has(tx.extra_signatories, resolver)
    
    // Check if sender signed the transaction  
    let signed_by_sender = list.has(tx.extra_signatories, sender)
    
    // Check if contract has expired
    let has_expired = when tx.validity_range.lower_bound.bound_type is {
      Finite(time) -> time >= expiry_time
      _ -> False
    }

    // Two ways to unlock safety deposit:
    // 1. Resolver claims (can happen anytime after HTLC is claimed)
    let can_resolver_claim = is_resolver_claim && signed_by_resolver
    
    // 2. Sender refunds after expiry (if resolver never claimed)
    let can_sender_refund = is_sender_refund && has_expired && signed_by_sender

    can_resolver_claim || can_sender_refund
  }
}
