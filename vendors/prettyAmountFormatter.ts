/**
 * Converts a numeric value into a human-readable string with proper formatting.
 * Supports thousands separator, decimal precision, and exponential fallback.
 * @param amount - The numeric value to be formatted.
 * @param precision - Decimal places to round to (default: 2).
 * @returns Formatted string version of the number.
 */
export function prettyAmount(amount: number, precision: number = 2): string {
  if (!Number.isFinite(amount)) return 'N/A';

  const rounded = Number(amount.toFixed(precision));

  // Handle tiny values less than 0.001
  if (Math.abs(rounded) < 0.001 && rounded !== 0) {
    return rounded.toExponential(precision);
  }

  // Add thousands separator using Intl
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(rounded);
}