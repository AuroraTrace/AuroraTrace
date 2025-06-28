import { Connection, PublicKey } from "@solana/web3.js"

interface SybilCluster {
  source: string
  recipients: string[]
  token: string
  totalDistributed: number
  clusterScore: number // 0–100
}

export async function detectSybilClusters(
  connection: Connection,
  mintAddress: string,
  lookbackSlots: number = 200
): Promise<SybilCluster[]> {
  const mint = new PublicKey(mintAddress)
  const programId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
  const clusters: Map<string, Set<string>> = new Map()
  const totals: Map<string, number> = new Map()

  const latestSlot = await connection.getSlot()
  const slotsToScan = Array.from({ length: lookbackSlots }, (_, i) => latestSlot - i)

  for (const slot of slotsToScan) {
    const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 }).catch(() => null)
    if (!block || !block.transactions) continue

    for (const tx of block.transactions) {
      for (const ix of tx.transaction.message.instructions) {
        if ("parsed" in ix && ix.programId.equals(programId) && ix.parsed?.type === "transfer") {
          const parsed = ix.parsed.info
          if (!parsed || parsed.mint !== mint.toBase58()) continue

          const sender = parsed.source
          const recipient = parsed.destination
          const amount = Number(parsed.amount)

          if (!clusters.has(sender)) clusters.set(sender, new Set())
          clusters.get(sender)?.add(recipient)

          const key = `${sender}:${mint.toBase58()}`
          totals.set(key, (totals.get(key) || 0) + amount)
        }
      }
    }
  }

  const result: SybilCluster[] = []

  for (const [sender, recipients] of clusters.entries()) {
    if (recipients.size >= 4) {
      const token = mint.toBase58()
      const total = totals.get(`${sender}:${token}`) || 0
      const score = Math.min(100, recipients.size * 20 + (total > 1000 ? 10 : 0))

      result.push({
        source: sender,
        recipients: Array.from(recipients),
        token,
        totalDistributed: total,
        clusterScore: score
      })
    }
  }

  return result
}
