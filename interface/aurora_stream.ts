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
}

export class WalletFlowStreamer {
  private wallets: string[]
  private interval: number
  private onWallet: WalletCallback
  private onComplete?: () => void
  private onError?: (error: Error) => void

  private timerId: ReturnType<typeof setTimeout> | null = null
  private currentIndex = 0
  private isPaused = false

  constructor(wallets: string[], opts: StreamOptions) {
    if (!Array.isArray(wallets) || wallets.length === 0) {
      throw new Error("Wallet list must be a non-empty array")
    }
    if (opts.interval <= 0) {
      throw new Error("Interval must be a positive number")
    }

    this.wallets     = wallets
    this.interval    = opts.interval
    this.onWallet    = opts.onWallet
    this.onComplete  = opts.onComplete
    this.onError     = opts.onError
  }

  /** start or resume streaming */
  start() {
    if (this.timerId) return // already running
    this.isPaused = false
    this.scheduleNext()
  }

  /** pause without losing position */
  pause() {
    this.isPaused = true
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  /** stop and reset */
  stop() {
    this.pause()
    this.currentIndex = 0
  }

  private scheduleNext() {
    this.timerId = setTimeout(() => {
      if (this.isPaused) return

      try {
        const wallet = this.wallets[this.currentIndex]
        this.onWallet(wallet, this.currentIndex)
      } catch (err: any) {
        this.onError?.(err)
        this.stop()
        return
      }

      this.currentIndex++
      if (this.currentIndex >= this.wallets.length) {
        this.onComplete?.()
        this.stop()
      } else {
        this.scheduleNext()
      }
    }, this.interval)
  }

  /** async iterator support */
  async *[Symbol.asyncIterator]() {
    for (const wallet of this.wallets) {
      yield new Promise<string>((resolve) => {
        this.onWallet = () => resolve(wallet)
        this.start()
      })
    }
  }
}
