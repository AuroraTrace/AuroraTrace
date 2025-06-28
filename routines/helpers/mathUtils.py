

import numpy as np


def calculate_z_score(value, mean, std_dev):
    if std_dev == 0:
        return 0.0
    return round((value - mean) / std_dev, 4)


def exponential_moving_average(data, alpha=0.3):
    if not data:
        return []

    ema = [data[0]]
    for i in range(1, len(data)):
        ema.append(alpha * data[i] + (1 - alpha) * ema[-1])
    return ema


def normalize_series(series):
    max_val = max(series)
    min_val = min(series)
    if max_val == min_val:
        return [0 for _ in series]
    return [(val - min_val) / (max_val - min_val) for val in series]


def rolling_average(data, window_size=3):
    if window_size > len(data):
        return []
    return [
        round(sum(data[i:i+window_size]) / window_size, 2)
        for i in range(len(data) - window_size + 1)
    ]


def detect_outliers_z(data, threshold=2.5):
    mean = np.mean(data)
    std_dev = np.std(data)
    return [x for x in data if abs((x - mean) / std_dev) > threshold]


def weighted_average(values, weights):
    if not values or not weights or len(values) != len(weights):
        return 0.0
    total_weight = sum(weights)
    return round(sum(v * w for v, w in zip(values, weights)) / total_weight, 2)


def spike_score(current, average):
    if average == 0:
        return 0
    return round((current - average) / average * 100, 2)


def vector_magnitude(vector):
    return round(np.linalg.norm(vector), 4)
