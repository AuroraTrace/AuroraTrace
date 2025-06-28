import { fetchRecentDexTrades, groupByTokenCluster, notifyAlert, logEvent } from "./utils"
import type { DexTrade } from "./types"

const TRADE_WINDOW_MS = 60000
const MIN_TRADE_CLUSTER = 3
const PRICE_FLUCTUATION_LIMIT = 0.12

interface TradeCluster {
  token: string
  txHashes: string[]
  avgPrice: number
  totalVolume: number
}

function priceFluctuationRatio(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(a, b)
}

async function detectLiquidityManipulation(): Promise<void> {
  const trades: DexTrade[] = await fetchRecentDexTrades(TRADE_WINDOW_MS)

  const grouped = groupByTokenCluster(trades)
  const clusters: TradeCluster[] = []

  for (const [token, tradeGroup] of Object.entries(grouped)) {
    if (tradeGroup.length < MIN_TRADE_CLUSTER) continue

    const totalVolume = tradeGroup.reduce((sum, t) => sum + t.volumeUSD, 0)
    const avgPrice = tradeGroup.reduce((sum, t) => sum + t.priceUSD, 0) / tradeGroup.length

    const consistentPrices = tradeGroup.every(t =>
      priceFluctuationRatio(t.priceUSD, avgPrice) < PRICE_FLUCTUATION_LIMIT
    )

    if (!consistentPrices && totalVolume > 10000) {
      clusters.push({
        token,
        txHashes: tradeGroup.map(t => t.txHash),
        avgPrice,
        totalVolume
      })
    }
  }

  for (const cluster of clusters) {
    const msg = `[LiquidityWatch] Unusual Pattern: ${cluster.token} — ${cluster.txHashes.length} trades, ~$${cluster.totalVolume.toFixed(2)} volume`
    logEvent(msg)
    notifyAlert({
      type: "liquidity-manipulation",
      severity: "high",
      message: msg,
      context: cluster
    })
  }
}

setInterval(() => {
  detectLiquidityManipulation().catch(console.error)
}, 60000)

detectLiquidityManipulation()