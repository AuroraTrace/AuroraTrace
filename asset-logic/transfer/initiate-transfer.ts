import { Wallet } from "@coinbase/coinbase-sdk"
import type { TransferArgumentsType, TransferActionResultType } from "./types"

export async function initiateTransfer(
  sender: Wallet,
  params: TransferArgumentsType
): Promise<TransferActionResultType> {
  try {
    const response = await sender.createTransfer({
      amount: params.amount,
      assetId: params.assetId,
      destination: params.destination,
      gasless: params.gasless,
    })

    const confirmation = await response.wait()
    const tx = confirmation.getTransaction()

    if (!tx) throw new Error("Transaction object is undefined")

    const hash = tx.getTransactionHash()
    if (!hash) throw new Error("Transaction hash is missing")

    return {
      message: `Sent ${params.amount} ${params.assetId} to ${params.destination}.\nHash: ${hash}\nLink: ${tx.getTransactionLink()}`,
      body: {
        transactionHash: hash,
        symbol: params.assetId,
      },
    }
  } catch (err) {
    return {
      message: `Transfer failed: ${err}`,
    }
  }
}