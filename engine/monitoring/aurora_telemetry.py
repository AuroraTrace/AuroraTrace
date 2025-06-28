import time
import logging
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any


# --- Setup structured logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ"
)
logger = logging.getLogger("TransactionAnalyzer")


# --- Enums for clear return values ---
class MovementStatus(Enum):
    NORMAL = "Normal Flow"
    OBSCURED = "Obscured Transaction Trail"
    SUSPICIOUS = "Suspicious Movement Detected"


class RiskLevel(Enum):
    STABLE = "Stable"
    WATCHLIST = "Watchlist"
    IMMEDIATE_ALERT = "Immediate Risk Alert"


# --- Configuration thresholds ---
@dataclass(frozen=True)
class Thresholds:
    min_path_len_for_obscured: int = 4
    min_path_len_for_suspicious: int = 6
    unknown_wallets_for_suspicious: int = 2

    density_watchlist: int = 150
    density_alert: int = 300
    age_days_alert: int = 5
    recent_alerts_for_alert: int = 2


TH = Thresholds()


def dark_track(tx_path: List[str]) -> MovementStatus:
    """
    Analyze a transaction path to determine movement status.

    - Suspicious if path length > min and has >= unknown_wallets_for_suspicious occurrences of 'unknown_wallet'
    - Obscured if path length > min_path_len_for_obscured
    - Normal otherwise
    """
    path_len = len(tx_path)
    unknown_count = tx_path.count("unknown_wallet")

    if path_len >= TH.min_path_len_for_suspicious and unknown_count >= TH.unknown_wallets_for_suspicious:
        return MovementStatus.SUSPICIOUS
    if path_len >= TH.min_path_len_for_obscured:
        return MovementStatus.OBSCURED
    return MovementStatus.NORMAL


def risk_alert(tx_density: float, token_age_days: int, recent_alerts: int) -> RiskLevel:
    """
    Determine risk level based on transaction density, token age, and recent alerts.

    - Immediate alert if density > alert threshold AND token age < age_days_alert AND recent_alerts >= recent_alerts_for_alert
    - Watchlist if density > density_watchlist
    - Stable otherwise
    """
    if (
        tx_density > TH.density_alert
        and token_age_days < TH.age_days_alert
        and recent_alerts >= TH.recent_alerts_for_alert
    ):
        return RiskLevel.IMMEDIATE_ALERT
    if tx_density > TH.density_watchlist:
        return RiskLevel.WATCHLIST
    return RiskLevel.STABLE


def log_trace(event: str, metadata: Dict[str, Any]) -> None:
    """
    Log a trace event with metadata and timestamp.
    Uses structured logging for consistency.
    """
    logger.debug("TRACE event=%s metadata=%s", event, metadata)


# --- Example usage ---
if __name__ == "__main__":
    sample_path = ["walletA", "unknown_wallet", "walletB", "unknown_wallet", "walletC", "walletD"]
    status = dark_track(sample_path)
    logger.info("MovementStatus: %s", status.value)

    level = risk_alert(tx_density=320, token_age_days=2, recent_alerts=3)
    logger.warning("RiskLevel: %s", level.value)

    log_trace("TokenSwap", {"from": "walletA", "to": "walletC", "amount": 123.45})
