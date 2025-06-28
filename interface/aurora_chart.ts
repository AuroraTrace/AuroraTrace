export interface RiskChartOptions {
  /** threshold between “low” and “medium” (0–1) */
  mediumThreshold?: number
  /** threshold between “medium” and “high” (0–1) */
  highThreshold?: number
  /** icons for each level */
  icons?: {
    low: string
    medium: string
    high: string
  }
  /** string to insert between icons */
  separator?: string
}

const DEFAULT_OPTIONS: Required<RiskChartOptions> = {
  mediumThreshold: 0.5,
  highThreshold: 0.8,
  icons: {
    low: "🟢",
    medium: "🟠",
    high: "🔴",
  },
  separator: " ",
}

/**
 * Renders a simple risk “chart” by mapping each value (0–1) to an icon
 * according to configurable thresholds and icons.
 *
 * @param riskData - array of risk scores (numbers between 0 and 1)
 * @param opts - optional thresholds, icons, and separator
 * @returns a string of icons joined by the separator
 */
export function renderRiskChart(
  riskData: number[],
  opts?: RiskChartOptions
): string {
  const { mediumThreshold, highThreshold, icons, separator } = {
    ...DEFAULT_OPTIONS,
    ...opts,
    icons: { ...DEFAULT_OPTIONS.icons, ...(opts?.icons ?? {}) },
  }

  // ensure thresholds make sense
  const lowMax = Math.min(mediumThreshold, highThreshold)
  const medMax = Math.max(mediumThreshold, Math.min(highThreshold, 1))

  return riskData
    .map((val, i) => {
      const clamped = Math.max(0, Math.min(1, val))
      if (clamped >= medMax) return icons.high
      if (clamped >= lowMax) return icons.medium
      return icons.low
    })
    .join(separator)
}
