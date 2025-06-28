import { z } from "zod"

import type { VaultResult } from "../vault-action"
import type { AssetTransferSchema } from "./asset-transfer-schema"

export type AssetTransferType = typeof AssetTransferSchema

export type AssetTransferArgs = z.infer<AssetTransferType>

export type TransferPayload = {
  transactionHash: string
  symbol: string
}

export type AssetTransferOutcome = VaultResult<TransferPayload>