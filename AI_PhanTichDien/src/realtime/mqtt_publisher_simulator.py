import sys
import time
import json
import argparse
from pathlib import Path
from typing import Any

import pandas as pd
import yaml

# Allow running as a script from any directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.utils.logger import setup_logger
import ssl
import paho.mqtt.client as mqtt

logger = setup_logger("Simulator")

def load_config(config_path: str) -> dict[str, Any]:
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Failed to load config: {e}")
        raise

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish simulated ESP32 messages to MQTT.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    parser.add_argument(
        "--input_csv",
        type=str,
        default="data/processed/smart_home_processed.csv",
        help="CSV used as message source.",
    )
    parser.add_argument("--limit", type=int, default=50, help="Number of rows to publish.")
    parser.add_argument("--interval_sec", type=float, default=2.0, help="Publish interval in seconds.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        config = load_config(args.config)
        mqtt_cfg = config["realtime"]["mqtt"]
        timestamp_col = config["data"]["timestamp_col"]

        if not Path(args.input_csv).exists():
            logger.error(f"Input CSV not found: {args.input_csv}")
            return

        df = pd.read_csv(args.input_csv).head(args.limit)
        if timestamp_col in df.columns:
            df[timestamp_col] = df[timestamp_col].astype(str)

        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        if mqtt_cfg.get("username") and mqtt_cfg.get("password"):
            client.username_pw_set(mqtt_cfg["username"], mqtt_cfg["password"])

        # Handle TLS
        tls_cfg = mqtt_cfg.get("tls", {})
        if tls_cfg.get("enabled", False) or int(mqtt_cfg.get("port", 1883)) == 8883:
            ca_cert = tls_cfg.get("ca_cert", "")
            if ca_cert:
                client.tls_set(ca_certs=ca_cert, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
            else:
                client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
            client.tls_insecure_set(bool(tls_cfg.get("insecure", False)))

        logger.info(f"Connecting to {mqtt_cfg['broker']}...")
        client.connect(mqtt_cfg["broker"], int(mqtt_cfg["port"]), int(mqtt_cfg.get("keepalive", 60)))
        client.loop_start()

        logger.info(f"Starting simulation: Publishing {len(df)} rows to {mqtt_cfg['topic']}")
        
        for i, row in enumerate(df.to_dict(orient="records"), start=1):
            # Convert NaN to None for JSON
            clean_row = {k: (v if pd.notna(v) else None) for k, v in row.items()}
            payload = json.dumps(clean_row, ensure_ascii=False)
            client.publish(mqtt_cfg["topic"], payload, qos=mqtt_cfg.get("qos", 1))
            logger.info(f"[{i}/{len(df)}] Sent: {payload[:80]}...")
            time.sleep(args.interval_sec)
            
    except KeyboardInterrupt:
        logger.info("Simulation stopped.")
    except Exception as e:
        logger.error(f"Error in simulator: {e}")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
