from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a script from any directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import time
import argparse
import json
import ssl
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import csv
import paho.mqtt.client as mqtt
import pandas as pd
import yaml

from src.utils.logger import setup_logger
from src.models.predict import PowerInferenceService
from src.rules.advice_engine import generate_advice

logger = setup_logger("MQTT-Consumer")

def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def normalize_payload(payload: dict[str, Any], timestamp_col: str) -> dict[str, Any]:
    if timestamp_col not in payload:
        for alias in ("time", "datetime", "date", "created_at"):
            if alias in payload:
                payload[timestamp_col] = payload[alias]
                break
    return payload


def parse_payload_timestamp(value: Any) -> pd.Timestamp | None:
    ts = pd.to_datetime(value, errors="coerce")
    if pd.notna(ts):
        return ts
    try:
        num = float(value)
        if abs(num) >= 1e12:
            ts = pd.to_datetime(num, unit="ms", errors="coerce")
        else:
            ts = pd.to_datetime(num, unit="s", errors="coerce")
        if pd.notna(ts):
            return ts
    except Exception:
        pass
    return None


def resolve_event_timestamp(
    payload: dict[str, Any], timestamp_col: str, server_received_at: datetime
) -> tuple[str, int]:
    candidate = payload.get(timestamp_col)
    parsed = parse_payload_timestamp(candidate) if candidate is not None else None
    if parsed is None:
        for alias in ("time", "datetime", "date", "created_at"):
            if alias in payload:
                parsed = parse_payload_timestamp(payload.get(alias))
                if parsed is not None:
                    break
    if parsed is None:
        parsed = pd.Timestamp(server_received_at)
    
    if parsed.tzinfo is None:
        parsed = parsed.tz_localize(server_received_at.tzinfo)
    else:
        parsed = parsed.tz_convert(server_received_at.tzinfo)

    return parsed.isoformat(), int(parsed.hour)


def build_hourly_baseline(config: dict[str, Any]) -> dict[int, float]:
    processed_csv = config["paths"]["processed_csv"]
    baseline_cfg = config["rules"].get("baseline", {})
    min_mean = float(baseline_cfg.get("min_hourly_mean_mw", 0))

    try:
        if not Path(processed_csv).exists():
            logger.warning(f"Baseline CSV not found at {processed_csv}. Anomaly detection may be limited.")
            return {}
        
        df = pd.read_csv(processed_csv)
        if "hour" not in df.columns:
            timestamp_col = config["data"]["timestamp_col"]
            if timestamp_col in df.columns:
                ts = pd.to_datetime(df[timestamp_col], errors="coerce")
                df["hour"] = ts.dt.hour
        
        if "hour" not in df.columns or "power_mW" not in df.columns:
            return {}
            
        baseline_series = df.groupby("hour")["power_mW"].mean().clip(lower=min_mean)
        return {int(k): float(v) for k, v in baseline_series.to_dict().items()}
    except Exception as e:
        logger.error(f"Failed to build baseline: {e}")
        return {}


def append_realtime_event(config: dict[str, Any], payload: dict[str, Any]) -> None:
    out_path = Path(config["paths"].get("realtime_raw_csv", "data/raw/realtime_events.csv"))
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fields = config["data"]["required_columns"]
    row: dict[str, Any] = {}
    for col in fields:
        if col in payload:
            row[col] = payload[col]
        elif col == "timestamp" and "time" in payload:
            row[col] = payload["time"]
        else:
            row[col] = ""

    file_exists = out_path.exists()
    with out_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def create_mqtt_client(config: dict[str, Any], inference: PowerInferenceService) -> mqtt.Client:
    mqtt_cfg = config["realtime"]["mqtt"]
    topic = mqtt_cfg["topic"]
    alert_topic = mqtt_cfg.get("alert_topic", "esp32/alerts")
    qos = mqtt_cfg.get("qos", 1)
    timestamp_col = config["data"]["timestamp_col"]
    baseline_cfg = config["rules"].get("baseline", {})
    hourly_baseline = build_hourly_baseline(config)
    timezone_name = config.get("project", {}).get("timezone", "Asia/Ho_Chi_Minh")
    tz = ZoneInfo(timezone_name)

    def on_connect(client: mqtt.Client, _userdata: Any, _flags: Any, reason_code: mqtt.ReasonCode, _properties: Any = None) -> None:
        if reason_code == 0:
            logger.info(f"CONNECTED to MQTT broker. Subscribed: {topic}")
            client.subscribe(topic, qos=qos)
        else:
            logger.error(f"MQTT connection failed with code: {reason_code}")

    # State tracker for smart publishing
    last_published_data = {
        "analysis": "",
        "led1": None,
        "led2": None,
        "powerW": 0.0,
        "time": 0
    }

    def on_message(client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage) -> None:
        nonlocal last_published_data
        try:
            server_received_at = datetime.now(tz)
            payload = json.loads(msg.payload.decode("utf-8"))
            payload = normalize_payload(payload, timestamp_col)
            
            event_ts, event_hour = resolve_event_timestamp(payload, timestamp_col, server_received_at)
            payload[timestamp_col] = event_ts
            payload["hour"] = event_hour
            
            # Save raw data
            append_realtime_event(config, payload)
            
            # AI Inference
            result = inference.predict_one(payload)

            # Hourly baseline anomaly
            if baseline_cfg.get("enable_hourly_baseline", True):
                hour = int(payload["hour"]) if payload.get("hour") is not None else None
                power_mw = float(payload.get("power_mW", 0))
                multiplier = float(config["rules"]["power"].get("abnormal_multiplier_vs_hourly_mean", 1.5))
                if hour is not None:
                    hour_mean = hourly_baseline.get(hour)
                    if hour_mean is not None:
                        result["hourly_baseline_mean_mw"] = hour_mean
                        result["is_hourly_baseline_anomaly"] = power_mw > (hour_mean * multiplier)
                    else:
                        result["hourly_baseline_mean_mw"] = None
                        result["is_hourly_baseline_anomaly"] = False

            # Rule Engine
            advice = generate_advice(payload, result, config["rules"])

            # Standardizing output
            is_anomaly = result["is_anomaly"] or result.get("is_hourly_baseline_anomaly", False)
            has_alerts = len(advice["alerts"]) > 0
            
            analysis_text = " | ".join(advice["alerts"]) if advice["alerts"] else "Hệ thống đang hoạt động trong ngưỡng an toàn."
            current_power_w = round(float(payload.get("power_mW", 0)) / 1000, 3)
            current_led1 = payload.get("led1")
            current_led2 = payload.get("led2")
            now_ts = time.time()

            # Smart Publishing Logic:
            # Send if: analysis changed OR LEDs changed OR power changed > 5W OR heartbeat (60s)
            significant_power_change = abs(current_power_w - last_published_data["powerW"]) > 5.0
            content_changed = (analysis_text != last_published_data["analysis"] or 
                               current_led1 != last_published_data["led1"] or 
                               current_led2 != last_published_data["led2"])
            heartbeat = (now_ts - last_published_data["time"]) > 60

            if content_changed or significant_power_change or heartbeat:
                frontend_payload = {
                    "time": datetime.now(tz).isoformat(),
                    "severity": "high" if is_anomaly else ("medium" if has_alerts else "low"),
                    "status_text": "Phát hiện bất thường" if is_anomaly else ("Cảnh báo hệ thống" if has_alerts else "Hoạt động ổn định"),
                    "analysis": analysis_text,
                    "tips": advice["recommendations"],
                    "is_critical": is_anomaly,
                    "has_new_alert": is_anomaly or has_alerts,
                    "score": result["anomaly_score"],
                    "powerW": current_power_w,
                    "led1": current_led1,
                    "led2": current_led2,
                    "anomaly": "Phát hiện hành vi lạ" if is_anomaly else None,
                    "type": "alert" if (is_anomaly or has_alerts) else "status"
                }

                client.publish(alert_topic, json.dumps(frontend_payload, ensure_ascii=False), qos=qos)
                logger.info(f"Published update: {frontend_payload['status_text']} | Power: {current_power_w}W")
                
                # Update state
                last_published_data = {
                    "analysis": analysis_text,
                    "led1": current_led1,
                    "led2": current_led2,
                    "powerW": current_power_w,
                    "time": now_ts
                }
            
        except Exception as exc:
            logger.error(f"Failed to process message: {exc}")

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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Realtime MQTT consumer for power analytics.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        config = load_config(args.config)
        mqtt_cfg = config["realtime"]["mqtt"]

        logger.info(f"Starting AI Power Analytics Consumer (Broker: {mqtt_cfg['broker']})")
        
        inference = PowerInferenceService(args.config)
        client = create_mqtt_client(config, inference)
        client.connect(mqtt_cfg["broker"], int(mqtt_cfg["port"]), int(mqtt_cfg.get("keepalive", 60)))
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info("Service stopped by user.")
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")


if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()
