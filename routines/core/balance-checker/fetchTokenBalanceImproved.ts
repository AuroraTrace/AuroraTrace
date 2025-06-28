import { Wallet } from "@coinbase/coinbase-sdk"

import type { VaultResult } from "@/ai"
import type { GetBalanceArgumentsType, GetBalanceResultBodyType } from "./types"

export async function fetchTokenBalance(
  vault: Wallet,
  params: GetBalanceArgumentsType
): Promise<VaultResult<GetBalanceResultBodyType>> {
  try {
    if (!params.assetId || params.assetId.length < 32) {
      return {
        message: "Invalid assetId provided. It must be a valid mint or token identifier."
      }
    }

    const mainAddress = await vault.getDefaultAddress()
    const balance = await mainAddress.getBalance(params.assetId)

    const result: VaultResult<GetBalanceResultBodyType> = {
      message: `✅ Balance retrieved for wallet ${vault.getId()}.
Token: ${params.assetId}
Amount: ${balance}`,
      body: { balance }
    }

    if (params.includeMetadata) {
      const tokenInfo = await mainAddress.getTokenMetadata(params.assetId).catch(() => null)

      if (tokenInfo) {
        result.body.symbol = tokenInfo.symbol
        result.body.decimals = tokenInfo.decimals
        result.body.name = tokenInfo.name
      }
    }

    return result
  } catch (err) {
    return {
      message: `❌ Failed to fetch balance for ${params.assetId} — ${String(err)}`
    }
  }
}
