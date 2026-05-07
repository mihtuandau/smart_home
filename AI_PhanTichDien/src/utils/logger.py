import csv
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# Color codes for terminal
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

class ColoredFormatter(logging.Formatter):
    FORMATS = {
        logging.DEBUG: f"{BLUE}%(levelname)s{RESET}: %(message)s",
        logging.INFO: f"{GREEN}%(levelname)s{RESET}: %(message)s",
        logging.WARNING: f"{YELLOW}%(levelname)s{RESET}: %(message)s",
        logging.ERROR: f"{RED}%(levelname)s{RESET}: %(message)s",
        logging.CRITICAL: f"{RED}%(levelname)s{RESET}: %(message)s",
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

def setup_logger(name: str = "ai_power", level: str = "INFO", log_file: str | None = None) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level.upper())

    if not logger.handlers:
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(ColoredFormatter())
        logger.addHandler(console_handler)

        # File handler if specified
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_path, encoding="utf-8")
            file_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
            logger.addHandler(file_handler)

    return logger

def append_alert_to_csv(csv_path: str, payload: dict[str, Any]) -> None:
    path = Path(csv_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    row = {
        "logged_at": datetime.now().isoformat(timespec="seconds"),
        "topic": payload.get("topic", ""),
        "cluster_id": payload.get("cluster_id", ""),
        "is_anomaly": payload.get("is_anomaly", ""),
        "anomaly_score": payload.get("anomaly_score", ""),
        "alerts": " | ".join(payload.get("alerts", []) or []),
        "recommendations": " | ".join(payload.get("recommendations", []) or []),
    }
    fieldnames = list(row.keys())
    file_exists = path.exists()

    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
