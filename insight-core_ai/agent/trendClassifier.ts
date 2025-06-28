interface MetricPoint {
  timestamp: number    // Unix epoch ms
  value: number        // metric value (e.g., volume, liquidity)
}

export type Trend = 'uptrend' | 'downtrend' | 'stable'

export interface ClassifiedTrend {
  timestamp: number
  trend: Trend
  confidence: number   // 0–1 indicating strength of classification
}

/**
 * Implements single exponential smoothing for a time series
 */
class ExponentialSmoother {
  private alpha: number
  private level: number | null = null

  constructor(alpha: number = 0.3) {
    this.alpha = alpha
  }

  add(value: number): number {
    if (this.level === null) {
      this.level = value
    } else {
      this.level = this.alpha * value + (1 - this.alpha) * this.level
    }
    return this.level
  }

  current(): number {
    return this.level ?? 0
  }
}

/**
 * TrendClassifier applies smoothing and delta thresholds to detect trends
 */
export class TrendClassifier {
  private smoother: ExponentialSmoother
  private upThreshold: number
  private downThreshold: number

  /**
   * @param alpha         smoothing factor (0–1)
   * @param upThreshold   relative increase threshold to call uptrend (e.g., 0.05)
   * @param downThreshold relative decrease threshold to call downtrend (e.g., -0.05)
   */
  constructor(alpha: number = 0.3, upThreshold: number = 0.05, downThreshold: number = -0.05) {
    this.smoother = new ExponentialSmoother(alpha)
    this.upThreshold = upThreshold
    this.downThreshold = downThreshold
  }

  /**
   * Classify a sequence of metric points into trends at each timestamp
   */
  classify(series: MetricPoint[]): ClassifiedTrend[] {
    const results: ClassifiedTrend[] = []
    let prevLevel: number | null = null

    for (const point of series) {
      const smooth = this.smoother.add(point.value)

      if (prevLevel !== null) {
        const delta = (smooth - prevLevel) / (prevLevel || 1)
        let trend: Trend = 'stable'
        let confidence = 0

        if (delta >= this.upThreshold) {
          trend = 'uptrend'
          confidence = Math.min((delta - this.upThreshold) / (1 - this.upThreshold), 1)
        } else if (delta <= this.downThreshold) {
          trend = 'downtrend'
          confidence = Math.min((this.downThreshold - delta) / (Math.abs(this.downThreshold) ), 1)
        }

        results.push({
          timestamp: point.timestamp,
          trend,
          confidence
        })
      }

      prevLevel = smooth
    }

    return results
  }
}
