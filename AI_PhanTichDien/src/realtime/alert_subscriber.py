import argparse
import csv
import json
import os
import ssl
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt
import yaml

# Allow running as a script from any directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def on_connect(client, userdata, flags, rc, properties=None):
    config = userdata["config"]
    topic = config["realtime"]["mqtt"].get("alert_topic", "esp32/alerts")
    if rc == 0:
        print(f"Connected to MQTT broker. Subscribed alert topic: {topic}")
        client.subscribe(topic)
    else:
        print(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    output_csv = userdata["output_csv"]
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        
        # Cấu trúc mới từ frontend_payload: analysis, tips, score, powerW, v.v.
        # Cấu trúc cũ: alerts, recommendations, anomaly_score, v.v.
        
        timestamp = payload.get("time", datetime.now().isoformat())
        topic = msg.topic
        
        # Lấy nội dung phân tích (từ trường 'analysis' mới hoặc 'alerts' cũ)
        analysis = payload.get("analysis", "")
        if not analysis and "alerts" in payload:
            alerts_list = payload["alerts"]
            analysis = " | ".join(alerts_list) if isinstance(alerts_list, list) else str(alerts_list)
            
        # Lấy lời khuyên (từ trường 'tips' mới hoặc 'recommendations' cũ)
        advice = ""
        tips = payload.get("tips", [])
        if tips:
            advice = " | ".join(tips) if isinstance(tips, list) else str(tips)
        elif "recommendations" in payload:
            recs = payload["recommendations"]
            advice = " | ".join(recs) if isinstance(recs, list) else str(recs)

        # Các thông số khác
        is_anomaly = payload.get("is_critical", payload.get("is_anomaly", False))
        score = payload.get("score", payload.get("anomaly_score", ""))
        power = payload.get("powerW", "")

        row = [timestamp, topic, power, is_anomaly, score, analysis, advice]

        file_exists = os.path.isfile(output_csv)
        with open(output_csv, mode="a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["timestamp", "topic", "powerW", "is_anomaly", "score", "analysis", "advice"])
            writer.writerow(row)
            
        print(f"Logged alert: {analysis[:50]}...")
    except Exception as e:
        print(f"Error processing alert message: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    parser.add_argument("--output_csv", type=str, default="logs/alerts_history.csv")
    args = parser.parse_args()

    config = load_config(args.config)
    mqtt_cfg = config["realtime"]["mqtt"]

    # Ensure logs directory exists
    os.makedirs(os.path.dirname(args.output_csv), exist_ok=True)

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.user_data_set({"config": config, "output_csv": args.output_csv})
    
    if mqtt_cfg.get("username") and mqtt_cfg.get("password"):
        client.username_pw_set(mqtt_cfg["username"], mqtt_cfg["password"])

    tls_cfg = mqtt_cfg.get("tls", {})
    use_tls = bool(tls_cfg.get("enabled", False)) or int(mqtt_cfg.get("port", 1883)) == 8883
    if use_tls:
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
        client.tls_insecure_set(bool(tls_cfg.get("insecure", False)))

    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(mqtt_cfg["broker"], int(mqtt_cfg["port"]), 60)
    client.loop_forever()

if __name__ == "__main__":
    main()
