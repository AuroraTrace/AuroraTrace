export interface RiskInput {
  volumeChangeRatio: number;       // normalized 0–1
  flashloanDetected: boolean;
  smartWalletDensity: number;      // normalized 0–1
  sybilOverlapScore: number;       // normalized 0–1
}

export enum RiskLabel {
  Low = "Low",
  Elevated = "Elevated",
  High = "High",
  Severe = "Severe",
}

const WEIGHTS = {
  volume: 0.25,
  flashloan: 0.35,
  smartWallet: 0.2,
  sybil: 0.2,
};

export function computeRiskScore(input: RiskInput): number {
  const score =
    input.volumeChangeRatio * WEIGHTS.volume +
    (input.flashloanDetected ? 1 : 0) * WEIGHTS.flashloan +
    input.smartWalletDensity * WEIGHTS.smartWallet +
    input.sybilOverlapScore * WEIGHTS.sybil;

  return parseFloat((score * 100).toFixed(1));
}

export function mapScoreToLabel(score: number): RiskLabel {
  if (score >= 85) return RiskLabel.Severe;
  if (score >= 60) return RiskLabel.High;
  if (score >= 35) return RiskLabel.Elevated;
  return RiskLabel.Low;
}

export function describeRisk(label: RiskLabel): string {
  switch (label) {
    case RiskLabel.Severe:
      return "🚨 Severe on-chain risk — immediate investigation required";
    case RiskLabel.High:
      return "⚠️ High risk — strong anomalies detected";
    case RiskLabel.Elevated:
      return "🟡 Elevated risk — partial suspicious patterns";
    case RiskLabel.Low:
      return "🟢 Low risk — normal blockchain behavior";
  }
}