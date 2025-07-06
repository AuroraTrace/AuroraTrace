/**
 * Converts a numeric value into a human-readable string with proper formatting.
 * Supports thousands separator, decimal precision, and exponential fallback.
 * 
 * @param amount - The numeric value to be formatted.
 * @param precision - Number of decimal places (default: 2).
 * @param locale - Optional locale string (default: 'en-US').
 * @returns Formatted string representation.
 */
export function prettyAmount(
  amount: number,
  precision: number = 2,
  locale: string = 'en-US'
): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 'N/A'

  const rounded = Number(amount.toFixed(precision))

  // Tiny non-zero values (e.g., < 0.001)
  if (Math.abs(rounded) < 0.001 && rounded !== 0) {
    return rounded.toExponential(precision)
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(rounded)
}
