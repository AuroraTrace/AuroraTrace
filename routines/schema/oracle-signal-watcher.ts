import { fetchOracleSignals, logOracleEvent, sendOracleAlert } from "./utils"
import type { OracleSignal } from "./types"

const SIGNAL_THRESHOLD = 0.82
const MIN_CONFIDENCE = 0.6
const SCAN_INTERVAL = 30000 // every 30 seconds

async function watchOracleSignals() {
  const signals: OracleSignal[] = await fetchOracleSignals()

  for (const signal of signals) {
    if (signal.strength < SIGNAL_THRESHOLD || signal.confidence < MIN_CONFIDENCE) continue

    const message = \`[OracleWatcher] ${signal.token} — Signal: ${signal.label} | Strength: ${signal.strength} | Confidence: ${signal.confidence}\`
    logOracleEvent(message)

    sendOracleAlert({
      type: "oracle-signal",
      importance: "medium",
      token: signal.token,
      label: signal.label,
      strength: signal.strength,
      confidence: signal.confidence,
      timestamp: new Date().toISOString(),
    })
  }
}

// Start polling loop
setInterval(() => {
  watchOracleSignals().catch(console.error)
}, SCAN_INTERVAL)

watchOracleSignals()