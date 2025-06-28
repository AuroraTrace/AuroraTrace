// sanitize-transfer-payload.ts

export interface RawTransferPayload {
  sender?: string
  recipient?: string
  amount?: string | number
  tokenSymbol?: string
  memo?: string | null
  network?: string
}

export interface CleanTransferPayload {
  sender: string
  recipient: string
  amount: number
  tokenSymbol: string
  memo?: string
  network: string
}

export function sanitizeTransferPayload(raw: RawTransferPayload): CleanTransferPayload {
  return {
    sender: (raw.sender || "").trim(),
    recipient: (raw.recipient || "").trim(),
    amount: typeof raw.amount === "string" ? parseFloat(raw.amount) : raw.amount || 0,
    tokenSymbol: (raw.tokenSymbol || "").toUpperCase(),
    memo: raw.memo?.trim(),
    network: (raw.network || "solana").toLowerCase(),
  }
}