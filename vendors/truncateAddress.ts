interface TruncateOptions {
  prefixLength?: number
  suffixLength?: number
  fallback?: string
  showFullOnHover?: boolean  // if true, returns an HTML span with title attribute
}

/**
 * Truncate a long address by keeping a prefix and suffix, with optional hover behavior.
 *
 * @param address        The full address string (e.g. wallet or transaction ID)
 * @param options.prefixLength   Number of chars to keep at the start (default 6)
 * @param options.suffixLength   Number of chars to keep at the end (default 6)
 * @param options.fallback       What to return if address is missing or too short (default "Unknown")
 * @param options.showFullOnHover If true, wraps the truncated text in a <span> with title
 *
 * @returns A truncated string, or HTML string if showFullOnHover is enabled
 */
export const truncateAddress = (
  address: string | undefined | null,
  options: TruncateOptions = {}
): string => {
  const {
    prefixLength = 6,
    suffixLength = 6,
    fallback = "Unknown",
    showFullOnHover = false
  } = options

  if (!address || typeof address !== "string") {
    console.warn("truncateAddress: invalid address:", address)
    return fallback
  }
  const minLength = prefixLength + suffixLength + 1 // +1 for the ellipsis
  if (address.length < minLength) {
    console.warn("truncateAddress: address too short to truncate:", address)
    return address
  }

  const prefix = address.slice(0, prefixLength)
  const suffix = address.slice(-suffixLength)
  const truncated = `${prefix}…${suffix}`

  if (showFullOnHover) {
    // Escape HTML in title to prevent injection
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;")
         .replace(/"/g, "&quot;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
    const safeAddress = escapeHtml(address)
    return `<span title="${safeAddress}" style="cursor: help;">${truncated}</span>`
  }

  return truncated
}
