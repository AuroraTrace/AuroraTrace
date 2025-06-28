export interface DexScreenerTokenPair {
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
  volume: {
    h24: number
  }
  liquidity: {
    usd: number
  }
  txCount: {
    h24: number
  }
  chainId: string
}

export interface DexScreenerPairsResponse {
  pairs: DexScreenerTokenPair[]
}

export async function getDexScreenerTokenPairs(
  tokenSymbolOrAddress: string
): Promise<DexScreenerTokenPair[] | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${tokenSymbolOrAddress}`)

    if (!res.ok) {
      console.error("DexScreener search API error:", res.status)
      return null
    }

    const data: DexScreenerPairsResponse = await res.json()

    const solanaPairs = data.pairs.filter(pair => pair.chainId === "solana")

    return solanaPairs
  } catch (error) {
    console.error("Error fetching DexScreener token pairs:", error)
    return null
  }
}
