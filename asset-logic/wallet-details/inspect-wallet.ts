import type { Wallet } from "@coinbase/coinbase-sdk"
import type { VaultResult } from "@/ai"
import type { GetWalletDetailsArgumentsType, GetWalletDetailsResultBodyType } from "./types"

export async function inspectWallet(
  vault: Wallet,
  _: GetWalletDetailsArgumentsType
): Promise<VaultResult<GetWalletDetailsResultBodyType>> {
  try {
    const primaryAddress = await vault.getDefaultAddress()

    return {
      message: `Vault ID: ${vault.getId()} | Network: ${vault.getNetworkId()} | Primary Address: ${primaryAddress.getId()}`,
      body: {
        address: primaryAddress.getId(),
      },
    }
  } catch (err) {
    return {
      message: `Failed to retrieve wallet information: ${err}`,
    }
  }
}