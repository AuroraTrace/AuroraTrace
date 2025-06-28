import { Wallet } from "@coinbase/coinbase-sdk"
import { RequestFaucetFundsArgumentsType, RequestFaucetFundsActionResultType } from "./types"

export async function acquireTestFunds(
  userWallet: Wallet,
  params: RequestFaucetFundsArgumentsType
): Promise<RequestFaucetFundsActionResultType> {
  try {
    const tx = await userWallet.faucet(params.assetId || undefined)
    const confirmation = await tx.wait()

    return {
      message: `Test tokens (${params.assetId || "SOL"}) received. View transaction: ${confirmation.getTransactionLink()}`,
      body: {
        transactionLink: confirmation.getTransactionLink(),
      },
    }
  } catch (err) {
    return {
      message: `Faucet request failed: ${err}`,
    }
  }
}