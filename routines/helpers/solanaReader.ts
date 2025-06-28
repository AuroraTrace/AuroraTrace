
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

export interface TransactionInfo {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  instructionsCount: number;
  success: boolean;
}

export async function fetchRecentSignatures(address: string, limit = 50): Promise<string[]> {
  const pubKey = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(pubKey, { limit });
  return signatures.map(sig => sig.signature);
}

export async function fetchTransactionDetails(signature: string): Promise<TransactionInfo | null> {
  const tx = await connection.getTransaction(signature);
  if (!tx) return null;

  const fee = tx.meta?.fee ?? 0;
  const success = tx.meta?.err === null;
  const instructionsCount = tx.transaction.message.instructions.length;

  return {
    signature,
    slot: tx.slot,
    blockTime: tx.blockTime ?? null,
    fee,
    instructionsCount,
    success,
  };
}

export async function fetchRecentTransactions(address: string, limit = 50): Promise<TransactionInfo[]> {
  const signatures = await fetchRecentSignatures(address, limit);
  const detailsPromises = signatures.map(sig => fetchTransactionDetails(sig));
  const details = await Promise.all(detailsPromises);
  return details.filter((tx): tx is TransactionInfo => tx !== null);
}
