// src/config/env.ts

/**
 * Environment configuration utility
 * Centralizes access to environment variables with fallbacks
 */

export const ENV = {
  // Blockfrost configuration
  BLOCKFROST_PROJECT_ID: 
    process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || 
    process.env.BLOCKFROST_API_KEY || 
    '',
  
  // Network configuration
  NETWORK: process.env.NEXT_PUBLIC_NETWORK || process.env.NETWORK || 'preprod',
  
  // API URLs
  BLOCKFROST_API_URL: 
    process.env.NEXT_PUBLIC_BLOCKFROST_API_URL || 
    'https://cardano-preprod.blockfrost.io/api/v0',
  
  // Wallet configuration (server-side only)
  SEED_PHRASE: process.env.SEED_PHRASE || '',
} as const;

/**
 * Validates that required environment variables are set
 */
export function validateEnvironment(): void {
  const required = {
    'Blockfrost Project ID': ENV.BLOCKFROST_PROJECT_ID,
  };
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default ENV;
