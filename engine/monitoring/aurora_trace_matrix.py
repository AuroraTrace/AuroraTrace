import numpy as np

def compute_flow_matrix(transactions):
    matrix = np.zeros((10, 10))
    for tx in transactions:
        src = tx.get('src_index', 0)
        dst = tx.get('dst_index', 0)
        value = tx.get('amount', 0)
        matrix[src][dst] += value
    return matrix

def detect_flow_anomalies(matrix):
    threshold = np.mean(matrix) * 2
    return [(i, j) for i in range(len(matrix)) for j in range(len(matrix[i])) if matrix[i][j] > threshold]