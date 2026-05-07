from __future__ import annotations

import argparse
import json
import ssl
import sys
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt
import yaml

# Allow running as a script: python src/realtime/alert_subscriber.py
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.utils.logger import append_alert_to_csv


def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Subscribe alert topic and log alerts to CSV.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    parser.add_argument("--output_csv", type=str, default="logs/alerts_history.csv")
    return parser.parse_args()


def create_client(config: dict[str, Any], output_csv: str) -> mqtt.Client:
    mqtt_cfg = config["realtime"]["mqtt"]
    alert_topic = mqtt_cfg.get("alert_topic", "esp32/alerts")
    qos = mqtt_cfg.get("qos", 1)

    def on_connect(client: mqtt.Client, _userdata: Any, _flags: Any, reason_code: mqtt.ReasonCode, _properties: Any = None) -> None:
        if reason_code == 0:
            print(f"Connected to MQTT broker. Subscribed alert topic: {alert_topic}")
            client.subscribe(alert_topic, qos=qos)
        else:
            print(f"MQTT connection failed with code: {reason_code}")

    def on_message(_client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            append_alert_to_csv(output_csv, payload)
            print(
                f"Logged alert: anomaly={payload.get('is_anomaly')} "
                f"score={payload.get('anomaly_score')} topic={payload.get('topic')}"
            )
        except Exception as exc:
            print(f"Failed to log alert message: {exc}")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    if mqtt_cfg.get("username") and mqtt_cfg.get("password"):
        client.username_pw_set(mqtt_cfg["username"], mqtt_cfg["password"])

    tls_cfg = mqtt_cfg.get("tls", {})
    use_tls = bool(tls_cfg.get("enabled", False)) or int(mqtt_cfg.get("port", 1883)) == 8883
    if use_tls:
        ca_cert = tls_cfg.get("ca_cert", "")
        if ca_cert:
            client.tls_set(ca_certs=ca_cert, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
        else:
            client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
        client.tls_insecure_set(bool(tls_cfg.get("insecure", False)))

    client.on_connect = on_connect
    client.on_message = on_message
    return client


def main() -> None:
    args = parse_args()
    config = load_config(args.config)
    mqtt_cfg = config["realtime"]["mqtt"]

    client = create_client(config, args.output_csv)
    client.connect(mqtt_cfg["broker"], int(mqtt_cfg["port"]), int(mqtt_cfg.get("keepalive", 60)))
    client.loop_forever()


if __name__ == "__main__":
    main()
