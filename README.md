# Cardano HTLC and EVM Cross-Chain Swap Project

This project provides a framework for implementing Hash Time Lock Contracts (HTLCs) on the Cardano blockchain (non-EVM) using the Aiken framework in a Nix environment, alongside EVM-based cross-chain swaps using 1inch's Cross-Chain Resolver, Limit Order Protocol, and Cross-Chain Swap SDK. The Cardano implementation focuses on generating `.plutus` files and obtaining preprod/mainnet addresses without running a full Cardano node, while the EVM implementation leverages 1inch's tools for seamless cross-chain functionality.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Cardano Fusion Extension](#cardano-fusion-extension)
  - [Aiken Validators (.ak files)](#aiken-validators-ak-files)
  - [Partial Fills Implementation](#partial-fills-implementation)
  - [HTLC Cross-Chain Implementation](#htlc-cross-chain-implementation)
  - [Lines of Code Statistics](#lines-of-code-statistics)
- [Cardano (Non-EVM) Setup](#cardano-non-evm-setup)
  - [Nix Environment Setup](#nix-environment-setup)
  - [Aiken Framework Installation](#aiken-framework-installation)
  - [Writing HTLC Contracts in Aiken](#writing-htlc-contracts-in-aiken)
  - [Generating .plutus Files](#generating-plutus-files)
  - [Obtaining Preprod and Mainnet Addresses](#obtaining-preprod-and-mainnet-addresses)
- [EVM Setup](#evm-setup)
  - [1inch Cross-Chain Resolver](#1inch-cross-chain-resolver)
  - [1inch Limit Order Protocol](#1inch-limit-order-protocol)
  - [1inch Cross-Chain Swap SDK](#1inch-cross-chain-swap-sdk)
- [Usage](#usage)
  - [Cardano HTLC Deployment](#cardano-htlc-deployment)
  - [EVM Cross-Chain Swap](#evm-cross-chain-swap)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview
This project enables developers to:
- **Cardano (Non-EVM)**: Create HTLC smart contracts using Aiken, compile them to Untyped Plutus Core (UPLC), and generate `.plutus` files. Use `cardano-cli` to obtain preprod and mainnet addresses without running a full node, leveraging lightweight tools like Ogmios or Blockfrost.
- **EVM**: Implement cross-chain swaps using 1inch's Cross-Chain Resolver, Limit Order Protocol, and Cross-Chain Swap SDK, enabling seamless function calls across EVM-compatible chains.

The goal is to provide a streamlined developer experience for cross-chain atomic swaps, combining Cardano's eUTXO model with EVM's account-based model.

## Cardano Fusion Extension

The `cardano-fusion-extension` directory contains the core implementation of cross-chain atomic swaps using Aiken smart contracts. This module provides sophisticated HTLC (Hash Time Lock Contract) functionality with partial fill support and safety mechanisms.

### Aiken Validators (.ak files)

The project includes four main validators written in Aiken:

#### 1. Source Validator (`source.ak`)
- **Lines of Code**: 158 lines
- **Purpose**: Manages the source chain side of cross-chain swaps
- **Key Features**:
  - Supports maker-initiated swaps with secret hash verification
  - Implements `withdrawTo()` functionality for directing funds to specific addresses
  - Includes safety deposit mechanisms for dispute resolution
  - Provides public withdraw/cancel functions for emergency situations

#### 2. Destination Validator (`destination.ak`)
- **Lines of Code**: 144 lines  
- **Purpose**: Handles the destination chain side of cross-chain swaps
- **Key Features**:
  - Taker-side swap completion with secret revelation
  - Time-locked cancellation mechanisms
  - Safety deposit claim/refund functionality
  - Public access functions for decentralized dispute resolution

#### 3. Legacy Validators
- `sourceOG.ak` and `destinationOG.ak` provide the original implementation patterns
- These serve as reference implementations and fallback options

### Partial Fills Implementation

The project features an advanced partial fills system located in `partial_fills/contracts/`:

#### Merkle Tree-Based Order Management (`partial_fill_merkle.ak`)
- **Lines of Code**: 529 lines
- **Purpose**: Implements sophisticated order book functionality with Merkle tree verification
- **Key Components**:
  - **Order Structure**: Comprehensive order data including maker/taker assets, amounts, and fill tracking
  - **Fill Records**: Detailed execution tracking with timestamps and partial fill flags
  - **Merkle Proofs**: Efficient batch validation of multiple orders and fills
  - **Minimum Fill Amounts**: Prevents dust attacks and ensures economic viability

#### Features:
- **Batch Processing**: Validate multiple partial fills in a single transaction
- **Order Tracking**: Maintains filled amounts and remaining quantities
- **Proof Verification**: Uses Merkle trees for efficient order validation
- **Safety Mechanisms**: Minimum fill amounts and expiry times

### HTLC Cross-Chain Implementation

The HTLC implementation provides secure cross-chain atomic swaps with the following architecture:

#### Core HTLC Features:
1. **Secret Hash Verification**: Uses Keccak-256 hashing for cross-chain compatibility
2. **Time Locks**: Configurable expiry times for both swap initiation and completion
3. **Dual-Chain Safety**: Source and destination validators work in tandem
4. **Safety Deposits**: Additional collateral mechanism for dispute resolution

#### Swap Flow:
1. **Initiation**: Maker locks funds on source chain with secret hash
2. **Response**: Taker locks funds on destination chain with same secret hash
3. **Completion**: Either party can complete by revealing the secret
4. **Timeout**: Funds can be reclaimed after expiry if swap incomplete

#### Safety Mechanisms:
- **Resolver System**: Third-party dispute resolution with safety deposits
- **Public Functions**: Community-driven emergency recovery options
- **Time-Based Refunds**: Automatic fund recovery after expiration

### Lines of Code Statistics

**Cardano Fusion Extension Total**: ~831 lines of Aiken code
- `source.ak`: 158 lines
- `destination.ak`: 144 lines
- `partial_fill_merkle.ak`: 529 lines

**Project Structure**:
- 4 main validator contracts
- 2 Aiken projects (main + partial fills)
- Generated Plutus scripts for on-chain deployment
- Address generation for both testnet and mainnet
- Comprehensive cross-chain swap infrastructure

## Prerequisites
- **Cardano (Non-EVM)**:
  - Nix package manager
  - Rust (for Aiken compiler)
  - `cardano-cli` (version compatible with Cardano node 8.0.0 or later)
  - Access to a Cardano API provider (e.g., Blockfrost, Koios, or Ogmios)
  - Basic understanding of Cardano's eUTXO model
- **EVM**:
  - Node.js (v16 or later)
  - Hardhat or Truffle for EVM contract development
  - Access to an EVM-compatible chain (e.g., Ethereum, Polygon, BSC)
  - 1inch API key (optional for enhanced functionality)
- General:
  - Git
  - Basic knowledge of smart contract development and cross-chain concepts

## Cardano (Non-EVM) Setup

### Nix Environment Setup
1. Install Nix:
   ```bash
   curl -L https://nixos.org/nix/install | sh
   source ~/.nix-profile/etc/profile.d/nix.sh
   ```
2. Create a `shell.nix` file for the Aiken development environment:
   ```bash
   {
     inputs = {
       nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
       aiken.url = "github:aiken-lang/aiken";
     };
     outputs = { self, nixpkgs, aiken }:
       let
         system = "x86_64-linux";
         pkgs = import nixpkgs { inherit system; };
       in {
         devShell.${system} = pkgs.mkShell {
           buildInputs = [
             pkgs.rustc
             pkgs.cargo
             aiken.packages.${system}.aiken
             pkgs.cardano-cli
           ];
         };
       }
   }
   ```
3. Enter the Nix shell:
   ```bash
   nix-shell
   ```

### Aiken Framework Installation
1. Install Aiken from source or via Nix (already included in `shell.nix` above).
2. Verify installation:
   ```bash
   aiken --version
   ```

### Writing HTLC Contracts in Aiken
1. Create a new Aiken project:
   ```bash
   aiken new htlc-contract
   cd htlc-contract
   ```
2. Write an HTLC contract (example in `validators/htlc.ak`):
   ```aiken
   validator {
     fn htlc(datum: {hash: ByteArray, timelock: Int, recipient: ByteArray}, redeemer: {hash: ByteArray, secret: ByteArray}, ctx: ScriptContext) -> Bool {
       let tx_valid = ctx.tx_info.time_range.start <= timelock
       let hash_valid = hash == sha2_256(secret)
       let recipient_valid = ctx.tx_info.outputs.any(
         fn(out) { out.address == recipient }
       )
       tx_valid && hash_valid && recipient_valid
     }
   }
   ```
3. Compile the contract to UPLC:
   ```bash
   aiken build
   ```

### Generating .plutus Files
1. Generate the `.plutus` file from the compiled UPLC:
   ```bash
   aiken blueprint convert -v htlc > htlc.plutus
   ```
2. The `htlc.plutus` file contains the compiled Plutus Core script ready for Cardano.

### Obtaining Preprod and Mainnet Addresses
1. Set up `cardano-cli` with an API provider (e.g., Blockfrost):
   ```bash
   export BLOCKFROST_API_KEY=<your-api-key>
   ```
2. Generate a payment key pair:
   ```bash
   cardano-cli address key-gen --verification-key-file payment.vkey --signing-key-file payment.skey
   ```
3. Build a preprod address:
   ```bash
   cardano-cli address build --payment-verification-key-file payment.vkey --testnet-magic 1 --out-file payment.addr
   ```
4. For mainnet, use `--mainnet` instead:
   ```bash
   cardano-cli address build --payment-verification-key-file payment.vkey --mainnet --out-file payment-mainnet.addr
   ```
5. Use the script address for the HTLC contract:
   ```bash
   cardano-cli address build --payment-script-file htlc.plutus --testnet-magic 1 --out-file htlc.addr
   ```

## EVM Setup

### 1inch Cross-Chain Resolver
1. Clone the 1inch Cross-Chain Resolver example repository:
   ```bash
   git clone https://github.com/1inch/cross-chain-resolver
   cd cross-chain-resolver
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the resolver with your EVM chain details (e.g., in `hardhat.config.js`).
4. Deploy the resolver contract:
   ```bash
   npx hardhat deploy --network <your-network>
   ```

### 1inch Limit Order Protocol
1. Clone the 1inch Limit Order Protocol repository:
   ```bash
   git clone https://github.com/1inch/limit-order-protocol
   cd limit-order-protocol
   ```
2. Install dependencies and deploy:
   ```bash
   npm install
   npx hardhat deploy --network <your-network>
   ```
3. Configure limit orders for cross-chain swaps (see repository documentation).

### 1inch Cross-Chain Swap SDK
1. Install the 1inch Cross-Chain Swap SDK:
   ```bash
   npm install @1inch/cross-chain-sdk
   ```
2. Example usage for a cross-chain swap:
   ```javascript
   const { CrossChainSwap } = require('@1inch/cross-chain-sdk');
   const swap = new CrossChainSwap({
     fromChainId: 1, // Ethereum
     toChainId: 137, // Polygon
     fromTokenAddress: '0x...',
     toTokenAddress: '0x...',
     amount: '1000000000000000000', // 1 ETH
     slippage: 1,
     walletAddress: '0x...',
     apiKey: '<your-1inch-api-key>'
   });
   const tx = await swap.buildTx();
   console.log(tx);
   ```
3. Execute the transaction using a wallet provider (e.g., ethers.js).

## Usage

### Cardano HTLC Deployment
1. Fund the preprod address (`htlc.addr`) with test ADA via a faucet (e.g., Cardano preprod faucet).
2. Create a transaction to lock funds in the HTLC:
   ```bash
   cardano-cli transaction build \
     --testnet-magic 1 \
     --tx-in <your-tx-in> \
     --tx-out "$(cat htlc.addr)+10000000" \
     --tx-out-datum-embed-file datum.json \
     --change-address $(cat payment.addr) \
     --out-file tx.raw
   ```
3. Sign and submit the transaction:
   ```bash
   cardano-cli transaction sign \
     --tx-body-file tx.raw \
     --signing-key-file payment.skey \
     --testnet-magic 1 \
     --out-file tx.signed
   cardano-cli transaction submit --testnet-magic 1 --tx-file tx.signed
   ```

### EVM Cross-Chain Swap
1. Using the 1inch Cross-Chain Swap SDK to initiate a swap (as shown above).
2. Approve the transaction in your wallet (e.g., MetaMask).
3. Monitor the transaction on the destination chain using a block explorer.

## Testing
- **Cardano**:
  - Use Aiken's testing framework to validate the HTLC contract:
    ```bash
    aiken check
    ```
  - Test on Cardano preprod testnet before mainnet deployment.
- **EVM**:
  - Use Hardhat/Truffle test suites provided in the 1inch repositories.
  - Test cross-chain swaps on testnets (e.g., Goerli, Mumbai).

## Contributing
Contributions are welcome! Please submit pull requests or open issues on the project's GitHub repository.

## License
This project is licensed under the MIT License.
