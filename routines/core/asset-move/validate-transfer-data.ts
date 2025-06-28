// validate-transfer-data.ts

import { z } from "zod"

export const TransferDataSchema = z.object({
  sender: z
    .string()
    .min(32)
    .max(44)
    .describe("Sender wallet address (Base58)"),
  recipient: z
    .string()
    .min(32)
    .max(44)
    .describe("Recipient wallet address (Base58)"),
  amount: z
    .number()
    .positive()
    .describe("Amount of tokens to transfer"),
  tokenSymbol: z
    .string()
    .min(1)
    .max(10)
    .describe("Symbol of the token to be transferred"),
  memo: z
    .string()
    .max(200)
    .optional()
    .describe("Optional memo for the transfer"),
  network: z
    .enum(["solana", "mainnet", "testnet", "devnet"])
    .default("solana")
    .describe("Target network for the transfer"),
})

export type TransferData = z.infer<typeof TransferDataSchema>

export function validateTransferData(input: unknown): {
  success: boolean
  errors?: string[]
  data?: TransferData
} {
  const result = TransferDataSchema.safeParse(input)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}