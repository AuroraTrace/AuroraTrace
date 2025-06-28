import { z } from "zod"

export const BalanceQuerySchema = z
  .object({
    assetId: z.string().describe("Identifier of the asset to fetch balance for"),
  })
  .strip()
  .describe("Schema for querying token balances via wallet")