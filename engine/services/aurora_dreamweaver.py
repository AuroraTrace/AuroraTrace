import time
import logging
from typing import List, Dict, Any

# Configure module logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

def dark_track(tx_path: List[str], min_length: int = 5, unknown_threshold: int = 2) -> str:
    """
    Analyze a transaction path for obfuscation.
    - tx_path: list of wallet identifiers
    - min_length: minimum path length to consider complex
    - unknown_threshold: count of 'unknown_wallet' entries to flag suspicion
    """
    length = len(tx_path)
    unknown_count = tx_path.count('unknown_wallet')
    if length >= min_length and unknown_count >= unknown_threshold:
        return "Suspicious Movement Detected"
    if length > 3:
        return "Obscured Transaction Trail"
    return "Normal Flow"

def risk_alert(tx_density: float, token_age_days: float, recent_alerts: int,
               density_watch: float = 150, density_immediate: float = 300,
               age_threshold: float = 5, alert_threshold: int = 2) -> str:
    """
    Determine risk alert level based on transaction density, token age, and past alerts.
    """
    if tx_density >= density_immediate and token_age_days <= age_threshold and recent_alerts >= alert_threshold:
        return "Immediate Risk Alert"
    if tx_density >= density_watch:
        return "Watchlist"
    return "Stable"

def log_trace(event: str, metadata: Dict[str, Any]) -> None:
    """
    Log a trace event with structured metadata.
    """
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        "meta": metadata
    }
    logger.info("TRACE: %s", entry)
