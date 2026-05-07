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
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from .data_integration import SensorDataReader, OpenMeteoAPIClient, DEFAULT_LAT, DEFAULT_LON
    from .feature_engineering import FeatureEngineering
except ImportError:
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
    'temperature_2m', 'relative_humidity_2m', 'surface_pressure',
    'precipitation',
    'temperature_850hPa', 'dew_point_850hPa', 'temperature_700hPa', 'dew_point_700hPa', 'temperature_500hPa', 'dew_point_500hPa',
    'wind_speed_10m', 'cloud_cover'
    # Note: wind_direction_10m loại bỏ vì không có trong dữ liệu gốc
    # Note: realtime dùng rain_mm sensor làm precipitation
]
STATIC_FEATURES = [
    'K_Index', 'Lifted_Index', 'Td_surface',
    'temp_dewpoint_spread', 'stability_index'
]

# Database configuration
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "smart_home")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "1234")


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

    # client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
    client = mqtt.Client()
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


def normalize_buffer_columns(df: pd.DataFrame) -> pd.DataFrame:
    df_copy = df.copy()

    if 'temp_surface' in df_copy.columns and 'temperature_2m' not in df_copy.columns:
        df_copy['temperature_2m'] = df_copy['temp_surface']
    if 'humidity_surface' in df_copy.columns and 'relative_humidity_2m' not in df_copy.columns:
        df_copy['relative_humidity_2m'] = df_copy['humidity_surface']
    if 'pressure_surface' in df_copy.columns and 'surface_pressure' not in df_copy.columns:
        df_copy['surface_pressure'] = df_copy['pressure_surface']

    if 'T_850' in df_copy.columns and 'temperature_850hPa' not in df_copy.columns:
        df_copy['temperature_850hPa'] = df_copy['T_850']
    if 'Td_850' in df_copy.columns and 'dew_point_850hPa' not in df_copy.columns:
        df_copy['dew_point_850hPa'] = df_copy['Td_850']
    if 'T_700' in df_copy.columns and 'temperature_700hPa' not in df_copy.columns:
        df_copy['temperature_700hPa'] = df_copy['T_700']
    if 'Td_700' in df_copy.columns and 'dew_point_700hPa' not in df_copy.columns:
        df_copy['dew_point_700hPa'] = df_copy['Td_700']
    if 'T_500' in df_copy.columns and 'temperature_500hPa' not in df_copy.columns:
        df_copy['temperature_500hPa'] = df_copy['T_500']
    if 'Td_500' in df_copy.columns and 'dew_point_500hPa' not in df_copy.columns:
        df_copy['dew_point_500hPa'] = df_copy['Td_500']

    if 'precipitation' not in df_copy.columns:
        if 'rain_mm' in df_copy.columns:
            df_copy['precipitation'] = df_copy['rain_mm'].astype(float)
        else:
            df_copy['precipitation'] = 0.0

    # Remove legacy columns that are no longer needed in normalized buffer
    legacy_columns = [
        'temp_surface', 'humidity_surface', 'pressure_surface',
        'T_850', 'Td_850', 'T_700', 'Td_700', 'T_500', 'Td_500',
        'wind_direction_10m'
    ]
    for col in legacy_columns:
        if col in df_copy.columns:
            df_copy.drop(columns=[col], inplace=True)

    return df_copy


def load_buffer() -> pd.DataFrame:
    if not BUFFER_FILE.exists():
        return pd.DataFrame()
    try:
        data = json.loads(BUFFER_FILE.read_text(encoding='utf-8'))
        df = pd.DataFrame(data)
        df = normalize_buffer_columns(df)
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    except Exception as e:
        logger.warning(f"Không thể đọc buffer: {e}")
        return pd.DataFrame()


def save_buffer(df: pd.DataFrame) -> None:
    try:
        df_copy = normalize_buffer_columns(df.copy())
        if 'timestamp' in df_copy.columns:
            df_copy['timestamp'] = df_copy['timestamp'].astype(str)
        BUFFER_FILE.write_text(json.dumps(df_copy.to_dict(orient='records'), ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        logger.warning(f"Không thể lưu buffer: {e}")


def build_integrated_record(sensor: Dict[str, Any], lat: float, lon: float) -> Optional[Dict[str, Any]]:
    try:
        # Fetch Open-Meteo data
        api_df = OpenMeteoAPIClient.fetch_open_meteo_data(latitude=lat, longitude=lon, hours=48)
        if api_df.empty:
            logger.error("Không lấy được dữ liệu Open-Meteo.")
            return None

        # --- PHẦN SỬA ĐỔI: CHUẨN HÓA VỀ GIỜ VIỆT NAM ---
        # 1. Chuyển dt của sensor sang giờ Việt Nam (GMT+7) và bỏ múi giờ để so sánh
        sensor_ts = pd.to_datetime(int(sensor['dt']), unit='s', utc=True) \
                      .tz_convert('Asia/Ho_Chi_Minh') \
                      .tz_localize(None)

        # 2. Đảm bảo API cũng là giờ địa phương và bỏ múi giờ
        api_df['timestamp'] = pd.to_datetime(api_df['timestamp']).dt.tz_localize(None)
        
        # 3. So khớp (Dữ liệu API lúc này sẽ khớp đúng khung giờ 16:00 - 17:00)
        api_df = api_df.sort_values('timestamp')
        idx = (api_df['timestamp'] - sensor_ts).abs().idxmin()
        api_row = api_df.loc[idx]
        # ----------------------------------------------

        record = {
            'dt': int(sensor['dt']),
            'timestamp': sensor_ts, # Lưu lại timestamp đã chuyển sang giờ VN
            'temperature_2m': float(sensor.get('temp_surface', sensor.get('temp', 0.0))),
            'relative_humidity_2m': float(sensor.get('humidity_surface', sensor.get('humidity', 0.0))),
            'surface_pressure': float(sensor.get('pressure_surface', sensor.get('pressure', 0.0))),
            'rain_mm': float(sensor.get('rain_mm', 0.0)),
            'precipitation': float(sensor.get('rain_mm', 0.0)),
            'temperature_850hPa': float(api_row['T_850']),
            'dew_point_850hPa': float(api_row['Td_850']),
            'temperature_700hPa': float(api_row['T_700']),
            'dew_point_700hPa': float(api_row['Td_700']),
            'temperature_500hPa': float(api_row['T_500']),
            'dew_point_500hPa': float(api_row['Td_500']),
            'wind_speed_10m': float(api_row['wind_speed_10m']),
            'cloud_cover': float(api_row['cloud_cover']),
        }
        return record
    except Exception as e:
        logger.error(f"Xây dựng record tích hợp thất bại: {e}")
        return None
# def build_integrated_record(sensor: Dict[str, Any], lat: float, lon: float) -> Optional[Dict[str, Any]]:
#     try:
#         # Fetch Open-Meteo data and match the nearest hour
#         api_df = OpenMeteoAPIClient.fetch_open_meteo_data(latitude=lat, longitude=lon, hours=48)
#         if api_df.empty:
#             logger.error("Không lấy được dữ liệu Open-Meteo.")
#             return None

#         sensor_ts = pd.to_datetime(int(sensor['dt']), unit='s', utc=True).tz_convert(None)
#         api_df['timestamp'] = pd.to_datetime(api_df['timestamp']).dt.tz_localize(None)
#         api_df = api_df.sort_values('timestamp')
#         idx = (api_df['timestamp'] - sensor_ts).abs().idxmin()
#         api_row = api_df.loc[idx]

#         record = {
#             'dt': int(sensor['dt']),
#             'timestamp': sensor_ts,
#             'temperature_2m': float(sensor.get('temp_surface', sensor.get('temp', 0.0))),
#             'relative_humidity_2m': float(sensor.get('humidity_surface', sensor.get('humidity', 0.0))),
#             'surface_pressure': float(sensor.get('pressure_surface', sensor.get('pressure', 0.0))),
#             'rain_mm': float(sensor.get('rain_mm', 0.0)),
#             'precipitation': float(sensor.get('rain_mm', 0.0)),
#             'temperature_850hPa': float(api_row['T_850']),
#             'dew_point_850hPa': float(api_row['Td_850']),
#             'temperature_700hPa': float(api_row['T_700']),
#             'dew_point_700hPa': float(api_row['Td_700']),
#             'temperature_500hPa': float(api_row['T_500']),
#             'dew_point_500hPa': float(api_row['Td_500']),
#             'wind_speed_10m': float(api_row['wind_speed_10m']),
#             'cloud_cover': float(api_row['cloud_cover']),
#         }
#         return record
#     except Exception as e:
#         logger.error(f"Xây dựng record tích hợp thất bại: {e}")
#         return None


def enrich_record(record: Dict[str, Any]) -> Dict[str, Any]:
    df = pd.DataFrame([record])
    df['Td_surface'] = df.apply(
        lambda row: FeatureEngineering.calculate_dew_point(row['temperature_2m'], row['relative_humidity_2m']),
        axis=1
    )
    df['K_Index'] = df.apply(
        lambda row: FeatureEngineering.calculate_k_index(
            row['temperature_850hPa'], row['temperature_500hPa'], row['dew_point_850hPa'], row['temperature_700hPa'], row['dew_point_700hPa']
        ),
        axis=1
    )
    df['Lifted_Index'] = df.apply(
        lambda row: FeatureEngineering.calculate_lifted_index(
            row['temperature_500hPa'], row['temperature_850hPa'], row['dew_point_850hPa']
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
    # 1. Tải buffer hiện tại lên
    buffer_df = load_buffer()
    
    # Chuyển đổi toàn bộ các cột đặc trưng sang float để tránh lỗi dtype int64
    numeric_cols = LSTM_FEATURES + STATIC_FEATURES
    for col in numeric_cols:
        if col in buffer_df.columns:
            buffer_df[col] = pd.to_numeric(buffer_df[col], errors='coerce').astype(float)
    
    row = enriched_record.copy()
    if 'precipitation' not in row:
        row['precipitation'] = float(row.get('rain_mm', 0.0))
    
    # Đảm bảo timestamp bản ghi mới là datetime
    current_ts = pd.to_datetime(row['timestamp'])
    row['timestamp'] = current_ts

    # 2. Logic Kiểm tra và Ghi đè
    if not buffer_df.empty:
        # Đảm bảo cột timestamp trong buffer cũng là datetime để so sánh
        buffer_df['timestamp'] = pd.to_datetime(buffer_df['timestamp'])
        
        last_index = buffer_df.index[-1]
        last_ts = buffer_df.loc[last_index, 'timestamp']
        
        # Kiểm tra cùng khung giờ
        if (current_ts.date() == last_ts.date() and current_ts.hour == last_ts.hour):
            # CÙNG GIỜ -> Ghi đè. 
            # Ép kiểu dữ liệu của record mới sang float cho các cột số
            for col in numeric_cols:
                if col in row:
                    row[col] = float(row[col])
            
            # Cập nhật từng giá trị để tránh xung đột dtype của cả dòng
            for col, val in row.items():
                buffer_df.at[last_index, col] = val
        else:
            # GIỜ MỚI -> Thêm dòng mới
            new_row_df = pd.DataFrame([row])
            buffer_df = pd.concat([buffer_df, new_row_df], ignore_index=True)
            logger.info(f"--- BẮT ĐẦU GIỜ MỚI: {current_ts.hour}h ---")
    else:
        buffer_df = pd.DataFrame([row])

    # 3. Chuẩn hóa và lưu lại
    buffer_df = normalize_buffer_columns(buffer_df)
    buffer_df = buffer_df.dropna(subset=LSTM_FEATURES).sort_values('timestamp').tail(72).reset_index(drop=True)
    
    save_buffer(buffer_df)
    return buffer_df
# def update_feature_buffer(enriched_record: Dict[str, Any]) -> pd.DataFrame:
#     buffer_df = load_buffer()
#     row = enriched_record.copy()
#     if 'precipitation' not in row:
#         row['precipitation'] = float(row.get('rain_mm', 0.0))
#     row['timestamp'] = pd.to_datetime(row['timestamp'])
#     buffer_df = pd.concat([buffer_df, pd.DataFrame([row])], ignore_index=True)
#     buffer_df = normalize_buffer_columns(buffer_df)
#     buffer_df = buffer_df.dropna(subset=LSTM_FEATURES).sort_values('timestamp').tail(72).reset_index(drop=True)
#     save_buffer(buffer_df)
#     return buffer_df


def _json_default(value: Any) -> str:
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat()
    return str(value)


def write_forecast_output(output_path: Path, forecast: Dict[str, Any]) -> None:
    output_path.write_text(
        json.dumps(forecast, ensure_ascii=False, indent=2, default=_json_default),
        encoding='utf-8'
    )

def run_once(sensor_file: Path, use_mqtt: bool, lat: float, lon: float, output_path: Path, model: tf.keras.Model) -> Optional[Dict[str, Any]]:
    # 1. Đọc dữ liệu sensor (đã sửa lỗi callback version nếu cần ở hàm read_sensor_input)
    sensor = read_sensor_input(sensor_file, use_mqtt=use_mqtt)
    if sensor is None:
        logger.error("Không có dữ liệu sensor hợp lệ để dự báo.")
        return None

    # 2. Tích hợp với Open-Meteo
    integrated = build_integrated_record(sensor, lat, lon)
    if integrated is None:
        return None

    # 3. Làm giàu dữ liệu (Feature Engineering)
    enriched = enrich_record(integrated)
    
    # 4. Cập nhật buffer (Sử dụng logic ghi đè theo giờ đã hướng dẫn ở trên)
    buffer_df = update_feature_buffer(enriched)

    forecast = {
        'generated_at': datetime.now().isoformat() + 'Z',
        'buffer_length': len(buffer_df),
        'latest_sample': enriched,
        'prediction': None,
        'status': 'waiting_for_buffer' if len(buffer_df) < SEQUENCE_LENGTH else 'ready'
    }

    # 5. Thực hiện dự báo nếu đủ 24 mẫu
    if len(buffer_df) >= SEQUENCE_LENGTH:
        # Chuyển đổi buffer thành chuỗi (sequence) cho LSTM
        sequence = build_sequence_from_buffer(buffer_df)
        
        if sequence is not None:
            # SỬ DỤNG 'model' ĐƯỢC TRUYỀN VÀO TỪ HÀM MAIN
            prob = predict_probability(model, sequence)
            
            forecast['prediction'] = {
                'next_hour_rain_probability': float(prob), # Ép kiểu float để JSON lưu được
                'interpretation': 'Giá trị gần đúng, dùng cho cảnh báo sớm.'
            }
            forecast['status'] = 'predicted'
            
            # Log kết quả ra màn hình cho dễ theo dõi
            p_percent = round(prob * 100, 2)
            logger.info(f"🎯 KẾT QUẢ DỰ BÁO: {p_percent}% - {'CÓ MƯA' if prob > 0.5 else 'KHÔNG MƯA'}")

    # 6. Xuất kết quả ra file
    write_forecast_output(output_path, forecast)
    logger.info(f"Đã lưu dự báo thời gian thực vào: {output_path}")
    
    # 7. Lưu vào Database (ai_forecasts)
    update_forecast_in_db(forecast)
    
    return forecast

def update_forecast_in_db(forecast: Dict[str, Any]) -> bool:
    """Cập nhật kết quả dự báo vào PostgreSQL theo chuẩn Prisma AiForecast"""
    if not forecast or 'prediction' not in forecast or not forecast['prediction']:
        return False
    try:
        conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS)
        cur = conn.cursor()
        prob = float(forecast['prediction']['next_hour_rain_probability'])
        timestamp_vn = forecast['latest_sample'].get('timestamp_vn', datetime.now())
        query = """
            INSERT INTO ai_forecasts (id, type, "rainProbability", "solarForecastW", recommendations, "forecastAt", "updatedAt", "createdAt")
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE 
            SET "rainProbability" = EXCLUDED."rainProbability", "forecastAt" = EXCLUDED."forecastAt", "updatedAt" = NOW();
        """
        recs = ['Dự báo tự động từ AI LSTM', f'Khả năng mưa: {round(prob*100, 1)}%']
        cur.execute(query, ('latest_forecast', 'rain_solar', prob, 0.0, recs, timestamp_vn))
        conn.commit()
        cur.close(); conn.close()
        logger.info("✓ Đã cập nhật dự báo vào bảng 'ai_forecasts' thành công!")
        return True
    except Exception as e:
        logger.error(f"❌ Lỗi cập nhật Database (ai_forecasts): {e}")
        return False
# def run_once(sensor_file: Path, use_mqtt: bool, lat: float, lon: float, output_path: Path) -> Optional[Dict[str, Any]]:
#     sensor = read_sensor_input(sensor_file, use_mqtt=use_mqtt)
#     if sensor is None:
#         logger.error("Không có dữ liệu sensor hợp lệ để dự báo.")
#         return None

#     integrated = build_integrated_record(sensor, lat, lon)
#     if integrated is None:
#         return None

#     enriched = enrich_record(integrated)
#     buffer_df = update_feature_buffer(enriched)

#     forecast = {
#         'generated_at': datetime.now().isoformat() + 'Z',
#         'buffer_length': len(buffer_df),
#         'latest_sample': enriched,
#         'prediction': None,
#         'status': 'waiting_for_buffer' if len(buffer_df) < SEQUENCE_LENGTH else 'ready'
#     }

#     if len(buffer_df) >= SEQUENCE_LENGTH:
#         # model = load_model()
#         sequence = build_sequence_from_buffer(buffer_df)
#         if sequence is not None:
#             prob = predict_probability(model, sequence)
#             forecast['prediction'] = {
#                 'next_hour_rain_probability': prob,
#                 'interpretation': 'Giá trị gần đúng, dùng cho cảnh báo sớm.'
#             }
#             forecast['status'] = 'predicted'

#     write_forecast_output(output_path, forecast)
#     logger.info(f"Đã lưu dự báo thời gian thực vào: {output_path}")
#     return forecast


def main() -> None:
    # --- ĐOẠN CODE THÊM VÀO ĐỂ TỰ ĐỘNG MỒI DỮ LIỆU ---
    import subprocess
    import sys
    import os
    
    logger.info("=" * 50)
    logger.info("KHỞI TẠO: Đang tự động chạy Seeding Buffer từ API...")
    try:
        # Đường dẫn tới script seeding
        seed_script = os.path.join("scripts", "seeding_forecast_buffer.py")
        
        # Thực thi script seeding
        subprocess.run([sys.executable, seed_script], check=True)
        logger.info("✓ Seeding hoàn tất! Dữ liệu 24h đã sẵn sàng.")
    except Exception as e:
        logger.warning(f"⚠️ Cảnh báo: Không thể seeding tự động ({e}).")
        logger.info("Hệ thống sẽ tiếp tục với dữ liệu hiện có trong buffer.")
    logger.info("=" * 50)
    # ------------------------------------------------
    # 1. NẠP MÔ HÌNH MỘT LẦN DUY NHẤT TẠI ĐÂY
    logger.info(f"Đang nạp mô hình AI vào RAM...")
    global_model = load_model()

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
                    # ĐÃ SỬA: Truyền global_model vào đây
                    run_once(Path(args.sensor_file), args.use_mqtt, args.lat, args.lon, Path(args.output_file), global_model)
                except Exception as exc:
                    logger.error(f"Lỗi khi dự báo: {exc}")
                time.sleep(args.interval)
    else:
        # ĐÃ SỬA: Truyền global_model vào đây
        forecast = run_once(Path(args.sensor_file), args.use_mqtt, args.lat, args.lon, Path(args.output_file), global_model)
        if forecast:
            logger.info("Kết quả dự báo:")
            logger.info(json.dumps(forecast, ensure_ascii=False, indent=2, default=_json_default))
    # if args.watch:
    #     logger.info(f"Chạy vòng lặp dự báo mỗi {args.interval} giây...")
    #     while True:
    #         try:
    #             run_once(Path(args.sensor_file), args.use_mqtt, args.lat, args.lon, Path(args.output_file))
    #         except Exception as exc:
    #             logger.error(f"Lỗi khi dự báo: {exc}")
    #         time.sleep(args.interval)
    # else:
    #     forecast = run_once(Path(args.sensor_file), args.use_mqtt, args.lat, args.lon, Path(args.output_file))
    #     if forecast:
    #         logger.info("Kết quả dự báo:")
    #         logger.info(json.dumps(forecast, ensure_ascii=False, indent=2, default=_json_default))


if __name__ == '__main__':
    main()
