use aiken/collection/list
use aiken/crypto.{keccak_256}
use aiken/interval
use cardano/transaction.{OutputReference, Transaction}

// Main swap datum for the destination contract
pub type SwapDatum {
  maker: ByteArray,              // Original maker's public key hash
  taker: ByteArray,              // Taker's public key hash (this chain)
  maker_secret_hash: ByteArray,   // Hash of maker's secret (keccak_256)
  taker_secret_hash: ByteArray,   // Hash of taker's secret (keccak_256)
  amount: Int,                   // Amount to swap
  expiry_time: Int,              // When swap expires
  is_active: Bool,               // Whether swap is still active
}

// Safety deposit datum for destination
pub type SafetyDatum {
  taker: ByteArray,              // Taker's public key hash
  resolver: ByteArray,           // Resolver's public key hash
  deposit_amount: Int,           // Safety deposit amount
  expiry_time: Int,              // When deposit expires
  swap_completed: Bool,          // Whether main swap was completed
}

// Redeemer actions for destination
pub type Redeemer {
  WithdrawAction { secret: ByteArray }                    // withdraw() - taker provides secret
  CancelAction                                           // cancel() - taker cancels after expiry
  PublicWithdrawAction { secret: ByteArray }             // publicWithdraw() - anyone with secret
  PublicCancelAction                                     // publicCancel() - anyone cancels after expiry
  ClaimSafetyAction                                      // resolver claims safety deposit
  RefundSafetyAction                                     // taker refunds safety deposit
}

// Main destination swap validator
validator destination_swap {
  spend(
    datum: Option<SwapDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(SwapDatum { 
      maker, 
      taker, 
      maker_secret_hash, 
      taker_secret_hash, 
      amount, 
      expiry_time, 
      is_active 
    }) = datum

    // Check if swap is still active
    expect is_active

    // Check if contract has expired
    let is_expired = when tx.validity_range.lower_bound.bound_type is {
      interval.Finite(time) -> time >= expiry_time
      _ -> False
    }

    when redeemer is {
      // withdraw() - Taker withdraws by providing maker's secret (learned from source chain)
      WithdrawAction { secret } -> {
        let valid_maker_secret = keccak_256(secret) == maker_secret_hash
        let signed_by_taker = list.has(tx.extra_signatories, taker)
        let not_expired = !is_expired
        
        valid_maker_secret && signed_by_taker && not_expired
      }

      // cancel() - Taker cancels after expiry
      CancelAction -> {
        let signed_by_taker = list.has(tx.extra_signatories, taker)
        
        signed_by_taker && is_expired
      }

      // publicWithdraw() - Anyone can withdraw with correct secret
      PublicWithdrawAction { secret } -> {
        let valid_secret = keccak_256(secret) == maker_secret_hash || 
                          keccak_256(secret) == taker_secret_hash
        let not_expired = !is_expired
        
        valid_secret && not_expired
      }

      // publicCancel() - Anyone can cancel after expiry
      PublicCancelAction -> {
        is_expired
      }

      _ -> False
    }
  }
}

// Safety deposit validator for destination
validator destination_safety {
  spend(
    datum: Option<SafetyDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(SafetyDatum { 
      taker, 
      resolver, 
      deposit_amount, 
      expiry_time, 
      swap_completed 
    }) = datum

    let is_expired = when tx.validity_range.lower_bound.bound_type is {
      interval.Finite(time) -> time >= expiry_time
      _ -> False
    }

    when redeemer is {
      // Resolver claims safety deposit after swap completion
      ClaimSafetyAction -> {
        let signed_by_resolver = list.has(tx.extra_signatories, resolver)
        let swap_was_completed = swap_completed
        
        signed_by_resolver && swap_was_completed
      }

      // Taker refunds safety deposit after expiry if swap not completed
      RefundSafetyAction -> {
        let signed_by_taker = list.has(tx.extra_signatories, taker)
        let is_safety_expired = when tx.validity_range.lower_bound.bound_type is {
          interval.Finite(time) -> time >= expiry_time
          _ -> False
        }
        let swap_not_completed = !swap_completed
        
        signed_by_taker && is_safety_expired && swap_not_completed
      }

      _ -> False
    }
  }
}


