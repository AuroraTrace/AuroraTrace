import { headers } from "next/headers"

/**
 * Retrieves the current request path from custom headers.
 * Falls back to '/' if unavailable or invalid.
 */
export const getCurrentRequestPath = (): string => {
  try {
    const headerList = headers()
    const path = headerList.get("x-current-path")

    return typeof path === "string" && path.length > 0 ? path : "/"
  } catch (error) {
    console.error("Failed to get current path from headers:", error)
    return "/"
  }
}
