use aiken/collection/list
use aiken/crypto.{keccak_256}
use aiken/interval
use cardano/transaction.{Output, OutputReference, Transaction}
use cardano/address.{Address}

// Main swap datum for the source contract
pub type SwapDatum {
  maker: ByteArray,              // Maker's public key hash
  taker: ByteArray,              // Taker's public key hash  
  maker_secret_hash: ByteArray,   // Hash of maker's secret (keccak_256)
  taker_secret_hash: ByteArray,   // Hash of taker's secret (keccak_256)
  amount: Int,                   // Amount to swap
  expiry_time: Int,              // When swap expires
  is_active: Bool,               // Whether swap is still active
}

// Safety deposit datum
pub type SafetyDatum {
  maker: ByteArray,              // Maker's public key hash
  resolver: ByteArray,           // Resolver's public key hash
  deposit_amount: Int,           // Safety deposit amount
  expiry_time: Int,              // When deposit expires
  swap_completed: Bool,          // Whether main swap was completed
}

// Redeemer actions
pub type Redeemer {
  WithdrawAction { secret: ByteArray }                    // withdraw() - maker provides secret
  WithdrawToAction { secret: ByteArray, to: ByteArray }   // withdrawTo() - maker provides secret + destination
  CancelAction                                           // cancel() - maker cancels after expiry
  PublicWithdrawAction { secret: ByteArray }             // publicWithdraw() - anyone with secret
  PublicCancelAction                                     // publicCancel() - anyone cancels after expiry
  ClaimSafetyAction                                      // resolver claims safety deposit
  RefundSafetyAction                                     // maker refunds safety deposit
}

// Main source swap validator
validator source_swap {
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

    // Check if contract has expired (using validity range start)
    let is_expired = when tx.validity_range.lower_bound.bound_type is {
      interval.Finite(time) -> time >= expiry_time
      _ -> False
    }

    when redeemer is {
      // withdraw() - Maker withdraws by providing their secret
      WithdrawAction { secret } -> {
        let valid_maker_secret = keccak_256(secret) == maker_secret_hash
        let signed_by_maker = list.has(tx.extra_signatories, maker)
        let not_expired = !is_expired
        
        valid_maker_secret && signed_by_maker && not_expired
      }

      // withdrawTo() - Maker withdraws to specific address with secret
      WithdrawToAction { secret, to } -> {
        let valid_maker_secret = keccak_256(secret) == maker_secret_hash
        let signed_by_maker = list.has(tx.extra_signatories, maker)
        let not_expired = !is_expired
        
        // Simple check - in real implementation would verify outputs
        let funds_to_address = True  // Simplified for now
        
        valid_maker_secret && signed_by_maker && not_expired && funds_to_address
      }

      // cancel() - Maker cancels after expiry
      CancelAction -> {
        let signed_by_maker = list.has(tx.extra_signatories, maker)
        
        signed_by_maker && is_expired
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

// Safety deposit validator for source
validator source_safety {
  spend(
    datum: Option<SafetyDatum>,
    redeemer: Redeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(SafetyDatum { 
      maker, 
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

      // Maker refunds safety deposit after expiry if swap not completed
      RefundSafetyAction -> {
        let signed_by_maker = list.has(tx.extra_signatories, maker)
        let is_safety_expired = when tx.validity_range.lower_bound.bound_type is {
          interval.Finite(time) -> time >= expiry_time
          _ -> False
        }
        let swap_not_completed = !swap_completed
        
        signed_by_maker && is_safety_expired && swap_not_completed
      }

      _ -> False
    }
  }
}


