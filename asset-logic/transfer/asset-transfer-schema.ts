import { z } from "zod"
import { Amount } from "@coinbase/coinbase-sdk"

export const AssetTransferSchema = z
  .object({
    amount: z.custom<Amount>().describe("Amount of tokens to send"),
    assetId: z.string().describe("ID of the asset to transfer"),
    destination: z.string().describe("Recipient wallet address"),
    gasless: z.boolean().default(false).describe("Execute the transfer without gas fee if supported"),
  })
  .strip()
  .describe("Schema for defining asset transfer instructions")