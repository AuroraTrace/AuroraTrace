import json
import datetime
from typing import List, Dict

MINT_THRESHOLD = 100_000     # suspicious minting amount
HOLDER_ALERT_LIMIT = 3       # low number of holders
WINDOW = 10                  # recent token events to check

def load_token_events(file_path: str) -> List[Dict]:
    with open(file_path, "r") as f:
        return json.load(f)

def detect_suspicious_minting(events: List[Dict]) -> List[Dict]:
    alerts = []
    for event in events[-WINDOW:]:
        minted = event.get("minted", 0)
        holders = event.get("holders", 0)
        if minted >= MINT_THRESHOLD and holders <= HOLDER_ALERT_LIMIT:
            alerts.append({
                "token": event["token"],
                "minted": minted,
                "holders": holders,
                "timestamp": event["timestamp"],
                "alert": "⚠️ Suspicious token minting detected",
                "details": f"Minted {minted} tokens, only {holders} holders"
            })
    return alerts

def log_alerts(alerts: List[Dict], out_path: str):
    with open(out_path, "a") as f:
        for alert in alerts:
            f.write(json.dumps(alert) + "\n")

def main():
    events = load_token_events("recentTokenEvents.json")
    alerts = detect_suspicious_minting(events)

    if alerts:
        print(f"[{datetime.datetime.now().isoformat()}] Suspicious minting detected")
        log_alerts(alerts, "mintingAlerts.json")
    else:
        print(f"[{datetime.datetime.now().isoformat()}] No suspicious minting found")

if __name__ == "__main__":
    main()