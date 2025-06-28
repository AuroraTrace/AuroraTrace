import { getSolanaBalance, getRecentTxStats, logWalletHealth } from "./utils"
import type { WalletHealthReport } from "./types"

const ACTIVITY_THRESHOLD = 5
const BALANCE_THRESHOLD = 0.2
const AVG_TX_AMOUNT_THRESHOLD = 0.05

export async function assessWalletHealth(walletAddress: string): Promise<WalletHealthReport> {
  const balance = await getSolanaBalance(walletAddress)
  const txStats = await getRecentTxStats(walletAddress)

  const isLowBalance = balance < BALANCE_THRESHOLD
  const isLowActivity = txStats.txCount < ACTIVITY_THRESHOLD
  const isLowValue = txStats.averageTxAmount < AVG_TX_AMOUNT_THRESHOLD

  const flags: string[] = []
  if (isLowBalance) flags.push("LowBalance")
  if (isLowActivity) flags.push("LowTxCount")
  if (isLowValue) flags.push("LowAvgTxValue")

  const score = 100 - (flags.length * 25)
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Caution" : "Risk"

  const report: WalletHealthReport = {
    wallet: walletAddress,
    score,
    label,
    balance,
    txCount: txStats.txCount,
    averageTxAmount: txStats.averageTxAmount,
    flags
  }

  logWalletHealth(report)
  return report
}