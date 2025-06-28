import { Connection, PublicKey } from "@solana/web3.js"

interface PressureSignal {
  mint: string
  timeframeHours: number
  netFlow: number // positive = inflow, negative = outflow
  inflowAddresses: string[]
  outflowAddresses: string[]
  severity: "low" | "moderate" | "high"
}

export async function detectTokenPressure(
  connection: Connection,
  mintAddress: string,
  timeframeHours: number = 2,
  threshold: number = 10000
): Promise<PressureSignal> {
  const mint = new PublicKey(mintAddress)
  const now = Math.floor(Date.now() / 1000)
  const since = now - timeframeHours * 3600

  const tokenAccounts = await connection.getParsedTokenAccountsByMint(mint)
  const inflowAddresses: string[] = []
  const outflowAddresses: string[] = []
  let netFlow = 0

  for (const account of tokenAccounts.value) {
    const owner = account.account.data.parsed.info.owner
    const tokenPubkey = new PublicKey(account.pubkey)
    const txs = await connection.getSignaturesForAddress(tokenPubkey, {
      limit: 10
    })

    for (const tx of txs) {
      if (!tx.blockTime || tx.blockTime < since) continue
      const sign = tx.confirmationStatus === "confirmed" ? 1 : 0
      if (sign === 0) continue

      const slotTx = await connection.getParsedTransaction(tx.signature)
      if (!slotTx) continue

      for (const ix of slotTx.transaction.message.instructions) {
        if ("parsed" in ix && ix.program === "spl-token") {
          const parsed = ix.parsed
          if (parsed?.type === "transfer") {
            const amount = Number(parsed.info.amount)
            if (parsed.info.destination === account.pubkey.toString()) {
              netFlow += amount
              inflowAddresses.push(owner)
            } else if (parsed.info.source === account.pubkey.toString()) {
              netFlow -= amount
              outflowAddresses.push(owner)
            }
          }
        }
      }
    }
  }

  let severity: "low" | "moderate" | "high" = "low"
  if (Math.abs(netFlow) > threshold * 10) severity = "high"
  else if (Math.abs(netFlow) > threshold) severity = "moderate"

  return {
    mint: mintAddress,
    timeframeHours,
    netFlow,
    inflowAddresses: Array.from(new Set(inflowAddresses)),
    outflowAddresses: Array.from(new Set(outflowAddresses)),
    severity
  }
}
