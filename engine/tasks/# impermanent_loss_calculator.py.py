#!/usr/bin/env python3
# transaction_report.py

import argparse
import json
import sys
from typing import List, Dict, Any

import numpy as np

from compute_flow_matrix import compute_flow_matrix
from detect_flow_anomalies import detect_flow_anomalies
from stats_analyzer import compute_node_flows, top_n_nodes


def load_transactions(path: str) -> List[Dict[str, Any]]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_top(title: str, items: List, label_fn=lambda x: x) -> None:
    print(f"\n{title}")
    for idx, val in items:
        print(f"  {label_fn(idx)}: {val:.2f}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate a flow report from a JSON list of transactions")
    parser.add_argument(
        "input", help="Path to JSON file containing array of transactions")
    parser.add_argument(
        "--size", type=int, default=None,
        help="Optional matrix size (inferred if omitted)")
    parser.add_argument(
        "--anomaly-factor", type=float, default=2.0,
        help="Multiplier of mean to detect anomalies")
    parser.add_argument(
        "--top-n", type=int, default=5,
        help="How many top senders/receivers to display")
    args = parser.parse_args()

    try:
        txs = load_transactions(args.input)
    except Exception as e:
        print(f"Error loading transactions: {e}", file=sys.stderr)
        sys.exit(1)

    matrix = compute_flow_matrix(txs, size=args.size)
    anomalies = detect_flow_anomalies(matrix, factor=args.anomaly_factor)

    outflows, inflows = compute_node_flows(matrix)
    top_senders   = top_n_nodes(outflows, n=args.top_n)
    top_receivers = top_n_nodes(inflows, n=args.top_n)

    total_txs   = len(txs)
    total_volume = matrix.sum()

    print(f"\nTransaction Report for {args.input}")
    print(f"  Total transactions: {total_txs}")
    print(f"  Total volume:       {total_volume:.2f}")

    format_top("Top Senders:", top_senders, label_fn=lambda i: f"Node {i}")
    format_top("Top Receivers:", top_receivers, label_fn=lambda i: f"Node {i}")

    if anomalies:
        print(f"\nAnomalous flows (>{args.anomaly_factor}×mean):")
        for r, c in anomalies:
            print(f"  [{r}→{c}]: {matrix[r, c]:.2f}")
    else:
        print("\nNo anomalies detected")

    print()

if __name__ == "__main__":
    main()
