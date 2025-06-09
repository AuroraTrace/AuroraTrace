export function renderRiskChart(riskData: number[]): string {
  return riskData.map(val => {
    if (val > 0.8) return "🔴";
    if (val > 0.5) return "🟠";
    return "🟢";
  }).join(" ");
}