interface TimePoint {
  timestamp: number      // Unix epoch ms
  volume: number         // base units
  price: number          // token price in USD
  liquidity: number      // base units
}

export interface FeatureVector {
  timestamp: number
  movingAverages: {
    short: number
    medium: number
    long: number
  }
  momentum: number
  volatility: number
  liquidityRatio: number
}

/**
 * SlidingWindow helper for incremental computation
 */
class SlidingWindow {
  private window: number[] = []
  private size: number
  private sum: number = 0

  constructor(size: number) {
    this.size = size
  }

  add(value: number): void {
    this.window.push(value)
    this.sum += value
    if (this.window.length > this.size) {
      const removed = this.window.shift()!
      this.sum -= removed
    }
  }

  average(): number {
    return this.window.length ? this.sum / this.window.length : 0
  }
}

/**
 * FeatureExtractor provides methods to extract time-based features
 */
export class FeatureExtractor {
  static computeFeatures(data: TimePoint[], timestampsToCompute: number[]): FeatureVector[] {
    // Windows: 5, 15, 60 minutes (in data points, assuming uniform sampling)
    const wShort = new SlidingWindow(5)
    const wMedium = new SlidingWindow(15)
    const wLong = new SlidingWindow(60)

    const vectors: FeatureVector[] = []
    let prevPrice: number | null = null

    for (const point of data) {
      wShort.add(point.price)
      wMedium.add(point.price)
      wLong.add(point.price)

      const maShort = wShort.average()
      const maMedium = wMedium.average()
      const maLong = wLong.average()

      const momentum = prevPrice !== null ? (point.price - prevPrice) / prevPrice : 0
      const volWindow = data
        .filter(p => p.timestamp >= point.timestamp - 3600000) // last hour
        .map(p => p.price)
      const mean = volWindow.reduce((a, b) => a + b, 0) / (volWindow.length || 1)
      const variance = volWindow
        .reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (volWindow.length || 1)
      const volatility = Math.sqrt(variance)

      const liquidityRatio = point.liquidity > 0
        ? point.volume / point.liquidity
        : 0

      if (timestampsToCompute.includes(point.timestamp)) {
        vectors.push({
          timestamp: point.timestamp,
          movingAverages: { short: maShort, medium: maMedium, long: maLong },
          momentum,
          volatility,
          liquidityRatio
        })
      }

      prevPrice = point.price
    }

    return vectors
  }
}
