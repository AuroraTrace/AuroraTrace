// correlationAnalysis.ts

import { AuroraTraceEngine } from './auroraPatternEngine'

/**
 * Represents a pairwise correlation result between two series
 */
export interface CorrelationResult {
  pair: [string, string]
  coefficient: number    // Pearson correlation coefficient between –1 and 1
}

/**
 * Utility for computing Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0 || y.length !== n) return 0
  const meanX = x.reduce((sum, v) => sum + v, 0) / n
  const meanY = y.reduce((sum, v) => sum + v, 0) / n

  let num = 0, denomX = 0, denomY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }
  const denom = Math.sqrt(denomX * denomY)
  return denom === 0 ? 0 : num / denom
}

/**
 * Computes pairwise correlations among on-chain metrics
 */
export class CorrelationAnalyzer {
  private engine: AuroraTraceEngine

  constructor(apiUrl: string, apiKey: string) {
    this.engine = new AuroraTraceEngine(apiUrl, apiKey)
  }

  /**
   * Fetches metrics and returns correlations between volume, liquidity, and active addresses
   */
  async analyze(
    contractAddress: string,
    periodHours: number
  ): Promise<CorrelationResult[]> {
    const metrics = await this.engine.fetchMetrics(contractAddress, periodHours)

    const volumes = metrics.map(m => m.volume)
    const liquidities = metrics.map(m => m.liquidity)
    const actives = metrics.map(m => m.activeAddresses)

    const results: CorrelationResult[] = [
      {
        pair: ['volume', 'liquidity'],
        coefficient: pearsonCorrelation(volumes, liquidities)
      },
      {
        pair: ['volume', 'activeAddresses'],
        coefficient: pearsonCorrelation(volumes, actives)
      },
      {
        pair: ['liquidity', 'activeAddresses'],
        coefficient: pearsonCorrelation(liquidities, actives)
      }
    ]

    return results
  }
}
