import fetch from 'node-fetch'

/**
 * Represents OHLC data for a single time interval
 */
interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

/**
 * Named candlestick patterns
 */
export type CandlestickPattern =
  | 'Hammer'
  | 'ShootingStar'
  | 'BullishEngulfing'
  | 'BearishEngulfing'
  | 'Doji'

/**
 * Result of a pattern detection at a given candle
 */
export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number  // 0–1 indicating pattern strength
}

/**
 * Utility for fetching candle data and detecting common candlestick patterns
 */
export class CandlestickPatternDetector {
  private apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  /**
   * Fetch OHLC candles for a market symbol
   */
  async fetchCandles(marketSymbol: string, limit: number = 100): Promise<Candle[]> {
    const resp = await fetch(\`\${this.apiUrl}/markets/\${marketSymbol}/candles?limit=\${limit}\`)
    if (!resp.ok) throw new Error(\`Failed to fetch candles: \${resp.statusText}\`)
    const data = (await resp.json()) as Candle[]
    return data
  }

  /**
   * Detect hammer pattern: small body at top with long lower wick
   */
  private isHammer(c: Candle): boolean {
    const body = Math.abs(c.close - c.open)
    const lowerWick = Math.min(c.open, c.close) - c.low
    return lowerWick > body * 2 && body / (c.high - c.low) < 0.3
  }

  /**
   * Detect shooting star: small body at bottom with long upper wick
   */
  private isShootingStar(c: Candle): boolean {
    const body = Math.abs(c.close - c.open)
    const upperWick = c.high - Math.max(c.open, c.close)
    return upperWick > body * 2 && body / (c.high - c.low) < 0.3
  }

  /**
   * Detect bullish engulfing: current bullish body engulfs previous bearish body
   */
  private isBullishEngulfing(prev: Candle, curr: Candle): boolean {
    return (
      curr.close > curr.open &&
      prev.close < prev.open &&
      curr.close > prev.open &&
      curr.open < prev.close
    )
  }

  /**
   * Detect bearish engulfing: current bearish body engulfs previous bullish body
   */
  private isBearishEngulfing(prev: Candle, curr: Candle): boolean {
    return (
      curr.close < curr.open &&
      prev.close > prev.open &&
      curr.open > prev.close &&
      curr.close < prev.open
    )
  }

  /**
   * Detect doji: open and close very close relative to range
   */
  private isDoji(c: Candle): boolean {
    const range = c.high - c.low
    const body = Math.abs(c.close - c.open)
    return range > 0 && body / range < 0.1
  }

  /**
   * Analyze candles and return pattern signals
   */
  async detectPatterns(
    marketSymbol: string,
    limit: number = 100
  ): Promise<PatternSignal[]> {
    const candles = await this.fetchCandles(marketSymbol, limit)
    const signals: PatternSignal[] = []

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      let pattern: CandlestickPattern | null = null

      if (this.isHammer(c)) pattern = 'Hammer'
      else if (this.isShootingStar(c)) pattern = 'ShootingStar'
      else if (i > 0 && this.isBullishEngulfing(candles[i - 1], c)) pattern = 'BullishEngulfing'
      else if (i > 0 && this.isBearishEngulfing(candles[i - 1], c)) pattern = 'BearishEngulfing'
      else if (this.isDoji(c)) pattern = 'Doji'

      if (pattern) {
        signals.push({
          timestamp: c.timestamp,
          pattern,
          confidence: 1 // confidence is binary for now
        })
      }
    }

    return signals
  }
}
