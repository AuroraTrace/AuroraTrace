interface ActivityPoint {
  timestamp: number  // Unix timestamp in ms
  txCount: number    // Number of transactions during this time block
}

interface HeatmapResult {
  totalTx: number
  hourlyAverage: number
  mostActiveHourUTC: number
  distribution: Record<number, number> // hour -> tx count
}

export class TokenActivityHeatmap {
  constructor(private points: ActivityPoint[]) {}

  generate(): HeatmapResult {
    const distribution: Record<number, number> = {}
    let totalTx = 0

    for (const point of this.points) {
      const date = new Date(point.timestamp)
      const hour = date.getUTCHours()

      if (!distribution[hour]) distribution[hour] = 0
      distribution[hour] += point.txCount
      totalTx += point.txCount
    }

    const hourlyAverage = totalTx / 24
    const mostActiveHourUTC = Object.entries(distribution)
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0]

    return {
      totalTx,
      hourlyAverage,
      mostActiveHourUTC: parseInt(mostActiveHourUTC),
      distribution
    }
  }
}
