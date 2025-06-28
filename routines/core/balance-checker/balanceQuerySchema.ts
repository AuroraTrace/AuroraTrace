import { z } from "zod"

/**
 * Schema for querying wallet balances on Solana
 */
export const BalanceQuerySchema = z
  .object({
    assetId: z
      .string()
      .min(32, "Asset ID must be at least 32 characters")
      .describe("Mint address or unique identifier of the asset to query"),

    walletAddress: z
      .string()
      .min(32, "Wallet address must be a valid Solana public key")
      .describe("Base58 encoded wallet public key to check balance against"),

    includeMetadata: z
      .boolean()
      .optional()
      .describe("If true, returns extended token metadata (decimals, symbol, etc.)"),

    network: z
      .enum(["mainnet", "devnet", "testnet"])
      .default("mainnet")
      .describe("Target Solana network")
  })
  .strict()
  .describe("Extended schema for querying token balances via wallet address")
