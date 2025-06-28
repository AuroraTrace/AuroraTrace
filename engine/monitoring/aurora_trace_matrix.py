import numpy as np
from typing import List, Dict, Tuple, Any


def compute_flow_matrix(
    transactions: List[Dict[str, Any]], *,
    size: int = None
) -> np.ndarray:
    """
    Build a square flow matrix from a list of transactions.

    Each transaction dict may contain:
      - 'src_index': row index (default 0)
      - 'dst_index': column index (default 0)
      - 'amount': value to accumulate (default 0)

    If `size` is not provided, it will be inferred as one plus the maximum
    index seen in transactions.

    Returns:
        A (size x size) numpy array of floats.
    """
    # Infer matrix size if not given
    if size is None:
        max_idx = 0
        for tx in transactions:
            src = tx.get('src_index', 0)
            dst = tx.get('dst_index', 0)
            max_idx = max(max_idx, src, dst)
        size = max_idx + 1

    # Preallocate matrix
    matrix = np.zeros((size, size), dtype=float)

    # Vectorized accumulation
    srcs = np.array([tx.get('src_index', 0) for tx in transactions], dtype=int)
    dsts = np.array([tx.get('dst_index', 0) for tx in transactions], dtype=int)
    vals = np.array([tx.get('amount', 0.0) for tx in transactions], dtype=float)

    # Add amount to matrix[src, dst] for each transaction
    np.add.at(matrix, (srcs, dsts), vals)

    return matrix


def detect_flow_anomalies(
    matrix: np.ndarray, *,
    factor: float = 2.0,
    min_threshold: float = None
) -> List[Tuple[int, int]]:
    """
    Detect indices in the matrix where flow exceeds a threshold.

    Args:
        matrix: 2D numpy array of flows.
        factor: multiplier of the mean to set as threshold if
                `min_threshold` is None.
        min_threshold: explicit threshold; overrides factor-based threshold.

    Returns:
        A list of (row, col) tuples where matrix[row, col] > threshold.
    """
    # Determine threshold
    if min_threshold is None:
        threshold = matrix.mean() * factor
    else:
        threshold = min_threshold

    # Find all positions exceeding the threshold
    anomalies = np.argwhere(matrix > threshold)
    # Convert to list of tuples
    return [tuple(idx) for idx in anomalies]


# --- Example usage ---
if __name__ == "__main__":
    sample_txs = [
        {'src_index': 0, 'dst_index': 1, 'amount': 10},
        {'src_index': 2, 'dst_index': 3, 'amount': 5},
        {'src_index': 0, 'dst_index': 1, 'amount': 7},
        {'src_index': 4, 'dst_index': 4, 'amount': 50},
    ]

    fm = compute_flow_matrix(sample_txs)
    print("Flow matrix:\n", fm)

    anomalies = detect_flow_anomalies(fm, factor=1.5)
    print("Anomalous flows at indices:", anomalies)
