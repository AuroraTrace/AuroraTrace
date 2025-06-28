
import { z } from "zod"
import {
  SOLANA_ALL_BALANCES_NAME,
  SOLANA_BALANCE_NAME,
  SOLANA_GET_TOKEN_ADDRESS_NAME,
  SOLANA_GET_WALLET_ADDRESS_NAME,
  SOLANA_TRANSFER_NAME
} from "@/ai/action-names"
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js"

// Base action type
export interface VaultActionResponse<T> {
  notice: string
  data?: T
}

export interface VaultActionCore<S extends z.ZodTypeAny, R, Ctx> {
  id: string
  summary: string
  input: S
  execute: (args: { payload: z.infer<S>; context: Ctx }) => Promise<VaultActionResponse<R>>
}

type VaultAction = VaultActionCore<any, any, { connection: Connection; walletPubkey: PublicKey }>

// 1. Get wallet address (no input, returns pubkey string)
export const getWalletAddressAction: VaultActionCore<
  z.ZodObject<{}>,
  { walletAddress: string },
  { connection: Connection; walletPubkey: PublicKey }
> = {
  id: SOLANA_GET_WALLET_ADDRESS_NAME,
  summary: "Retrieve the user's current wallet public key",
  input: z.object({}),
  execute: async ({ context }) => {
    return {
      notice: "Wallet address retrieved",
      data: { walletAddress: context.walletPubkey.toBase58() }
    }
  }
}

// 2. Get specific token balance
export const getBalanceAction: VaultActionCore<
  z.ZodObject<{ mintAddress: z.ZodString }>,
  { balance: number },
  { connection: Connection; walletPubkey: PublicKey }
> = {
  id: SOLANA_BALANCE_NAME,
  summary: "Fetch SPL token or SOL balance for a given mint address",
  input: z.object({ mintAddress: z.string() }),
  execute: async ({ payload, context }) => {
    const { mintAddress } = payload
    if (mintAddress === "SOL") {
      const lamports = await context.connection.getBalance(context.walletPubkey)
      return { notice: "SOL balance fetched", data: { balance: lamports / LAMPORTS_PER_SOL } }
    }
    const tokenPubkey = new PublicKey(mintAddress)
    const accountInfo = await context.connection.getTokenAccountsByOwner(context.walletPubkey, { mint: tokenPubkey })
    const balance = accountInfo.value.reduce((sum, acc) => sum + Number((acc.account.data as any).parsed.info.tokenAmount.uiAmount), 0)
    return { notice: "Token balance fetched", data: { balance } }
  }
}

// 3. Get all token balances
export const getAllBalancesAction: VaultActionCore<
  z.ZodObject<{}>,
  { balances: Record<string, number> },
  { connection: Connection; walletPubkey: PublicKey }
> = {
  id: SOLANA_ALL_BALANCES_NAME,
  summary: "Fetch balances for SOL and all SPL tokens in the wallet",
  input: z.object({}),
  execute: async ({ context }) => {
    const solLamports = await context.connection.getBalance(context.walletPubkey)
    const balances: Record<string, number> = { SOL: solLamports / LAMPORTS_PER_SOL }
    const tokenAccounts = await context.connection.getParsedTokenAccountsByOwner(context.walletPubkey, { programId: SystemProgram.programId })
    tokenAccounts.value.forEach(acc => {
      const info = (acc.account.data as any).parsed.info
      balances[info.mint] = info.tokenAmount.uiAmount
    })
    return { notice: "All balances fetched", data: { balances } }
  }
}

// 4. Get SPL token mint address by symbol lookup (mocked map)
const TOKEN_LIST: Record<string, string> = {
  USDC: "Es9vMFrzaC1...",
  RAY: "4k3Dyjzvzp8..."
}

export const getTokenAddressAction: VaultActionCore<
  z.ZodObject<{ symbol: z.ZodString }>,
  { mintAddress: string },
  { connection: Connection; walletPubkey: PublicKey }
> = {
  id: SOLANA_GET_TOKEN_ADDRESS_NAME,
  summary: "Lookup SPL token mint address by symbol",
  input: z.object({ symbol: z.string() }),
  execute: async ({ payload }) => {
    const mint = TOKEN_LIST[payload.symbol.toUpperCase()]
    if (!mint) throw new Error(`Unknown token symbol: ${payload.symbol}`)
    return { notice: `Mint address for ${payload.symbol}`, data: { mintAddress: mint } }
  }
}

// 5. Transfer SOL or SPL token
export const transferAction: VaultActionCore<
  z.ZodObject<{
    recipient: z.ZodString
    amount: z.ZodNumber
    mintAddress: z.ZodString
  }>,
  { txSignature: string },
  { connection: Connection; walletPubkey: PublicKey }
> = {
  id: SOLANA_TRANSFER_NAME,
  summary: "Transfer SOL or SPL tokens to a recipient",
  input: z.object({
    recipient: z.string(),
    amount: z.number().positive(),
    mintAddress: z.string()
  }),
  execute: async ({ payload, context }) => {
    const recipientPubkey = new PublicKey(payload.recipient)
    let tx = new Transaction()
    if (payload.mintAddress === "SOL") {
      tx.add(SystemProgram.trans
