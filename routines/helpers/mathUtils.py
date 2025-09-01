from __future__ import annotations

import math
from statistics import mean, pstdev
from typing import List, Sequence


# ---------------------------
# Core statistical helpers
# ---------------------------

def calculate_z_score(value: float, mean_val: float, std_dev: float) -> float:
    """
    Z-score of a value relative to mean/std.
    Returns 0.0 if std_dev = 0.
    """
    if std_dev == 0:
        return 0.0
    return round((value - mean_val) / std_dev, 4)


def exponential_moving_average(data: Sequence[float], alpha: float = 0.3) -> List[float]:
    """
    Exponential moving average of a series.
    """
    if not data:
        return []
    ema: List[float] = [data[0]]
    for i in range(1, len(data)):
        ema.append(alpha * data[i] + (1 - alpha) * ema[-1])
    return ema


def normalize_series(series: Sequence[float]) -> List[float]:
    """
    Normalize values to [0,1].
    Returns all zeros if max==min.
    """
    if not series:
        return []
    max_val = max(series)
    min_val = min(series)
    if max_val == min_val:
        return [0.0 for _ in series]
    return [(val - min_val) / (max_val - min_val) for val in series]


def rolling_average(data: Sequence[float], window_size: int = 3) -> List[float]:
    """
    Simple rolling average with fixed window size.
    Returns empty if window > len(data).
    """
    if window_size <= 0 or window_size > len(data):
        return []
    return [
        round(sum(data[i:i + window_size]) / window_size, 2)
        for i in range(len(data) - window_size + 1)
    ]


def detect_outliers_z(data: Sequence[float], threshold: float = 2.5) -> List[float]:
    """
    Detect outliers using z-score method.
    """
    if not data:
        return []
    m = mean(data)
    sd = pstdev(data)
    if sd == 0:
        return []
    return [x for x in data if abs((x - m) / sd) > threshold]


def weighted_average(values: Sequence[float], weights: Sequence[float]) -> float:
    """
    Weighted average, returns 0.0 if mismatched or empty.
    """
    if not values or not weights or len(values) != len(weights):
        return 0.0
    total_weight = sum(weights)
    if total_weight == 0:
        return 0.0
    return round(sum(v * w for v, w in zip(values, weights)) / total_weight, 2)


def spike_score(current: float, average: float) -> float:
    """
    Percentage spike relative to average.
    """
    if average == 0:
        return 0.0
    return round((current - average) / average * 100, 2)


def vector_magnitude(vector: Sequence[float]) -> float:
    """
    Euclidean magnitude of a vector.
    """
    return round(math.sqrt(sum(v * v for v in vector)), 4)


__all__ = [
    "calculate_z_score",
    "exponential_moving_average",
    "normalize_series",
    "rolling_average",
    "detect_outliers_z",
    "weighted_average",
    "spike_score",
    "vector_magnitude",
]
