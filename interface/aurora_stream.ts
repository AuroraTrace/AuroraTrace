type WalletCallback = (wallet: string, index: number) => void

interface StreamOptions {
  /** milliseconds between emits, must be > 0 */
  interval: number
  /** callback on each wallet */
  onWallet: WalletCallback
  /** callback when done */
  onComplete?: () => void
  /** callback on error */
  onError?: (error: Error) => void
  /** whether to auto-reset index on completion (default: false) */
  resetOnComplete?: boolean
}

export class WalletFlowStreamer {
  private wallets: string[]
  private interval: number
  private onWallet: WalletCallback
  private onComplete?: () => void
  private onError?: (error: Error) => void
  private resetOnComplete: boolean

  private timerId: NodeJS.Timeout | null = null
  private currentIndex = 0
  private isRunning = false

  constructor(wallets: string[], opts: StreamOptions) {
    if (!Array.isArray(wallets) || wallets.length === 0) {
      throw new Error("Wallet list must be a non-empty array")
    }
    if (opts.interval <= 0) {
      throw new Error("Interval must be a positive number")
    }

    this.wallets          = wallets
    this.interval         = opts.interval
    this.onWallet         = opts.onWallet
    this.onComplete       = opts.onComplete
    this.onError          = opts.onError
    this.resetOnComplete  = opts.resetOnComplete ?? false
  }

  /** Start streaming from current index */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.timerId = setInterval(() => this.emitNext(), this.interval)
    // emit first immediately
    this.emitNext()
  }

  /** Pause streaming without resetting index */
  pause(): void {
    this.clearTimer()
    this.isRunning = false
  }

  /** Stop streaming and reset index to zero */
  stop(): void {
    this.pause()
    this.currentIndex = 0
  }

  /** Internal: emit next wallet or complete */
  private emitNext(): void {
    if (this.currentIndex >= this.wallets.length) {
      this.onComplete?.()
      if (this.resetOnComplete) {
        this.currentIndex = 0
      }
      this.stop()
      return
    }

    try {
      const wallet = this.wallets[this.currentIndex]
      this.onWallet(wallet, this.currentIndex)
      this.currentIndex++
    } catch (err: any) {
      this.onError?.(err)
      this.stop()
    }
  }

  /** Clear the running timer */
  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }


  async *[Symbol.asyncIterator](): AsyncGenerator<string> {
    // Ensure clean state
    this.stop()
    for (let i = 0; i < this.wallets.length; i++) {
      yield this.wallets[i]
      await new Promise((res) => setTimeout(res, this.interval))
    }
    this.onComplete?.()
    if (this.resetOnComplete) this.currentIndex = 0
  }
}
