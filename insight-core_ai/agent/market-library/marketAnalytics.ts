import fetch from 'node-fetch'

/**
 * Represents a single trade tick
 */
interface TradeTick {
  timestamp: number
  price: number
  size: number
  side: 'buy' | 'sell'
}

/**
 * Market analytics utilities
 */
export class MarketAnalytics {
  private apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  /**
   * Fetches recent trade ticks for a given market
   */
  async fetchTradeHistory(marketSymbol: string, limit: number = 100): Promise<TradeTick[]> {
    const resp = await fetch(`${this.apiUrl}/markets/${marketSymbol}/trades?limit=${limit}`)
    if (!resp.ok) throw new Error(`Trade history fetch error: \${resp.statusText}\`)
    const data = (await resp.json()) as TradeTick[]
    return data
  }

  /**
   * Calculates Volume Weighted Average Price over recent ticks
   */
  calculateVWAP(trades: TradeTick[]): number {
    let cumulativePV = 0
    let cumulativeVolume = 0
    trades.forEach(t => {
      cumulativePV += t.price * t.size
      cumulativeVolume += t.size
    })
    return cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : 0
  }

  /**
   * Computes simple moving average for the last N ticks
   */
  simpleMovingAverage(trades: TradeTick[], windowSize: number): number {
    const recent = trades.slice(-windowSize)
    const sum = recent.reduce((acc, t) => acc + t.price, 0)
    return recent.length > 0 ? sum / recent.length : 0
  }

  /**
   * Detects carry arbitrage opportunity between two markets
   */
  async detectArbitrage(marketA: string, marketB: string): Promise<number> {
    const [ticksA, ticksB] = await Promise.all([
      this.fetchTradeHistory(marketA, 50),
      this.fetchTradeHistory(marketB, 50)
    ])
    const vwapA = this.calculateVWAP(ticksA)
    const vwapB = this.calculateVWAP(ticksB)
    return vwapA - vwapB
  }
}
