from __future__ import annotations

from typing import Any


def _add_unique(items: list[str], text: str) -> None:
    if text not in items:
        items.append(text)


def generate_advice(
    payload: dict[str, Any],
    inference_result: dict[str, Any],
    rules_cfg: dict[str, Any],
) -> dict[str, Any]:
    alerts: list[str] = []
    recommendations: list[str] = []

    hour_raw = payload.get("hour")
    hour = int(hour_raw) if hour_raw is not None and str(hour_raw).strip() != "" else None
    power_mw = float(payload.get("power_mW", 0))
    current_ma = float(payload.get("current_mA", 0))
    voltage = float(payload.get("voltage", 0))
    temperature = float(payload.get("temperature", 0))
    humidity = float(payload.get("humidity", 0))
    rain = bool(payload.get("rain", False))
    led1 = bool(payload.get("led1", False))
    led2 = bool(payload.get("led2", False))

    day_cfg = rules_cfg["daytime"]
    env_cfg = rules_cfg.get("environment", {})
    power_cfg = rules_cfg["power"]
    alert_cfg = rules_cfg["alerts"]

    is_daytime = hour is not None and day_cfg["start_hour"] <= hour <= day_cfg["end_hour"]
    is_late_night = hour is not None and (hour >= 22 or hour <= 5)

    # 1. Lights on in daylight (if not raining) or late night
    if alert_cfg.get("led_on_in_daylight", True):
        leds_on = [led1, led2].count(True)
        if leds_on > 0:
            if is_daytime and not rain:
                msg = "Đang bật đèn vào ban ngày (trời nắng)."
                _add_unique(alerts, msg)
                _add_unique(recommendations, "Nên tận dụng ánh sáng tự nhiên để tiết kiệm điện.")
            elif is_daytime and rain:
                _add_unique(recommendations, "Trời mưa và thiếu sáng, có thể bật đèn để sinh hoạt.")
            elif is_late_night:
                _add_unique(recommendations, "Gợi ý ban đêm: Ưu tiên dùng ít đèn để tiết kiệm và bảo vệ tuổi thọ thiết bị.")
                if leds_on == 2:
                    _add_unique(alerts, "Đang sử dụng nhiều đèn vào khung giờ đêm muộn.")

    # 2. Power & Current Analysis
    is_baseline_anomaly = alert_cfg.get("hourly_baseline_anomaly", True) and bool(inference_result.get("is_hourly_baseline_anomaly", False))
    # Debug so sánh ngưỡng
    print(f"[DEBUG] Power: {power_mw}mW / Limit: {power_cfg['high_power_mw_threshold']}mW | Current: {current_ma}mA / Limit: {power_cfg.get('high_current_ma_threshold')}mA")

    is_high_power = alert_cfg.get("high_power_anomaly", True) and (power_mw > float(power_cfg["high_power_mw_threshold"]))
    is_high_current = current_ma > float(power_cfg.get("high_current_ma_threshold", 999999))

    # Cảnh báo Vượt ngưỡng (Threshold)
    if is_high_power or is_high_current:
        _add_unique(alerts, "Công suất tiêu thụ cao vượt ngưỡng cài đặt.")
        _add_unique(recommendations, "Kiểm tra các thiết bị đang hoạt động đồng thời và tắt tải không cần thiết.")

    # Cảnh báo Bất thường theo giờ (Baseline)
    if is_baseline_anomaly:
        _add_unique(alerts, "Công suất hiện tại cao bất thường so với thói quen sử dụng.")
        baseline_w = float(inference_result.get("hourly_baseline_mean_mw", 0)) / 1000
        hour_text = str(hour) if hour is not None else "này"
        _add_unique(recommendations, f"Mọi khi tầm {hour_text}h bạn chỉ dùng khoảng {baseline_w:.1f}W. Hãy kiểm tra các thiết bị tải lớn.")

    # 3. Environment & Other rules
    if temperature >= float(env_cfg.get("high_temperature_threshold_c", 999)):
        _add_unique(alerts, "Nhiệt độ môi trường cao, nguy cơ làm tăng tải thiết bị làm mát.")
    
    if rain:
        _add_unique(alerts, "Hệ thống ghi nhận trời đang mưa.")
        _add_unique(recommendations, "Kiểm tra cửa sổ và các thiết bị điện ngoài trời để đảm bảo an toàn.")

    # 4. ML Model Anomaly
    if inference_result.get("is_anomaly", False):
        _add_unique(alerts, "Hành vi sử dụng điện lạ được phát hiện bởi mô hình AI.")
        _add_unique(recommendations, "Kiểm tra xem có thiết bị nào đang hoạt động bất thường hoặc rò rỉ điện không.")

    return {
        "alerts": alerts,
        "recommendations": recommendations if alert_cfg.get("include_recommendation", True) else [],
    }
