import { fetchTokenSnapshots, logTokenEvent, notifyRisk } from "./utils"
import type { TokenSnapshot } from "./types"

const SPIKE_THRESHOLD = 2.75
const BASE_VOLUME = 5000
const SCAN_INTERVAL = 45000 // 45 seconds

let lastSnapshot: Record<string, TokenSnapshot> = {}

function computeSpikeRatio(current: number, previous: number): number {
  if (previous === 0) return 0
  return parseFloat((current / previous).toFixed(2))
}

function evaluateTokenTrend(ratio: number, volume: number): string {
  if (ratio >= SPIKE_THRESHOLD && volume > BASE_VOLUME) return "🔥 Spike Detected"
  if (ratio >= 1.5) return "⚠️ Growing Activity"
  return "🟢 Stable"
}

async function trackTokenBehavior() {
  const tokens = await fetchTokenSnapshots()
  for (const token of tokens) {
    const prev = lastSnapshot[token.address]
    if (!prev) continue

    const ratio = computeSpikeRatio(token.volume24h, prev.volume24h)
    const trend = evaluateTokenTrend(ratio, token.volume24h)

    const msg = `[TokenMonitor] ${token.symbol}: $${token.volume24h} (x${ratio}) → ${trend}`
    logTokenEvent(msg)

    if (trend === "🔥 Spike Detected") {
      notifyRisk({
        type: "token-activity",
        severity: "critical",
        token: token.address,
        message: msg,
        timestamp: new Date().toISOString()
      })
    }
  }

  lastSnapshot = Object.fromEntries(tokens.map(t => [t.address, t]))
}

// Poll every SCAN_INTERVAL ms
setInterval(() => {
  trackTokenBehavior().catch(console.error)
}, SCAN_INTERVAL)

trackTokenBehavior()