import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

/**
 * Extended liquidity toolkit with both fetch and analysis capabilities
 */
export const EXTENDED_LIQUIDITY_TOOLS = {
  [\`liquidityscan-\${FETCH_POOL_DATA_KEY}\`]: toolkitBuilder(new FetchPoolDataAction()),
  [\`poolhealth-\${ANALYZE_POOL_HEALTH_KEY}\`]: toolkitBuilder(new AnalyzePoolHealthAction()),
}
