import fetch from 'node-fetch'

/**
 * Represents a single order in the order book
 */
interface Order {
  price: number
  size: number
}

/**
 * Order book snapshot structure
 */
interface OrderBook {
  bids: Order[]
  asks: Order[]
  timestamp: number
}

/**
 * Order Book Analytics Utilities
 */
export class OrderBookAnalyzer {
  private apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  /**
   * Fetches the current order book for a market
   */
  async fetchOrderBook(marketSymbol: string, depth: number = 50): Promise<OrderBook> {
    const resp = await fetch(\`\${this.apiUrl}/markets/\${marketSymbol}/orderbook?depth=\${depth}\`)
    if (!resp.ok) throw new Error(\`Order book fetch error: \${resp.statusText}\`)
    const data = (await resp.json()) as OrderBook
    return data
  }

  /**
   * Calculates the mid-price from the top of book
   */
  calculateMidPrice(book: OrderBook): number {
    const topBid = book.bids[0]?.price || 0
    const topAsk = book.asks[0]?.price || 0
    return (topBid + topAsk) / 2
  }

  /**
   * Computes spread percentage between bid and ask
   */
  calculateSpreadPercent(book: OrderBook): number {
    const mid = this.calculateMidPrice(book)
    const topBid = book.bids[0]?.price || 0
    const topAsk = book.asks[0]?.price || 0
    return mid > 0 ? ((topAsk - topBid) / mid) * 100 : 0
  }

  /**
   * Computes liquidity imbalance: (bidVolume - askVolume) / (totalVolume)
   */
  calculateImbalance(book: OrderBook): number {
    const bidVolume = book.bids.reduce((sum, o) => sum + o.size, 0)
    const askVolume = book.asks.reduce((sum, o) => sum + o.size, 0)
    const total = bidVolume + askVolume
    return total > 0 ? (bidVolume - askVolume) / total : 0
  }

  /**
   * Returns a summary of order book metrics
   */
  summarize(book: OrderBook): Record<string, number> {
    return {
      midPrice: this.calculateMidPrice(book),
      spreadPercent: this.calculateSpreadPercent(book),
      imbalance: this.calculateImbalance(book),
      timestamp: book.timestamp
    }
  }
}
