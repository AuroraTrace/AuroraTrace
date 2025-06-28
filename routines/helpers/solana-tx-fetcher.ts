export const RISK_WEIGHTS = {
  volumeSpike: 0.3,
  flashloan: 0.4,
  smartWallet: 0.15,
  sybilCluster: 0.15,
}

export function calculateRiskScore(factors: RiskFactors): number {
  const score =
    Math.min(factors.volumeSpikeIndex / 300, 1) * RISK_WEIGHTS.volumeSpike +
    (factors.flashloanActivity ? 1 : 0) * RISK_WEIGHTS.flashloan +
    Math.min(factors.smartWalletRatio / 100, 1) * RISK_WEIGHTS.smartWallet +
    Math.min(factors.sybilClusterSize / 10, 1) * RISK_WEIGHTS.sybilCluster

  return parseFloat((score * 100).toFixed(1))
}
