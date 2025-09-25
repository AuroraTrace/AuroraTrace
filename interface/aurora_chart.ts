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
  /** optional labels to append for clarity */
  labels?: {
    low: string
    medium: string
    high: string
  }
}

const DEFAULT_OPTIONS: Required<Omit<RiskChartOptions, "labels">> = {
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
 * Map a single score to an icon (and label if configured)
 */
function mapScore(
  score: number,
  medium: number,
  high: number,
  icons: Required<RiskChartOptions>["icons"],
  labels?: RiskChartOptions["labels"]
): string {
  const clamped = Math.max(0, Math.min(1, score))
  if (clamped >= high) {
    return labels?.high ? `${icons.high}${labels.high}` : icons.high
  }
  if (clamped >= medium) {
    return labels?.medium ? `${icons.medium}${labels.medium}` : icons.medium
  }
  return labels?.low ? `${icons.low}${labels.low}` : icons.low
}

/**
 * Renders a simple risk chart by mapping each value (0–1) to an icon
 * according to configurable thresholds, icons, and optional labels.
 */
export function renderRiskChart(
  riskData: number[],
  opts?: RiskChartOptions
): string {
  if (!riskData.length) return ""

  const merged = {
    ...DEFAULT_OPTIONS,
    ...opts,
    icons: { ...DEFAULT_OPTIONS.icons, ...(opts?.icons ?? {}) },
  }

  // enforce valid threshold order
  let { mediumThreshold, highThreshold } = merged
  if (mediumThreshold >= highThreshold) {
    mediumThreshold = DEFAULT_OPTIONS.mediumThreshold
    highThreshold = DEFAULT_OPTIONS.highThreshold
  }

  return riskData
    .map(score => mapScore(score, mediumThreshold, highThreshold, merged.icons, opts?.labels))
    .join(merged.separator)
}
