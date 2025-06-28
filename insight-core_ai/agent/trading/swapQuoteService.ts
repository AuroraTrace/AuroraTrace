import fetch from 'node-fetch'

/**
 * Represents a liquidity pool quote from a DEX aggregator
 */
interface PoolQuote {
  poolId: string
  inputAmount: number
  outputAmount: number
  estimatedFee: number
}

/**
 * Final quote returned to the user
 */
export interface SwapQuote {
  bestPool: string
  amountOut: number
  fee: number
  slippagePercent: number
  timestamp: number
}

/**
 * Service to fetch and compare quotes across multiple liquidity pools
 */
export class SwapQuoteService {
  private apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  /**
   * Fetch raw quotes for given token pair and amount from all available pools
   */
  private async fetchPoolQuotes(
    inputMint: string,
    outputMint: string,
    amountIn: number
  ): Promise<PoolQuote[]> {
    const resp = await fetch(`${this.apiUrl}/quotes?in=${inputMint}&out=${outputMint}&amt=${amountIn}`)
    if (!resp.ok) throw new Error(`Quote API error: ${resp.statusText}`)
    const data = (await resp.json()) as PoolQuote[]
    return data
  }

  /**
   * Selects the pool that maximizes output after fee deduction
   */
  private selectBestQuote(quotes: PoolQuote[]): PoolQuote {
    return quotes.reduce((best, current) => {
      const netBest = best.outputAmount - best.estimatedFee
      const netCurr = current.outputAmount - current.estimatedFee
      return netCurr > netBest ? current : best
    })
  }

  /**
   * Computes slippage percentage based on mid-market price
   */
  private computeSlippage(
    amountIn: number,
    amountOut: number,
    midPrice: number
  ): number {
    const expectedOut = amountIn * midPrice
    return ((expectedOut - amountOut) / expectedOut) * 100
  }

  /**
   * Public method to get the best swap quote with slippage estimate
   */
  async getBestSwapQuote(
    inputMint: string,
    outputMint: string,
    amountIn: number,
    midPrice: number
  ): Promise<SwapQuote> {
    const quotes = await this.fetchPoolQuotes(inputMint, outputMint, amountIn)
    if (quotes.length === 0) throw new Error('No liquidity pools available for this pair')

    const best = this.selectBestQuote(quotes)
    const netOut = best.outputAmount - best.estimatedFee
    const slippage = this.computeSlippage(amountIn, netOut, midPrice)

    return {
      bestPool: best.poolId,
      amountOut: netOut,
      fee: best.estimatedFee,
      slippagePercent: Math.max(slippage, 0),
      timestamp: Date.now()
    }
  }
}
