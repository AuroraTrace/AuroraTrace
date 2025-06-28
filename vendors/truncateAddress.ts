
interface TruncateOptions {
  prefixLength?: number;
  suffixLength?: number;
  fallback?: string;
  showFullOnHover?: boolean; // потенциальное будущее использование в UI
}

export const truncateAddress = (
  address: string | undefined | null,
  options: TruncateOptions = {}
): string => {
  const {
    prefixLength = 6,
    suffixLength = 6,
    fallback = "Unknown"
  } = options;

  if (!address || typeof address !== "string" || address.length < prefixLength + suffixLength) {
    console.warn("Invalid or too short address:", address);
    return fallback;
  }

  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);

  return `${prefix}...${suffix}`;
};
