import time
import random

def dark_track(tx_path):
    if len(tx_path) > 5 and tx_path.count('unknown_wallet') >= 2:
        return "Suspicious Movement Detected"
    elif len(tx_path) > 3:
        return "Obscured Transaction Trail"
    else:
        return "Normal Flow"

def risk_alert(tx_density, token_age_days, recent_alerts):
    if tx_density > 300 and token_age_days < 5 and recent_alerts >= 2:
        return "Immediate Risk Alert"
    elif tx_density > 150:
        return "Watchlist"
    else:
        return "Stable"

def log_trace(event, metadata):
    print(f"[TRACE] {event} — {metadata} at {time.time()}")