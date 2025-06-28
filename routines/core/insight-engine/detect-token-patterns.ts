import type { Wallet } from "@solbase/solbase-sdk"

interface WalletPatternResult {
  frequentTransfers: boolean
  lowBalanceHighTx: boolean
  anomalyScore: number
}

export async function detectWalletPatterns(wallet: Wallet): Promise<WalletPatternResult> {
  const address = await wallet.getDefaultAddress()
  const txHistory = await address.getTransactionHistory()

  const txCount = txHistory.length
  const recentTxs = txHistory.slice(0, 10)
  const totalValueMoved = recentTxs.reduce((acc, tx) => acc + (tx.amount || 0), 0)

  const frequentTransfers = txCount > 100
  const lowBalance = (await address.getBalance()) < 0.1
  const lowBalanceHighTx = lowBalance && txCount > 50

  const anomalyScore = Math.min(1, (txCount / 200 + totalValueMoved / 10000) / 2)

  return {
    frequentTransfers,
    lowBalanceHighTx,
    anomalyScore: parseFloat(anomalyScore.toFixed(2)),
  }
}