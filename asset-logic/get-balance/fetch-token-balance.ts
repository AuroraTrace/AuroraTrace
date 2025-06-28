import { Wallet } from "@coinbase/coinbase-sdk"

import type { VaultResult } from "@/ai"
import type { GetBalanceArgumentsType, GetBalanceResultBodyType } from "./types"

export async function fetchTokenBalance(
  vault: Wallet,
  params: GetBalanceArgumentsType
): Promise<VaultResult<GetBalanceResultBodyType>> {
  try {
    const mainAddress = await vault.getDefaultAddress()
    const balance = await mainAddress.getBalance(params.assetId)

    return {
      message: `Wallet ${vault.getId()} balance retrieved successfully.\nAmount: ${balance}`,
      body: { balance },
    }
  } catch (err) {
    return {
      message: `Failed to retrieve balance for wallet: ${err}`,
    }
  }
}