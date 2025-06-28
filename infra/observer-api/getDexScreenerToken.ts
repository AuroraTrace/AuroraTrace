export interface TrendingToken {
  pairAddress: string
  dexId: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceUsd: string
  liquidity: {
    usd: number
  }
  volume: {
    h24: number
  }
  txCount: {
    h24: number
  }
  chainId: string
}

export async function getTrendingTokens(): Promise<TrendingToken[]> {
  try {
    const res = await fetch("https://api.dexscreener.com/latest/dex")

    if (!res.ok) {
      console.error("DexScreener trending API error:", res.status)
      return []
    }

    const data = await res.json()

    const solanaPairs: TrendingToken[] = data.pairs.filter(
      (pair: any) => pair.chainId === "solana"
    )

    return solanaPairs.slice(0, 10) // Return top 10 trending tokens on Solana
  } catch (error) {
    console.error("Failed to fetch trending tokens:", error)
    return []
  }
}
