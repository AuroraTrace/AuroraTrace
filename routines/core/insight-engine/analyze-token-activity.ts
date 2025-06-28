
import axios from "axios"

export interface TransferEvent {
  signature: string
  timestamp: number
  sender: string
  recipient: string
  amount: number
}

export interface TokenMetrics {
  totalVolume: number
  uniqueSenders: number
  transactionCount: number
  activityScore: number
  anomalyFlags: string[]
}

export async function fetchTokenTransfers(tokenAddress: string): Promise<TransferEvent[]> {
  const url = `https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=YOUR_API_KEY&limit=100`

  const response = await axios.get(url)
  const data = response.data as any[]

  return data
    .filter(tx => tx.tokenTransfers && tx.tokenTransfers.length > 0)
    .map(tx => ({
      signature: tx.signature,
      timestamp: tx.timestamp,
      sender: tx.tokenTransfers[0].fromUserAccount,
      recipient: tx.tokenTransfers[0].toUserAccount,
      amount: tx.tokenTransfers[0].tokenAmount.uiAmount,
    }))
}

export function detectSuspiciousPatterns(transfers: TransferEvent[]): string[] {
  const flags: string[] = []
  const senderMap: Record<string, number> = {}

  for (const tx of transfers) {
    senderMap[tx.sender] = (senderMap[tx.sender] || 0) + 1
  }

  const frequentSenders = Object.values(senderMap).filter(count => count > 5)
  if (frequentSenders.length > 3) {
    flags.push("RepeatedSenders")
  }

  const recent = transfers.slice(-10)
  const recentVolume = recent.reduce((acc, tx) => acc + tx.amount, 0)
  if (recentVolume > 1_000_000) {
    flags.push("HighRecentVolume")
  }

  return flags
}

export function calculateTokenMetrics(transfers: TransferEvent[]): TokenMetrics {
  const totalVolume = transfers.reduce((acc, tx) => acc + tx.amount, 0)
  const uniqueSenders = new Set(transfers.map(tx => tx.sender)).size
  const transactionCount = transfers.length
  const activityScore = Math.round((totalVolume * 0.4 + uniqueSenders * 0.6) / 100)

  const anomalyFlags = detectSuspiciousPatterns(transfers)

  return {
    totalVolume,
    uniqueSenders,
    transactionCount,
    activityScore,
    anomalyFlags,
  }
}

export async function analyzeTokenBehavior(tokenAddress: string): Promise<TokenMetrics> {
  const transfers = await fetchTokenTransfers(tokenAddress)
  return calculateTokenMetrics(transfers)
}