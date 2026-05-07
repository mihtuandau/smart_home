from datetime import datetime
from pathlib import Path
import sys
from zoneinfo import ZoneInfo

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.models.predict import PowerInferenceService
from src.realtime.mqtt_consumer import resolve_event_timestamp


def test_resolve_event_timestamp_from_timestamp() -> None:
    payload = {"timestamp": "2026-05-06 15:23:32"}
    server_ts = datetime(2026, 5, 6, 9, 0, 0, tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
    event_ts, event_hour = resolve_event_timestamp(payload, "timestamp", server_ts)
    assert event_hour == 15
    assert "2026-05-06T15:23:32" in event_ts


def test_resolve_event_timestamp_from_time_alias() -> None:
    payload = {"time": "2026-05-06 08:11:00"}
    server_ts = datetime(2026, 5, 6, 9, 0, 0, tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
    event_ts, event_hour = resolve_event_timestamp(payload, "timestamp", server_ts)
    assert event_hour == 8
    assert "2026-05-06T08:11:00" in event_ts


def test_resolve_event_timestamp_fallback_server_time_when_missing() -> None:
    payload: dict[str, object] = {}
    server_ts = datetime(2026, 5, 6, 21, 45, 0, tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
    event_ts, event_hour = resolve_event_timestamp(payload, "timestamp", server_ts)
    assert event_hour == 21
    assert "2026-05-06T21:45:00" in event_ts


def test_resolve_event_timestamp_fallback_server_time_when_invalid() -> None:
    payload = {"timestamp": "not-a-time"}
    server_ts = datetime(2026, 5, 6, 7, 5, 0, tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
    event_ts, event_hour = resolve_event_timestamp(payload, "timestamp", server_ts)
    assert event_hour == 7
    assert "2026-05-06T07:05:00" in event_ts


def test_predict_one_reports_none_derived_hour_if_no_time() -> None:
    service = PowerInferenceService("configs/config.yaml")
    payload = {
        "temperature": 28,
        "humidity": 60,
        "pressure": 1005,
        "voltage": 220,
        "current_mA": 2.5,
        "power_mW": 550,
        "rain": False,
        "led1": False,
        "led2": False,
    }
    result = service.predict_one(payload)
    assert result["derived_hour"] is None
