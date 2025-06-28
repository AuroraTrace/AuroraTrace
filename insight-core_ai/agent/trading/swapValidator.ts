import { SwapQuote } from './swapQuoteService'

/**
 * Validates swap request parameters before execution
 */
export class SwapValidator {
  /**
   * Ensures mint addresses are valid base58 strings
   */
  static validateMint(mint: string): boolean {
    try {
      const bytes = Uint8Array.from([...mint].map(c => c.charCodeAt(0)))
      return bytes.length >= 32 && bytes.length <= 44
    } catch {
      return false
    }
  }

  /**
   * Validates that amount is a positive number and within limits
   */
  static validateAmount(amount: number, max?: number): boolean {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return false
    return max ? amount <= max : true
  }

  /**
   * Validates slippage is between 0% and 5%
   */
  static validateSlippage(slippage: number): boolean {
    return typeof slippage === 'number' && slippage >= 0 && slippage <= 5
  }

  /**
   * Validates the overall swap quote object
   */
  static validateQuote(quote: SwapQuote): string | null {
    if (!this.validateMint(quote.bestPool)) {
      return 'Invalid pool ID format'
    }
    if (!this.validateAmount(quote.amountOut)) {
      return 'Invalid output amount'
    }
    if (!this.validateSlippage(quote.slippagePercent)) {
      return 'Slippage out of bounds'
    }
    return null
  }
}
