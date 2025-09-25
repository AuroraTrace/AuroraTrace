function predictAnomalyScore(signal) {
  if (!signal.length) return [];
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const variance =
    signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    signal.length;
  const stdDev = Math.sqrt(variance) || 1; // prevent division by zero
  return signal.map((value) => Math.abs(value - mean) / stdDev);
}

function generateDecisionTree(input) {
  if (!input || input.length === 0) return null;
  const feature = Object.keys(input[0])[0] || "feature1";
  return {
    condition: `${feature} > 0.5`,
    trueBranch: { decision: "Accept" },
    falseBranch: { decision: "Reject" },
  };
}

function simulateNeuralActivation(layerInputs, weights) {
  return layerInputs.map((input, i) => {
    if (!weights[i] || weights[i].length !== input.length) {
      throw new Error(`Dimension mismatch for layer ${i}`);
    }
    const weightedSum = input.reduce(
      (sum, val, j) => sum + val * weights[i][j],
      0
    );
    return 1 / (1 + Math.exp(-weightedSum)); // Sigmoid
  });
}

function temporalEventClustering(events, timeWindow) {
  if (!events.length) return [];
  const clusters = [];
  let currentCluster = [events[0]];

  for (let i = 1; i < events.length; i++) {
    const prev = currentCluster[currentCluster.length - 1];
    if (events[i].timestamp - prev.timestamp <= timeWindow) {
      currentCluster.push(events[i]);
    } else {
      clusters.push(currentCluster);
      currentCluster = [events[i]];
    }
  }

  clusters.push(currentCluster);
  return clusters;
}

// ---- Test Cases ----
const testSignal = [0.2, 0.5, 0.8, 1.1, 0.9];
const scores = predictAnomalyScore(testSignal);
console.log("Anomaly scores:", scores);

const tree = generateDecisionTree([{ feature1: 0.6 }]);
console.log("Decision tree:", tree);

const layerOutput = simulateNeuralActivation(
  [[0.1, 0.9]],
  [[0.5, -0.3]]
);
console.log("Neural output:", layerOutput);

const events = [
  { timestamp: 1000 },
  { timestamp: 1500 },
  { timestamp: 3000 },
  { timestamp: 8000 },
];
const clustered = temporalEventClustering(events, 2000);
console.log("Clusters:", clustered);
