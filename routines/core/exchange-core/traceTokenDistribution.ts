import { Connection, PublicKey } from "@solana/web3.js"

interface HolderInfo {
  wallet: string
  amount: number
}

interface DistributionSummary {
  topHolders: HolderInfo[]
  totalHolders: number
  top10Share: number
  concentrationLevel: string
}

export async function traceTokenDistribution(
  connection: Connection,
  mintAddress: string,
  limit: number = 50
): Promise<DistributionSummary> {
  const mintPubkey = new PublicKey(mintAddress)
  const tokenAccounts = await connection.getParsedTokenAccountsByMint(mintPubkey)

  const holders: HolderInfo[] = tokenAccounts.value
    .map((accountInfo) => {
      const parsed = accountInfo.account.data.parsed.info
      return {
        wallet: parsed.owner,
        amount: Number(parsed.tokenAmount.uiAmount)
      }
    })
    .filter((h) => h.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const topHolders = holders.slice(0, limit)
  const total = holders.reduce((sum, h) => sum + h.amount, 0)
  const top10 = topHolders.slice(0, 10).reduce((sum, h) => sum + h.amount, 0)
  const share = total > 0 ? (top10 / total) * 100 : 0

  let concentrationLevel = "Low"
  if (share > 80) concentrationLevel = "High"
  else if (share > 50) concentrationLevel = "Moderate"

  return {
    topHolders,
    totalHolders: holders.length,
    top10Share: parseFloat(share.toFixed(2)),
    concentrationLevel
  }
}
