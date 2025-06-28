import { PublicKey, Connection } from "@solana/web3.js"

export async function fetchRecentTransactions(
  connection: Connection,
  address: string,
  limit: number = 50
): Promise<string[]> {
  const pubkey = new PublicKey(address)
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit })
  return signatures.map(sig => sig.signature)
}

export async function detectMintSpikes(
  connection: Connection,
  mintAddress: string,
  threshold: number
): Promise<boolean> {
  const pubkey = new PublicKey(mintAddress)
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 100 })
  let mintCount = 0

  for (const sigInfo of signatures) {
    const tx = await connection.getParsedTransaction(sigInfo.signature)
    if (!tx) continue

    const instructions = tx.transaction.message.instructions
    for (const ix of instructions) {
      if ("parsed" in ix && ix.program === "spl-token" && ix.parsed?.type === "mintTo") {
        mintCount += 1
      }
    }
  }

  return mintCount >= threshold
}

export async function analyzeTransferPattern(
  connection: Connection,
  tokenAccount: string,
  maxGapMs: number
): Promise<boolean> {
  const pubkey = new PublicKey(tokenAccount)
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 40 })
  const timestamps = signatures.map(sig => sig.blockTime).filter(Boolean) as number[]
  const gaps = []

  for (let i = 1; i < timestamps.length; i++) {
    const gap = (timestamps[i - 1] - timestamps[i]) * 1000
    gaps.push(gap)
  }

  const rapidTransfers = gaps.filter(g => g <= maxGapMs).length
  return rapidTransfers >= 5
}

export function estimateActivityScore(params: {
  transfers24h: number
  mints: number
  uniqueWallets: number
}): number {
  const { transfers24h, mints, uniqueWallets } = params
  return Math.min(
    100,
    (transfers24h * 0.4) + (mints * 0.3) + (uniqueWallets * 0.3)
  )
}
