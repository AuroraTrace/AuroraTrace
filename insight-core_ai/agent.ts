export const PROJECT_NAME = "AuroraTrace";

export interface AppConfig {
  projectName: string;
  solanaRpcUrl: string;
  dexscreenerApiUrl: string;
  birdeyeApiUrl: string;
}

export const config: AppConfig = {
  projectName: PROJECT_NAME,
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  dexscreenerApiUrl: process.env.DEXSCREENER_API_URL || "https://api.dexscreener.com",
  birdeyeApiUrl: process.env.BIRDEYE_API_URL || "https://api.birdeye.so/v2"
};
