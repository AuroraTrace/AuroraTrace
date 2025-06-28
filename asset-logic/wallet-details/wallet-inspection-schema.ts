import { z } from "zod"

export const WalletInspectionSchema = z
  .object({})
  .strip()
  .describe("Schema to trigger wallet identity inspection")