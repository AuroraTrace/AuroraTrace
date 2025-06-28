export interface DexScreenerPairData {
  pairAddress: string
  baseToken: {
    name: string
    symbol: string
    address: string
  }
  quoteToken: {
    name: string
    symbol: string
    address: string
  }
  priceUsd: string
  liquidity: {
    usd: number
  }
  volume: {
    h24: number
    h6: number
    h1: number
  }
  txCount: {
    h24: number
    h6: number
    h1: number
  }
  createdAt: number
}

export async function getDexScreenerTokenData(
  tokenAddress: string
): Promise<DexScreenerPairData | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${tokenAddress}`)

    if (!response.ok) {
      console.error("DexScreener API error:", response.status)
      return null
    }

    const json = await response.json()

    if (!json.pair) {
      console.warn("No data for token:", tokenAddress)
      return null
    }

    return json.pair as DexScreenerPairData
  } catch (error) {
    console.error("Failed to fetch from DexScreener:", error)
    return null
  }
}
