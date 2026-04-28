#!/usr/bin/env python3
"""
BƯỚC 5: TRIỂN KHAI DỰ BÁO THỜI GIAN THỰC

Cấu trúc:
- Nhận dữ liệu cảm biến MQTT hoặc file mẫu.
- Làm giàu dữ liệu bằng Open-Meteo và kỹ thuật đặc trưng bước 2.
- Duy trì buffer thời gian thực.
- Dự báo xác suất mưa giờ kế tiếp bằng mô hình LSTM đã huấn luyện.
- Xuất kết quả vào results/current_forecast.json.
"""

import argparse
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import paho.mqtt.client as mqtt
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from dotenv import load_dotenv

from data_integration import SensorDataReader, OpenMeteoAPIClient, DEFAULT_LAT, DEFAULT_LON
from feature_engineering import FeatureEngineering

# Load environment variables from .env if present
load_dotenv()

# ========== CẤU HÌNH ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BUFFER_FILE = Path("results/forecast_buffer.json")
OUTPUT_FILE = Path("results/current_forecast.json")
MODEL_PATH = Path("models/hybrid_rain_forecast_model/lstm_model.h5")
SENSOR_CACHE_FILE = Path("mqtt_sensor_cache.json")
MQTT_BROKER = os.environ.get("MQTT_BROKER", "nfa1412a.ala.asia-southeast1.emqxsl.com")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "8883"))
MQTT_TOPIC = os.environ.get("MQTT_TOPIC", "TN/IOT/smarthome/tt")
MQTT_USER = os.environ.get("MQTT_USER")
MQTT_PASS = os.environ.get("MQTT_PASS")

SEQUENCE_LENGTH = 24
LSTM_FEATURES = [
    'temp_surface', 'humidity_surface', 'pressure_surface',
    'T_850', 'Td_850', 'T_700', 'Td_700', 'T_500', 'Td_500',
    'wind_speed_10m', 'wind_direction_10m', 'cloud_cover'
]
STATIC_FEATURES = [
    'K_Index', 'Lifted_Index', 'Td_surface',
    'temp_dewpoint_spread', 'stability_index'
]


def clamp(value: float, min_value: float = 0.0, max_value: float = 1.0) -> float:
    return max(min_value, min(max_value, value))


def normalize_mqtt_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    record = SensorDataReader.process_mqtt_payload(payload)
    # Thêm timestamp field từ dt
    if 'dt' in record:
        from datetime import datetime
        record['timestamp'] = datetime.fromtimestamp(record['dt']).isoformat()
    return record


def read_sensor_input(sensor_file: Path, use_mqtt: bool = False) -> Optional[Dict[str, Any]]:
    if use_mqtt:
        logger.info("Lấy dữ liệu sensor trực tiếp từ MQTT...")
        result = get_latest_mqtt_message(timeout_seconds=30)  # Tăng timeout lên 30 giây
        if result is not None:
            logger.info(f"MQTT data timestamp: {result.get('timestamp', 'N/A')}")
            return result

        # Fallback to cache if MQTT fails
        logger.warning("Không lấy được dữ liệu MQTT, thử dùng cache...")
        cache_data = load_mqtt_cache()
        if cache_data and cache_data.get('timestamp'):
            logger.info(f"Using cached MQTT data: {cache_data.get('timestamp', 'N/A')}")
            return cache_data
        else:
            logger.warning("Cache không hợp lệ hoặc không có timestamp")

        # Fallback to simulated real-time data
        logger.warning("Tạo dữ liệu simulated real-time...")
        simulated_data = create_simulated_realtime_data()
        if simulated_data:
            logger.info(f"Using simulated real-time data: {simulated_data.get('timestamp', 'N/A')}")
            return simulated_data

    if not sensor_file.exists():
        logger.error(f"File sensor không tồn tại: {sensor_file}")
        return None

    try:
        with open(sensor_file, 'r', encoding='utf-8') as f:
            payload = json.load(f)
        if isinstance(payload, dict) and payload:
            record = normalize_mqtt_payload(payload)
            logger.info(f"Using sample file data: {record.get('timestamp', 'N/A')}")
            return record
    except Exception as e:
        logger.error(f"Lỗi đọc file sensor: {e}")
    return None


def create_simulated_realtime_data() -> Optional[Dict[str, Any]]:
    """Tạo dữ liệu sensor simulated với timestamp hiện tại"""
    try:
        # Dùng data mẫu làm base
        sample_file = Path("data/sample_mqtt_payload.json")
        if not sample_file.exists():
            return None

        with open(sample_file, 'r', encoding='utf-8') as f:
            payload = json.load(f)

        # Cập nhật timestamp thành hiện tại
        current_time = datetime.utcnow()
        payload['dt'] = int(current_time.timestamp())

        # Thêm một chút noise để giả lập data realtime
        import random
        if 'temp' in payload:
            payload['temp'] += random.uniform(-0.5, 0.5)  # ±0.5°C
        if 'humidity' in payload:
            payload['humidity'] += random.uniform(-2, 2)   # ±2%
        if 'pressure' in payload:
            payload['pressure'] += random.uniform(-1, 1)   # ±1 hPa

        record = normalize_mqtt_payload(payload)
        return record

    except Exception as e:
        logger.error(f"Lỗi tạo simulated data: {e}")
        return None


def get_latest_mqtt_message(timeout_seconds: int = 30) -> Optional[Dict[str, Any]]:
    """Lấy message MQTT mới nhất với timeout dài hơn"""
    latest: Optional[Dict[str, Any]] = None
    updated = False
    message_count = 0

    def on_message(client, userdata, message):
        nonlocal latest, updated, message_count
        try:
            payload = json.loads(message.payload.decode('utf-8'))
            latest = normalize_mqtt_payload(payload)
            updated = True
            message_count += 1
            logger.info(f"Nhận được MQTT message #{message_count}: timestamp={latest.get('timestamp', 'N/A')}")
            # Disconnect after receiving first message
            client.disconnect()
        except Exception as e:
            logger.error(f"Lỗi parse MQTT message: {e}")

    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
    if MQTT_USER and MQTT_PASS:
        client.username_pw_set(MQTT_USER, MQTT_PASS)
    if MQTT_PORT == 8883:
        client.tls_set()

    try:
        logger.info(f"Kết nối MQTT: {MQTT_BROKER}:{MQTT_PORT}, topic: {MQTT_TOPIC}")
        client.connect(MQTT_BROKER, MQTT_PORT, 10)
        client.subscribe(MQTT_TOPIC)
        client.on_message = on_message
        client.loop_start()

        start = time.time()
        while not updated and time.time() - start < timeout_seconds:
            time.sleep(0.1)

        client.loop_stop()
        client.disconnect()

        if latest is not None:
            logger.info(f"Đã nhận được MQTT message mới nhất")
            return latest
        else:
            logger.warning(f"Không nhận được MQTT message nào trong {timeout_seconds} giây")

    except Exception as exc:
        logger.error(f"MQTT connection failed: {exc}")

    return None
    """Tạo dữ liệu sensor simulated với timestamp hiện tại"""
    try:
        # Dùng data mẫu làm base
        sample_file = Path("data/sample_mqtt_payload.json")
        if not sample_file.exists():
            return None

        with open(sample_file, 'r', encoding='utf-8') as f:
            payload = json.load(f)

        # Cập nhật timestamp thành hiện tại
        current_time = datetime.utcnow()
        payload['dt'] = int(current_time.timestamp())

        # Thêm một chút noise để giả lập data realtime
        import random
        if 'temp' in payload:
            payload['temp'] += random.uniform(-0.5, 0.5)  # ±0.5°C
        if 'humidity' in payload:
            payload['humidity'] += random.uniform(-2, 2)   # ±2%
        if 'pressure' in payload:
            payload['pressure'] += random.uniform(-1, 1)   # ±1 hPa

        record = normalize_mqtt_payload(payload)
        return record

    except Exception as e:
        logger.error(f"Lỗi tạo simulated data: {e}")
        return None
    """Lấy message MQTT mới nhất với timeout dài hơn"""
    latest: Optional[Dict[str, Any]] = None
    updated = False
    message_count = 0

    def on_message(client, userdata, message):
        nonlocal latest, updated, message_count
        try:
            payload = json.loads(message.payload.decode('utf-8'))
            latest = normalize_mqtt_payload(payload)
            updated = True
            message_count += 1
            logger.info(f"Nhận được MQTT message #{message_count}: timestamp={latest.get('timestamp', 'N/A')}")
            # Disconnect after receiving first message
            client.disconnect()
        except Exception as e:
            logger.error(f"Lỗi parse MQTT message: {e}")

    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
    if MQTT_USER and MQTT_PASS:
        client.username_pw_set(MQTT_USER, MQTT_PASS)
    if MQTT_PORT == 8883:
        client.tls_set()

    try:
        logger.info(f"Kết nối MQTT: {MQTT_BROKER}:{MQTT_PORT}, topic: {MQTT_TOPIC}")
        client.connect(MQTT_BROKER, MQTT_PORT, 10)
        client.subscribe(MQTT_TOPIC)
        client.on_message = on_message
        client.loop_start()

        start = time.time()
        while not updated and time.time() - start < timeout_seconds:
            time.sleep(0.1)

        client.loop_stop()
        client.disconnect()

        if latest is not None:
            logger.info(f"Đã nhận được MQTT message mới nhất")
            return latest
        else:
            logger.warning(f"Không nhận được MQTT message nào trong {timeout_seconds} giây")

    except Exception as exc:
        logger.error(f"MQTT connection failed: {exc}")

    return None

    cached = load_mqtt_cache()
    if cached:
        logger.info("Sử dụng dữ liệu sensor cache MQTT.")
    return cached


def save_mqtt_cache(data: Dict[str, Any]) -> None:
    try:
        SENSOR_CACHE_FILE.write_text(json.dumps({
            "timestamp": time.time(),
            "sensor": data
        }, ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        logger.warning(f"Lỗi lưu MQTT cache: {e}")


def load_mqtt_cache() -> Optional[Dict[str, Any]]:
    if not SENSOR_CACHE_FILE.exists():
        return None
    try:
        raw = json.loads(SENSOR_CACHE_FILE.read_text(encoding='utf-8'))
        return raw.get('sensor')
    except Exception:
        return None


def load_buffer() -> pd.DataFrame:
    if not BUFFER_FILE.exists():
        return pd.DataFrame()
    try:
        data = json.loads(BUFFER_FILE.read_text(encoding='utf-8'))
        df = pd.DataFrame(data)
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    except Exception as e:
        logger.warning(f"Không thể đọc buffer: {e}")
        return pd.DataFrame()


def save_buffer(df: pd.DataFrame) -> None:
    try:
        df_copy = df.copy()
        if 'timestamp' in df_copy.columns:
            df_copy['timestamp'] = df_copy['timestamp'].astype(str)
        BUFFER_FILE.write_text(json.dumps(df_copy.to_dict(orient='records'), ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        logger.warning(f"Không thể lưu buffer: {e}")


def build_integrated_record(sensor: Dict[str, Any], lat: float, lon: float) -> Optional[Dict[str, Any]]:
    try:
        # Fetch Open-Meteo data and match the nearest hour
        api_df = OpenMeteoAPIClient.fetch_open_meteo_data(latitude=lat, longitude=lon, hours=48)
        if api_df.empty:
            logger.error("Không lấy được dữ liệu Open-Meteo.")
            return None

        sensor_ts = pd.to_datetime(int(sensor['dt']), unit='s', utc=True).tz_convert(None)
        api_df['timestamp'] = pd.to_datetime(api_df['timestamp']).dt.tz_localize(None)
        api_df = api_df.sort_values('timestamp')
        idx = (api_df['timestamp'] - sensor_ts).abs().idxmin()
        api_row = api_df.loc[idx]

        record = {
            'dt': int(sensor['dt']),
            'timestamp': sensor_ts,
            'temp_surface': float(sensor.get('temp_surface', sensor.get('temp', 0.0))),
            'humidity_surface': float(sensor.get('humidity_surface', sensor.get('humidity', 0.0))),
            'pressure_surface': float(sensor.get('pressure_surface', sensor.get('pressure', 0.0))),
            'rain_mm': float(sensor.get('rain_mm', 0.0)),
            'T_850': float(api_row['T_850']),
            'Td_850': float(api_row['Td_850']),
            'T_700': float(api_row['T_700']),
            'Td_700': float(api_row['Td_700']),
            'T_500': float(api_row['T_500']),
            'Td_500': float(api_row['Td_500']),
            'wind_speed_10m': float(api_row['wind_speed_10m']),
            'wind_direction_10m': float(api_row['wind_direction_10m']),
            'cloud_cover': float(api_row['cloud_cover']),
        }
        return record
    except Exception as e:
        logger.error(f"Xây dựng record tích hợp thất bại: {e}")
        return None


def enrich_record(record: Dict[str, Any]) -> Dict[str, Any]:
    df = pd.DataFrame([record])
    df['Td_surface'] = df.apply(
        lambda row: FeatureEngineering.calculate_dew_point(row['temp_surface'], row['humidity_surface']),
        axis=1
    )
    df['K_Index'] = df.apply(
        lambda row: FeatureEngineering.calculate_k_index(
            row['T_850'], row['T_500'], row['Td_850'], row['T_700'], row['Td_700']
        ),
        axis=1
    )
    df['Lifted_Index'] = df.apply(
        lambda row: FeatureEngineering.calculate_lifted_index(
            row['T_500'], row['T_850'], row['Td_850']
        ),
        axis=1
    )
    df = FeatureEngineering.calculate_additional_features(df)

    enriched = df.iloc[0].to_dict()
    return enriched


def model_available() -> bool:
    return MODEL_PATH.exists()


def load_model() -> tf.keras.Model:
    if not model_available():
        raise FileNotFoundError(f"Không tìm thấy mô hình đã huấn luyện: {MODEL_PATH}")
    return tf.keras.models.load_model(MODEL_PATH, compile=False)


def build_sequence_from_buffer(df: pd.DataFrame) -> Optional[np.ndarray]:
    if len(df) < SEQUENCE_LENGTH:
        return None
    seq_df = df.sort_values('timestamp').tail(SEQUENCE_LENGTH)
    X = seq_df[LSTM_FEATURES].astype(float).values
    return X.reshape(1, SEQUENCE_LENGTH, len(LSTM_FEATURES))


def scale_sequence(X: np.ndarray) -> np.ndarray:
    scaler = MinMaxScaler(feature_range=(-1, 1))
    shape = X.shape
    data_flat = X.reshape(-1, shape[-1])
    scaled = scaler.fit_transform(data_flat)
    return scaled.reshape(shape)


def predict_probability(model: tf.keras.Model, sequence: np.ndarray) -> float:
    seq_scaled = scale_sequence(sequence)
    pred = model.predict(seq_scaled, verbose=0).flatten()
    return clamp(float(pred[0]))


def update_feature_buffer(enriched_record: Dict[str, Any]) -> pd.DataFrame:
    buffer_df = load_buffer()
    row = enriched_record.copy()
    row['timestamp'] = pd.to_datetime(row['timestamp'])
    buffer_df = pd.concat([buffer_df, pd.DataFrame([row])], ignore_index=True)
    buffer_df = buffer_df.sort_values('timestamp').tail(72).reset_index(drop=True)
    save_buffer(buffer_df)
    return buffer_df


def _json_default(value: Any) -> str:
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat()
    return str(value)


def write_forecast_output(output_path: Path, forecast: Dict[str, Any]) -> None:
    output_path.write_text(
        json.dumps(forecast, ensure_ascii=False, indent=2, default=_json_default),
        encoding='utf-8'
    )


def run_once(sensor_file: Path, use_mqtt: bool, lat: float, lon: float, output_path: Path) -> Optional[Dict[str, Any]]:
    sensor = read_sensor_input(sensor_file, use_mqtt=use_mqtt)
    if sensor is None:
        logger.error("Không có dữ liệu sensor hợp lệ để dự báo.")
        return None

    integrated = build_integrated_record(sensor, lat, lon)
    if integrated is None:
        return None

    enriched = enrich_record(integrated)
    buffer_df = update_feature_buffer(enriched)

    forecast = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'buffer_length': len(buffer_df),
        'latest_sample': enriched,
        'prediction': None,
        'status': 'waiting_for_buffer' if len(buffer_df) < SEQUENCE_LENGTH else 'ready'
    }

    if len(buffer_df) >= SEQUENCE_LENGTH:
        model = load_model()
        sequence = build_sequence_from_buffer(buffer_df)
        if sequence is not None:
            prob = predict_probability(model, sequence)
            forecast['prediction'] = {
                'next_hour_rain_probability': prob,
                'interpretation': 'Giá trị gần đúng, dùng cho cảnh báo sớm.'
            }
            forecast['status'] = 'predicted'

    write_forecast_output(output_path, forecast)
    logger.info(f"Đã lưu dự báo thời gian thực vào file: {output_path}")
    
    # --- SAVE TO DATABASE ---
    try:
        import psycopg2
        from psycopg2 import sql
        
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            logger.warning("DATABASE_URL không tồn tại trong .env, bỏ qua lưu DB.")
            return forecast
            
        # Sửa lại URL cho phù hợp với Python (psycopg2 cần postgresql://)
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        # Kết nối và lưu
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Chuyển đổi recommendations list thành array cho SQL
        # Lấy recommendations an toàn kể cả khi prediction là None
        prediction_data = forecast.get('prediction') or {}
        recs = prediction_data.get('recommendations', ["Giá trị gần đúng, dùng cho cảnh báo sớm."])
        
        insert_query = """
        INSERT INTO ai_forecasts (id, type, "rainProbability", "solarForecastW", recommendations, "forecastAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO UPDATE SET
            "rainProbability" = EXCLUDED."rainProbability",
            "solarForecastW" = EXCLUDED."solarForecastW",
            recommendations = EXCLUDED.recommendations,
            "forecastAt" = EXCLUDED."forecastAt",
            "updatedAt" = NOW();
        """
        
        # Dùng ID cố định cho bản ghi "mới nhất" hoặc tạo ID mới
        # Ở đây ta dùng ID cố định là 'latest' để dễ truy vấn, 
        # hoặc bạn có thể tạo CUID/UUID nếu muốn lưu lịch sử.
        forecast_id = 'latest_forecast'
        
        cur.execute(insert_query, (
            forecast_id,
            'rain_solar',
            prediction_data.get('next_hour_rain_probability', 0.0),
            0.0, # solarForecastW (cập nhật sau if có)
            recs,
            datetime.utcnow()
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Đã cập nhật dự báo vào Database thành công!")
        
    except ImportError:
        logger.warning("Chưa cài psycopg2-binary, không thể lưu vào DB. Hãy chạy 'pip install psycopg2-binary'")
    except Exception as e:
        logger.error(f"Lỗi khi lưu vào Database: {e}")

    return forecast


def main() -> None:
    parser = argparse.ArgumentParser(description='Bước 5: Triển khai dự báo thời gian thực')
    parser.add_argument('--sensor-file', default='data/sample_mqtt_payload.json', help='File mẫu sensor JSON nếu không dùng MQTT')
    parser.add_argument('--use-mqtt', action='store_true', help='Lấy dữ liệu cảm biến trực tiếp từ MQTT topic')
    parser.add_argument('--lat', type=float, default=DEFAULT_LAT, help='Vĩ độ vị trí')
    parser.add_argument('--lon', type=float, default=DEFAULT_LON, help='Kinh độ vị trí')
    parser.add_argument('--output-file', default=str(OUTPUT_FILE), help='File lưu kết quả dự báo thời gian thực')
    parser.add_argument('--interval', type=int, default=300, help='Khoảng thời gian lặp lại (giây) khi dùng --watch')
    parser.add_argument('--watch', action='store_true', help='Chạy liên tục theo interval')
    args = parser.parse_args()

    logger.info("BƯỚC 5: TRIỂN KHAI DỰ BÁO THỜI GIAN THỰC")
    logger.info(f"MQTT topic: {MQTT_TOPIC} | MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
    logger.info(f"Mô hình LSTM: {MODEL_PATH}")

    if args.watch:
        logger.info(f"Chạy vòng lặp dự báo mỗi {args.interval} giây...")
        while True:
            try:
                run_once(Path(args.sensor_file), args.use_mqtt, args.lat, args.lon, Path(args.output_file))
            except Exception as exc:
                logger.error(f"Lỗi khi dự báo: {exc}")
            time.sleep(args.interval)
    else:
        forecast = run_once(Path(args.sensor_file), args.use_mqtt, args.lat, args.lon, Path(args.output_file))
        if forecast:
            logger.info("Kết quả dự báo:")
            logger.info(json.dumps(forecast, ensure_ascii=False, indent=2, default=_json_default))


if __name__ == '__main__':
    main()
