
import { headers } from "next/headers"

/**
 * Retrieves the current request path from custom headers.
 * Falls back to '/' if the header is missing.
 */
export const getCurrentRequestPath = async (): Promise<string> => {
    try {
        const headerList = await headers();
        const path = headerList.get("x-current-path");
        return path ?? "/";
    } catch (error) {
        console.error("Failed to get current path from headers:", error);
        return "/";
    }
};
