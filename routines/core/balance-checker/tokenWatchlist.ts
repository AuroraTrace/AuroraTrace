type WatchlistEntry = {
  mint: string
  label?: string
  createdAt: number
}

export class TokenWatchlist {
  private entries: Map<string, WatchlistEntry> = new Map()

  add(mint: string, label?: string): void {
    const key = mint.trim()
    if (this.entries.has(key)) return

    this.entries.set(key, {
      mint: key,
      label: label || undefined,
      createdAt: Date.now()
    })
  }

  remove(mint: string): boolean {
    return this.entries.delete(mint.trim())
  }

  list(): WatchlistEntry[] {
    return Array.from(this.entries.values())
  }

  has(mint: string): boolean {
    return this.entries.has(mint.trim())
  }

  clear(): void {
    this.entries.clear()
  }

  filterByLabel(query: string): WatchlistEntry[] {
    return this.list().filter(entry =>
      entry.label?.toLowerCase().includes(query.toLowerCase())
    )
  }
}
