pub fn factory(
  _datum: Unit,
  redeemer: FactoryRedeemer,
  ctx: ScriptContext
) -> Bool {
  // Replace with actual PKH of the maker (signer authorized to deploy)
  let maker_pkh = <maker-pubkey-hash-here>

  // Replace with actual Source and Destination contract addresses
  let source_script_addr = <source-script-address-here>
  let destination_script_addr = <destination-script-address-here>

  // Minimum ADA to be sent to child contracts (change as per your protocol)
  let min_ada = 1_000_000  // 1 ADA in lovelace

  // Check that maker signed this spending transaction
  if !tx_signed_by(ctx.tx_info, maker_pkh) {
    trace("Factory: Maker signature missing") false
  } else {
    match redeemer {
      SelectSource => {
        let ok = has_output_to_addr_with_min_ada(ctx.tx_info.outputs, source_script_addr, min_ada)
        if !ok {
          trace("Factory: Missing or insufficient output to source contract") false
        } else {
          true
        }
      }
      SelectDestination => {
        let ok = has_output_to_addr_with_min_ada(ctx.tx_info.outputs, destination_script_addr, min_ada)
        if !ok {
          trace("Factory: Missing or insufficient output to destination contract") false
        } else {
          true
        }
      }
    }
  }
}
