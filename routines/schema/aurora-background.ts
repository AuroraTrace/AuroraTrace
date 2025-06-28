import { initAuraScanner } from "./auraScanner"
import { monitorTokenSurges } from "./tokenSurgeMonitor"
import { watchOracleSignals } from "./oracleSignalWatcher"
import { traceWalletEchoes } from "./walletEchoTracker"
import { loadConfig, logStartup } from "./core/utils"
import { schedule } from "./core/scheduler"

async function bootstrap() {
  const config = loadConfig("auroraLog.json")
  logStartup("AuroraTrace Background System Booting Up")

  // Set up scheduled background modules
  schedule("🌌 Aura Scanner", () => initAuraScanner(config), 30000)
  schedule("🚀 Token Surge Monitor", monitorTokenSurges, 20000)
  schedule("🔮 Oracle Signal Watcher", watchOracleSignals, 45000)
  schedule("🌐 Wallet Echo Tracker", traceWalletEchoes, 60000)

  console.log("✅ AuroraTrace background modules successfully launched.")
}

bootstrap().catch((err) => {
  console.error("🔥 AuroraTrace Background System Failed to Start", err)
})