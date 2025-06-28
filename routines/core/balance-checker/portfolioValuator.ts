import { Wallet } from "@coinbase/coinbase-sdk"

interface TokenHolding {
  mint: string
  amount: number
}

interface PortfolioValueResult {
  totalUSD: number
  breakdown: Array<{
    mint: string
    amount: number
    priceUSD: number
    valueUSD: number
  }>
}

export class PortfolioValuator {
  constructor(private priceOracleUrl: string) {}

  async fetchTokenPrice(mint: string): Promise<number> {
    const resp = await fetch(\`\${this.priceOracleUrl}/price/\${mint}\`)
    if (!resp.ok) throw new Error("Failed to fetch price for " + mint)
    const data = await resp.json()
    return data.usd || 0
  }

  async evaluate(wallet: Wallet, tokenMints: string[]): Promise<PortfolioValueResult> {
    const address = await wallet.getDefaultAddress()
    const holdings: TokenHolding[] = []

    for (const mint of tokenMints) {
      const balance = await address.getBalance(mint)
      holdings.push({ mint, amount: balance })
    }

    const breakdown = await Promise.all(
      holdings.map(async (t) => {
        const price = await this.fetchTokenPrice(t.mint)
        return {
          mint: t.mint,
          amount: t.amount,
          priceUSD: price,
          valueUSD: price * t.amount
        }
      })
    )

    const totalUSD = breakdown.reduce((acc, entry) => acc + entry.valueUSD, 0)

    return {
      totalUSD,
      breakdown
    }
  }
}
