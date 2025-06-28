import axios from "axios"

export interface TokenInsight {
  tokenAddress: string
  symbol: string
  totalSupply: number
  holdersCount: number
  dexPairsCount: number
  recentVolume: number
  flaggedHolders: number
}

export interface TokenRiskReport {
  token: string
  score: number
  riskLevel: "Low" | "Moderate" | "High"
  flags: string[]
}

export async function fetchTokenInsight(tokenAddress: string): Promise<TokenInsight> {
  const url = `https://api.dexscreener.com/latest/dex/pairs/solana/${tokenAddress}`

  const response = await axios.get(url)
  const data = response.data.pairs?.[0] || {}

  return {
    tokenAddress,
    symbol: data.baseToken?.symbol || "UNKNOWN",
    totalSupply: Number(data.baseToken?.totalSupply) || 0,
    holdersCount: Number(data.baseToken?.holders) || 0,
    dexPairsCount: 1,
    recentVolume: Number(data.volume?.h24 || 0),
    flaggedHolders: 0,
  }
}

export function assessTokenRisk(insight: TokenInsight): TokenRiskReport {
  const flags: string[] = []

  if (insight.holdersCount < 50) flags.push("LowHolderCount")
  if (insight.recentVolume < 100) flags.push("LowVolume")
  if (insight.totalSupply > 1_000_000_000_000) flags.push("SuspiciousSupply")

  const score = 
    (insight.recentVolume > 1000 ? 30 : 10) +
    (insight.holdersCount > 100 ? 30 : 10) -
    (flags.length * 10)

  let riskLevel: "Low" | "Moderate" | "High" = "Moderate"
  if (score >= 60) riskLevel = "Low"
  else if (score < 30) riskLevel = "High"

  return {
    token: insight.symbol,
    score,
    riskLevel,
    flags,
  }
}

export async function analyzeToken(tokenAddress: string): Promise<TokenRiskReport> {
  const insight = await fetchTokenInsight(tokenAddress)
  return assessTokenRisk(insight)
}