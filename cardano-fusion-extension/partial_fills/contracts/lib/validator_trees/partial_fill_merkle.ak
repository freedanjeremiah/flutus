use aiken/bytearray.{from_string}
use aiken/hash.{Hash, Blake2b_256}
use aiken/crypto.{keccak_256}
use aiken/list
use aiken/option.{choice, is_none}

// Enhanced Merkle Tree for Partial// Batch validate multiple partial fills
pub fn validate_batch_fills(
  orders: List<Order>,
  fills: List<Fill>,
  order_tree_root: Hash<Blake2b_256, Order>,
  proofs: List<Proof<Order>>,
  serialise_fn: fn(Order) -> ByteArray,
) -> Bool {ills
// Maintains core Merkle tree functionality while adding order fill tracking

pub opaque type MerkleElement<a> {
  Empty
  Leaf { value: a, hash: Hash<Blake2b_256, a> }
  Node {
    hash: Hash<Blake2b_256, a>,
    left: MerkleElement<a>,
    right: MerkleElement<a>,
  }
}

// Order structure for partial fills
pub type Order {
  order_id: ByteArray,           // Unique order identifier
  maker: ByteArray,              // Order maker address
  maker_asset: ByteArray,        // Asset being sold
  taker_asset: ByteArray,        // Asset being bought
  maker_amount: Int,             // Total amount to sell
  taker_amount: Int,             // Total amount to buy
  filled_amount: Int,            // Amount already filled
  min_fill_amount: Int,          // Minimum fill size
  expiry: Int,                   // Order expiration time
  salt: ByteArray,               // Random salt for uniqueness
}

// Fill execution record
pub type Fill {
  order_id: ByteArray,           // Reference to original order
  fill_id: ByteArray,            // Unique fill identifier
  taker: ByteArray,              // Who executed the fill
  filled_maker_amount: Int,      // Amount of maker asset filled
  filled_taker_amount: Int,      // Amount of taker asset filled
  timestamp: Int,                // When fill was executed
  partial: Bool,                 // Whether this is a partial fill
}

// Enhanced proof structure for order validation
pub type OrderProof<a> =
  List<OrderProofItem<a>>

pub type OrderProofItem<a> {
  Left { hash: Hash<Blake2b_256, a> }
  Right { hash: Hash<Blake2b_256, a> }
  OrderFill { order_hash: Hash<Blake2b_256, a>, fill_data: Fill }
}

pub type Proof<a> =
  List<ProofItem<a>>

pub type ProofItem<a> {
  Left { hash: Hash<Blake2b_256, a> }
  Right { hash: Hash<Blake2b_256, a> }
}

// Function returning a hash of a given Merkle Tree element
pub fn element_hash(self: MerkleElement<a>) -> Hash<Blake2b_256, a> {
  when self is {
    Empty ->
      #""
    Leaf { hash, .. } ->
      hash
    Node { hash, .. } ->
      hash
  }
}

// Calculate order hash for Merkle tree inclusion
pub fn order_hash(order: Order) -> Hash<Blake2b_256, Order> {
  let order_bytes = bytearray.concat(
    order.order_id,
    bytearray.concat(
      order.maker,
      bytearray.concat(
        order.maker_asset,
        bytearray.concat(
          order.taker_asset,
          bytearray.concat(
            from_string(@""),  // Convert amounts to bytes (simplified)
            order.salt
          )
        )
      )
    )
  )
  keccak_256(order_bytes)
}

// Calculate fill hash
pub fn fill_hash(fill: Fill) -> Hash<Blake2b_256, Fill> {
  let fill_bytes = bytearray.concat(
    fill.order_id,
    bytearray.concat(
      fill.fill_id,
      bytearray.concat(
        fill.taker,
        from_string(@"")  // Convert amounts and timestamp to bytes (simplified)
      )
    )
  )
  keccak_256(fill_bytes)
}

// Check if order can be partially filled
pub fn can_partial_fill(order: Order, requested_amount: Int) -> Bool {
  let remaining_amount = order.maker_amount - order.filled_amount
  let min_fill = order.min_fill_amount
  
  // Check if requested amount is valid for partial fill
  requested_amount >= min_fill && 
  requested_amount <= remaining_amount &&
  remaining_amount > 0
}

// Calculate partial fill amounts based on order ratio
pub fn calculate_fill_amounts(
  order: Order, 
  requested_maker_amount: Int
) -> (Int, Int) {
  // Calculate proportional taker amount based on order ratio
  let taker_amount = (requested_maker_amount * order.taker_amount) / order.maker_amount
  (requested_maker_amount, taker_amount)
}

// Validate that a fill is legitimate for an order
pub fn validate_fill(order: Order, fill: Fill) -> Bool {
  let valid_order_ref = fill.order_id == order.order_id
  let valid_amounts = fill.filled_maker_amount > 0 && fill.filled_taker_amount > 0
  let not_overfilled = order.filled_amount + fill.filled_maker_amount <= order.maker_amount
  let meets_minimum = fill.filled_maker_amount >= order.min_fill_amount
  
  valid_order_ref && valid_amounts && not_overfilled && meets_minimum
}

// Check if order is completely filled
pub fn is_order_complete(order: Order) -> Bool {
  order.filled_amount >= order.maker_amount
}

// Update order with new fill
pub fn apply_fill(order: Order, fill: Fill) -> Order {
  Order {
    order_id: order.order_id,
    maker: order.maker,
    maker_asset: order.maker_asset,
    taker_asset: order.taker_asset,
    maker_amount: order.maker_amount,
    taker_amount: order.taker_amount,
    filled_amount: order.filled_amount + fill.filled_maker_amount,
    min_fill_amount: order.min_fill_amount,
    expiry: order.expiry,
    salt: order.salt,
  }
}

// Enhanced membership check for orders with fill validation
pub fn member_with_fills(
  order: Order,
  fills: List<Fill>,
  root_hash: Hash<Blake2b_256, Order>,
  proof: Proof<Order>,
  serialise_fn: fn(Order) -> ByteArray,
) -> Bool {
  // First validate the order is in the tree
  let order_in_tree = member(order, root_hash, proof, serialise_fn)
  
  // Then validate all fills are legitimate
  let all_fills_valid = list.all(fills, fn(fill) { validate_fill(order, fill) })
  
  // Check that fills don't exceed order amount
  let total_filled = list.foldr(fills, 0, fn(fill, acc) { acc + fill.filled_maker_amount })
  let not_overfilled = total_filled <= order.maker_amount
  
  order_in_tree && all_fills_valid && not_overfilled
}

// Create order tree for efficient lookups
pub fn create_order_tree(
  orders: List<Order>,
  serialise_fn: fn(Order) -> ByteArray,
) -> MerkleElement<Order> {
  from_list(orders, serialise_fn)
}

// Batch validate multiple partial fills
pub fn validate_batch_fills(
  orders: List<Order>,
  fills: List<Fill>,
  order_tree_root: Hash<Sha2_256, Order>,
  proofs: List<Proof<Order>>,
  serialise_fn: fn(Order) -> ByteArray,
) -> Bool {
  // Ensure we have matching numbers of orders and proofs
  let orders_count = list.length(orders)
  let proofs_count = list.length(proofs)
  
  if orders_count != proofs_count {
    False
  } else {
    // Validate each order-proof pair
    let orders_valid = list.all(
      list.zip(orders, proofs),
      fn(order_proof_pair) {
        let (order, proof) = order_proof_pair
        member(order, order_tree_root, proof, serialise_fn)
      }
    )
    
    // Validate all fills reference valid orders
    let fills_valid = list.all(fills, fn(fill) {
      list.any(orders, fn(order) { 
        order.order_id == fill.order_id && validate_fill(order, fill)
      })
    })
    
    orders_valid && fills_valid
  }
}

// Calculate remaining order capacity
pub fn get_remaining_capacity(order: Order) -> Int {
  order.maker_amount - order.filled_amount
}

// Check if order is expired
pub fn is_order_expired(order: Order, current_time: Int) -> Bool {
  current_time >= order.expiry
}

// Original Merkle tree functions (preserved)

/// Function atests whether two Merkle Tress are equal, this is the case when their root hashes match.
pub fn is_equal(left: MerkleElement<a>, right: MerkleElement<a>) -> Bool {
  element_hash(left) == element_hash(right)
}

/// Function returns a total numbers of leaves in the tree.
pub fn size(self: MerkleElement<a>) -> Int {
  when self is {
    Empty ->
      0
    Leaf { .. } ->
      1
    Node { left, right, .. } ->
      size(left) + size(right)
  }
}

fn combine_hash(
  left: Hash<Blake2b_256, a>,
  right: Hash<Blake2b_256, a>,
) -> Hash<Blake2b_256, a> {
  keccak_256(bytearray.concat(left, right))
}

/// Function that returns whether merkle tree has any elements
pub fn is_empty(self: MerkleElement<a>) -> Bool {
  when self is {
    Empty ->
      True
    _ ->
      False
  }
}

fn do_proof(
  self: MerkleElement<a>,
  item_hash: Hash<Blake2b_256, a>,
  proof: Proof<a>,
  serialise_fn: fn(a) -> ByteArray,
) -> Option<Proof<a>> {
  when self is {
    Empty ->
      None
    Leaf { hash, .. } ->
      if hash == item_hash {
        Some(proof)
      } else {
        None
      }
    Node { left, right, .. } -> {
      let rh =
        element_hash(right)
      let lh =
        element_hash(left)
      let go_left: Option<Proof<a>> =
        do_proof(
          left,
          item_hash,
          list.push(proof, Right { hash: rh }),
          serialise_fn,
        )
      let go_right: Option<Proof<a>> =
        do_proof(
          right,
          item_hash,
          list.push(proof, Left { hash: lh }),
          serialise_fn,
        )
      choice([go_left, go_right])
    }
  }
}

/// Construct a membership 'Proof' from an element and a 'MerkleTree'. Returns
/// 'None' if the element isn't a member of the tree to begin with.
/// Note function will return Some([]) in case root of the tree is also it's only one and only element
pub fn get_proof(
  self: MerkleElement<a>,
  item: a,
  serialise_fn: fn(a) -> ByteArray,
) -> Option<Proof<a>> {
  let empty: Proof<a> =
    []

  do_proof(self, keccak_256(serialise_fn(item)), empty, serialise_fn)
}

/// Construct a 'MerkleTree' from a list of elements.
/// Note that, while this operation is doable on-chain, it is expensive and
/// preferably done off-chain.
pub fn from_list(
  items: List<a>,
  serialise_fn: fn(a) -> ByteArray,
) -> MerkleElement<a> {
  do_from_list(items, list.length(items), serialise_fn)
}

fn do_from_list(
  items: List<a>,
  len: Int,
  serialise_fn: fn(a) -> ByteArray,
) -> MerkleElement<a> {
  when items is {
    [] ->
      Empty
    [item] -> {
      let hashed_item =
        keccak_256(serialise_fn(item))
      Leaf { value: item, hash: hashed_item }
    }
    all -> {
      let cutoff: Int =
        len / 2
      let left =
        all
          |> list.take(cutoff)
          |> do_from_list(cutoff, serialise_fn)
      let right =
        all
          |> list.drop(cutoff)
          |> do_from_list(len - cutoff, serialise_fn)
      let hash =
        combine_hash(element_hash(left), element_hash(right))
      Node { hash, left, right }
    }
  }
}

// Check whether a hashed element is part of a 'MerkleTree' using only its root hash
// and a 'Proof'. The proof is guaranteed to be in log(n) of the size of the
// tree, which is why we are interested in such data-structure in the first
// place.
pub fn member_from_hash(
  item_hash: Hash<Blake2b_256, a>,
  root_hash: Hash<Blake2b_256, a>,
  proof: Proof<a>,
) -> Bool {
  when proof is {
    [] ->
      root_hash == item_hash
    [head, ..tail] ->
      when head is {
        Left { hash: l } ->
          member_from_hash(combine_hash(l, item_hash), root_hash, tail)
        Right { hash: r } ->
          member_from_hash(combine_hash(item_hash, r), root_hash, tail)
      }
  }
}

// Check whether an element is part of a 'MerkleTree' using only its root hash
// and a 'Proof'. The proof is guaranteed to be in log(n) of the size of the
// tree, which is why we are interested in such data-structure in the first
// place.
pub fn member(
  item: a,
  root_hash: Hash<Blake2b_256, a>,
  proof: Proof<a>,
  serialise_fn: fn(a) -> ByteArray,
) -> Bool {
  let item_hash =
    keccak_256(serialise_fn(item))
  member_from_hash(item_hash, root_hash, proof)
}

pub fn member_from_tree(
  tree: MerkleElement<a>,
  item: a,
  serialise_fn: fn(a) -> ByteArray,
) -> Bool {
  let proof: Option<Proof<a>> =
    get_proof(tree, item, serialise_fn)
  let root_hash =
    element_hash(tree)

  when proof is {
    Some(p) ->
      member(item, root_hash, p, serialise_fn)
    None ->
      False
  }
}

fn get_proof_item_value(proof_item: ProofItem<a>) -> Hash<Blake2b_256, a> {
  when proof_item is {
    Left(hash) ->
      hash
    Right(hash) ->
      hash
  }
}

// Helper function for serializing orders
pub fn serialize_order(order: Order) -> ByteArray {
  bytearray.concat(
    order.order_id,
    bytearray.concat(
      order.maker,
      bytearray.concat(
        order.maker_asset,
        bytearray.concat(
          order.taker_asset,
          order.salt
        )
      )
    )
  )
}

// Helper function for serializing fills
pub fn serialize_fill(fill: Fill) -> ByteArray {
  bytearray.concat(
    fill.order_id,
    bytearray.concat(
      fill.fill_id,
      fill.taker
    )
  )
}

// Test functions for partial fill functionality
test partial_fill_validation_1() {
  let order = Order {
    order_id: #"01",
    maker: #"maker1",
    maker_asset: #"token_a",
    taker_asset: #"token_b", 
    maker_amount: 1000,
    taker_amount: 2000,
    filled_amount: 0,
    min_fill_amount: 100,
    expiry: 9999999,
    salt: #"salt1",
  }
  
  let fill = Fill {
    order_id: #"01",
    fill_id: #"fill1",
    taker: #"taker1",
    filled_maker_amount: 200,
    filled_taker_amount: 400,
    timestamp: 1000,
    partial: True,
  }
  
  validate_fill(order, fill)
}

test partial_fill_amounts_1() {
  let order = Order {
    order_id: #"01",
    maker: #"maker1",
    maker_asset: #"token_a",
    taker_asset: #"token_b",
    maker_amount: 1000,
    taker_amount: 2000,
    filled_amount: 0,
    min_fill_amount: 100,
    expiry: 9999999,
    salt: #"salt1",
  }
  
  let (maker_fill, taker_fill) = calculate_fill_amounts(order, 300)
  
  maker_fill == 300 && taker_fill == 600
}

test order_capacity_1() {
  let order = Order {
    order_id: #"01",
    maker: #"maker1",
    maker_asset: #"token_a",
    taker_asset: #"token_b",
    maker_amount: 1000,
    taker_amount: 2000,
    filled_amount: 300,
    min_fill_amount: 100,
    expiry: 9999999,
    salt: #"salt1",
  }
  
  get_remaining_capacity(order) == 700
}
