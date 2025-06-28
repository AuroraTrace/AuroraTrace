import { Connection, PublicKey } from "@solana/web3.js"

interface NewTokenAccount {
  address: string
  owner: string
  createdAt: number
}

export async function scanNewTokenAccounts(
  connection: Connection,
  fromSlot: number,
  limit: number = 100
): Promise<NewTokenAccount[]> {
  const programId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") // SPL Token Program
  const confirmedBlocks = await connection.getBlocks(fromSlot, fromSlot + limit)

  const accounts: NewTokenAccount[] = []

  for (const block of confirmedBlocks) {
    const blockData = await connection.getBlock(block, { maxSupportedTransactionVersion: 0 })
    if (!blockData || !blockData.transactions) continue

    for (const tx of blockData.transactions) {
      for (const ix of tx.transaction.message.instructions) {
        if ("programId" in ix && ix.programId.equals(programId)) {
          const parsed = (ix as any).parsed
          if (parsed?.type === "initializeAccount") {
            accounts.push({
              address: parsed.info.account,
              owner: parsed.info.owner,
              createdAt: blockData.blockTime ? blockData.blockTime * 1000 : Date.now()
            })
          }
        }
      }
    }
  }

  return accounts
}
