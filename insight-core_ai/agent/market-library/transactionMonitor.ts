import { Connection, PublicKey } from "@solana/web3.js"

/**
 * Monitors on-chain account changes via WebSocket subscriptions
 */
export class TransactionMonitor {
  private connection: Connection
  private subscriptions: Map<string, number> = new Map()

  constructor(rpcUrl: string, wsUrl?: string) {
    this.connection = new Connection(rpcUrl, wsUrl)
  }

  /**
   * Subscribe to account changes for a given wallet or token account
   * @param address - Public key of the account to monitor
   * @param callback - Called when the account data changes
   */
  subscribeAccount(
    address: string,
    callback: (data: Buffer) => void
  ): string {
    const pubkey = new PublicKey(address)
    const subId = this.connection.onAccountChange(
      pubkey,
      (accountInfo) => {
        callback(accountInfo.data)
      },
      "confirmed"
    )
    this.subscriptions.set(address, subId)
    return address
  }

  /**
   * Unsubscribe from account changes
   * @param address - The address previously subscribed
   */
  unsubscribeAccount(address: string): boolean {
    const subId = this.subscriptions.get(address)
    if (subId !== undefined) {
      this.connection.removeAccountChangeListener(subId)
      this.subscriptions.delete(address)
      return true
    }
    return false
  }

  /**
   * Close all subscriptions and the underlying connection
   */
  async shutdown(): Promise<void> {
    for (const subId of this.subscriptions.values()) {
      this.connection.removeAccountChangeListener(subId)
    }
    this.subscriptions.clear()
    await this.connection.close()
  }
}
