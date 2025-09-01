from __future__ import annotations

import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Iterable, List, Mapping, Sequence


# ---------------------------
# Enums
# ---------------------------

class FlowStatus(str, Enum):
  SUSPICIOUS = "Suspicious Movement Detected"
  OBSCURED = "Obscured Transaction Trail"
  NORMAL = "Normal Flow"


class RiskLevel(str, Enum):
  IMMEDIATE = "Immediate Risk Alert"
  WATCHLIST = "Watchlist"
  STABLE = "Stable"


# ---------------------------
# Config (deterministic, no randomness)
# ---------------------------

@dataclass(frozen=True)
class Heuristics:
  unknown_wallet_tag: str = "unknown_wallet"
  suspicious_min_len: int = 6
  suspicious_min_unknown: int = 2
  obscured_min_len: int = 4

  density_immediate: int = 300
  density_watchlist: int = 150
  young_token_days: int = 5
  recent_alerts_min: int = 2


DEFAULT_RULES = Heuristics()


# ---------------------------
# Results
# ---------------------------

@dataclass(frozen=True)
class PathAnalysis:
  status: FlowStatus
  length: int
  unknown_count: int


@dataclass(frozen=True)
class RiskAnalysis:
  level: RiskLevel
  tx_density: int
  token_age_days: int
  recent_alerts: int


# ---------------------------
# Core logic
# ---------------------------

def analyze_path(
  tx_path: Sequence[str],
  *,
  rules: Heuristics = DEFAULT_RULES
) -> PathAnalysis:
  """
  Classify the transaction path using simple, deterministic rules
  """
  length = len(tx_path)
  unknown_count = sum(1 for x in tx_path if x == rules.unknown_wallet_tag)

  if length >= rules.suspicious_min_len and unknown_count >= rules.suspicious_min_unknown:
    status = FlowStatus.SUSPICIOUS
  elif length >= rules.obscured_min_len:
    status = FlowStatus.OBSCURED
  else:
    status = FlowStatus.NORMAL

  return PathAnalysis(status=status, length=length, unknown_count=unknown_count)


def assess_risk(
  tx_density: int,
  token_age_days: int,
  recent_alerts: int,
  *,
  rules: Heuristics = DEFAULT_RULES
) -> RiskAnalysis:
  """
  Determine risk level based on activity density, token age, and alert history
  """
  if (
    tx_density > rules.density_immediate
    and token_age_days < rules.young_token_days
    and recent_alerts >= rules.recent_alerts_min
  ):
    level = RiskLevel.IMMEDIATE
  elif tx_density > rules.density_watchlist:
    level = RiskLevel.WATCHLIST
  else:
    level = RiskLevel.STABLE

  return RiskAnalysis(
    level=level,
    tx_density=tx_density,
    token_age_days=token_age_days,
    recent_alerts=recent_alerts,
  )


# ---------------------------
# Logging
# ---------------------------

def now_iso() -> str:
  return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def log_trace(event: str, metadata: Mapping[str, object] | None = None) -> None:
  """
  Structured trace logger (stdout, JSON line)
  """
  payload = {
    "ts": now_iso(),
    "level": "TRACE",
    "event": event,
    "metadata": dict(metadata or {}),
    "epoch": time.time(),
  }
  print(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))


# ---------------------------
# Backwards-compatible wrappers
# ---------------------------

def dark_track(tx_path: Iterable[str]) -> str:
  """
  Back-compat wrapper returning the legacy string label
  """
  result = analyze_path(list(tx_path))
  return result.status.value


def risk_alert(tx_density: int, token_age_days: int, recent_alerts: int) -> str:
  """
  Back-compat wrapper returning the legacy string label
  """
  result = assess_risk(tx_density, token_age_days, recent_alerts)
  return result.level.value


__all__ = [
  "FlowStatus",
  "RiskLevel",
  "Heuristics",
  "PathAnalysis",
  "RiskAnalysis",
  "analyze_path",
  "assess_risk",
  "log_trace",
  "dark_track",
  "risk_alert",
]
