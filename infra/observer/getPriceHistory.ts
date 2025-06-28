import { queryBirdeye } from "./base"
import { ChainType } from "@/app/_contexts/chain-context"

export interface PriceHistoryItem {
  unixTime: number
  value: number
}

/**
 * Fetches token price history for Solana using Birdeye API
 * @param address SPL token mint address
 * @param numDays Number of past days to fetch (1–30)
 */
export const getTokenPriceHistory = async (
  address: string,
  numDays: number = 1,
  chain: ChainType = "solana"
): Promise<PriceHistoryItem[]> => {
  const now = Math.floor(Date.now() / 1000)

  if (chain !== "solana") {
    throw new Error("Only Solana is supported in this implementation")
  }

  if (!address || address.length < 32) {
    throw new Error("Invalid SPL token address")
  }

  const clampedDays = Math.max(1, Math.min(numDays, 30))
  const timeFrom = now - clampedDays * 86400

  return queryBirdeye<PriceHistoryItem[]>(
    "defi/price_history",
    {
      address,
      type: "time",
      time_from: timeFrom.toString(),
      time_to: now.toString()
    },
    "solana"
  )
}
