#!/usr/bin/env python3
"""
BƯỚC 1: Thu thập và Tích hợp dữ liệu (Data Integration)

Tích hợp hai nguồn dữ liệu:
1. Dữ liệu cảm biến tại chỗ (Local Sensors): Nhiệt độ, Độ ẩm, Áp suất bề mặt
2. Dữ liệu API Open-Meteo: Dữ liệu tầng cao (850hPa, 700hPa, 500hPa), tốc độ gió, độ bao phủ mây

Output: DataFrame tích hợp dữ liệu từ hai nguồn dựa trên thời gian thực
"""

import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
import logging
import time

# ========== CẤU HÌNH ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tọa độ mặc định (Thành phố Biên Hòa, Việt Nam)
DEFAULT_LAT = 10.95
DEFAULT_LON = 106.82

# Open-Meteo API - Không cần API key
# URL gốc: https://api.open-meteo.com/v1/forecast?latitude=10.95&longitude=106.82&hourly=...
OPENMETEO_API_URL = "https://api.open-meteo.com/v1/forecast"

# File dữ liệu
SENSOR_DATA_FILE = Path("sensor_data_sample.json")
SENSOR_DATA_CSV = Path("data/sensor_data_30days.csv")  # CSV từ sensor device
WEATHER_API_CSV = Path("data/processed/weather_data_for_ai.csv")  # CSV từ Open-Meteo API (có precipitation)
INTEGRATED_DATA_FILE = Path("data/processed/integrated_sensor_openmeteo_data.json")


class SensorDataReader:
    """Đọc dữ liệu từ cảm biến tại chỗ"""
    
    @staticmethod
    def process_mqtt_payload(mqtt_payload: Dict) -> Dict:
        """
        Xử lý payload MQTT từ mô hình thực tế
        
        Payload MQTT:
        {
          "temperature": 25.9,
          "humidity": 49.01,
          "pressure": 1006.65,
          "voltage": 3.76,
          "current_mA": 111.2,
          "power_mW": 440,
          "rain": false,
          "led1": false,
          "led2": false
        }
        
        Args:
            mqtt_payload: Dictionary từ MQTT
            
        Returns:
            Dictionary đã chuẩn hóa
        """
        try:
            # Mapping tên trường
            standardized = {
                'dt': int(time.time()),  # Unix timestamp hiện tại
                'temp': mqtt_payload.get('temperature', 0),
                'humidity': mqtt_payload.get('humidity', 0),
                'pressure': mqtt_payload.get('pressure', 0),
                'rain_mm': 0.0 if not mqtt_payload.get('rain', False) else 1.0,  # Chuyển boolean -> float
            }
            
            # Thêm các trường bổ sung (có thể dùng làm đặc trưng)
            standardized.update({
                'voltage': mqtt_payload.get('voltage', 0),
                'current_mA': mqtt_payload.get('current_mA', 0),
                'power_mW': mqtt_payload.get('power_mW', 0),
                'led1': mqtt_payload.get('led1', False),
                'led2': mqtt_payload.get('led2', False),
            })
            
            return standardized
            
        except Exception as e:
            logger.error(f"Lỗi xử lý payload MQTT: {e}")
            return {}
    
    @staticmethod
    def read_mqtt_payload(file_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Đọc và xử lý payload MQTT từ file JSON
        
        Args:
            file_path: Đường dẫn đến file payload MQTT (mặc định: sensor_payload_mqtt.json)
            
        Returns:
            DataFrame với dữ liệu đã chuẩn hóa
        """
        if file_path is None:
            file_path = Path("sensor_payload_mqtt.json")
            
        if not file_path.exists():
            logger.warning(f"File MQTT payload không tồn tại: {file_path}")
            return pd.DataFrame()
        
        try:
            logger.info(f"Đang đọc payload MQTT từ: {file_path}")
            
            # Đọc file JSON
            with open(file_path, 'r', encoding='utf-8') as f:
                mqtt_payload = json.load(f)
            
            # Xử lý payload MQTT
            standardized = SensorDataReader.process_mqtt_payload(mqtt_payload)
            
            # Chuyển thành DataFrame
            df = pd.DataFrame([standardized])
            
            # Chuyển đổi timestamp Unix sang datetime
            df['timestamp'] = pd.to_datetime(df['dt'], unit='s', utc=True)
            
            # Đổi tên cột cho rõ ràng
            df = df.rename(columns={
                'temp': 'temp_surface',
                'humidity': 'humidity_surface',
                'pressure': 'pressure_surface'
            })
            
            # Giữ lại các cột cần thiết
            df = df[['dt', 'timestamp', 'temp_surface', 'humidity_surface', 'pressure_surface', 'rain_mm',
                     'voltage', 'current_mA', 'power_mW', 'led1', 'led2']]
            
            logger.info(f"✓ Đã xử lý payload MQTT: {len(df)} bản ghi")
            logger.info(f"  Nhiệt độ: {df['temp_surface'].iloc[0]}°C")
            logger.info(f"  Độ ẩm: {df['humidity_surface'].iloc[0]}%")
            logger.info(f"  Áp suất: {df['pressure_surface'].iloc[0]} hPa")
            logger.info(f"  Mưa: {'Có' if df['rain_mm'].iloc[0] > 0 else 'Không'}")
            
            return df
            
        except Exception as e:
            logger.error(f"Lỗi khi đọc payload MQTT: {e}")
            return pd.DataFrame()
    
    @staticmethod
    def read_sensor_data(file_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Đọc dữ liệu sensor từ CSV file
        
        Args:
            file_path: Đường dẫn đến file CSV sensor data
            
        Returns:
            DataFrame với dữ liệu sensor
        """
        if file_path is None:
            file_path = Path("data/sensor_data_30days.csv")
            
        if not file_path.exists():
            logger.warning(f"File sensor data không tồn tại: {file_path}")
            return pd.DataFrame()
        
        try:
            logger.info(f"Đang đọc dữ liệu sensor từ: {file_path}")
            
            # Đọc CSV với encoding phù hợp
            df = pd.read_csv(file_path, encoding='utf-8-sig')
            
            # Chuẩn hóa tên cột
            df = df.rename(columns={
                'Time': 'timestamp',
                'Temperature (do C)': 'temp_surface',
                'Humidity (%)': 'humidity_surface', 
                'Pressure (hPa)': 'pressure_surface',
                'Raining': 'rain_status'
            })
            
            # Chuyển đổi timestamp
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            
            # Tạo cột rain_mm từ Raining
            df['rain_mm'] = df['rain_status'].apply(lambda x: 1.0 if str(x).lower() == 'yes' else 0.0)
            
            # Thêm cột dt (Unix timestamp)
            df['dt'] = df['timestamp'].astype('int64') // 10**9
            
            # Giữ lại các cột cần thiết
            df = df[['dt', 'timestamp', 'temp_surface', 'humidity_surface', 'pressure_surface', 'rain_mm']]
            
            # Loại bỏ NaN
            df = df.dropna()
            
            logger.info(f"✓ Đã đọc {len(df)} mẫu sensor data")
            logger.info(f"  Khoảng thời gian: {df['timestamp'].min()} → {df['timestamp'].max()}")
            
            return df
            
        except Exception as e:
            logger.error(f"Lỗi khi đọc sensor data: {e}")
            return pd.DataFrame()
        """
        Đọc dữ liệu cảm biến từ file JSON hoặc CSV
        
        Args:
            file_path: Đường dẫn đến file (mặc định: sensor_data_sample.json)
            
        Returns:
            DataFrame với cột: [timestamp, temp_surface, humidity_surface, pressure_surface, rain_mm]
        """
        if file_path is None:
            file_path = SENSOR_DATA_FILE
            
        if not file_path.exists():
            logger.error(f"File không tồn tại: {file_path}")
            return pd.DataFrame()
        
        try:
            logger.info(f"Đang đọc dữ liệu cảm biến từ: {file_path}")
            
            # Đọc file JSON
            with open(file_path, 'r', encoding='utf-8') as f:
                sensor_list = json.load(f)
            
            # Chuyển đổi thành DataFrame
            df = pd.DataFrame(sensor_list)
            
            # Chuyển đổi timestamp Unix sang datetime
            df['timestamp'] = pd.to_datetime(df['dt'], unit='s', utc=True)
            
            # Đổi tên cột cho rõ ràng
            df = df.rename(columns={
                'temp': 'temp_surface',
                'humidity': 'humidity_surface',
                'pressure': 'pressure_surface'
            })
            
            # Giữ lại các cột cần thiết
            df = df[['dt', 'timestamp', 'temp_surface', 'humidity_surface', 'pressure_surface', 'rain_mm']]
            
            # Sắp xếp theo timestamp
            df = df.sort_values('timestamp').reset_index(drop=True)
            
            logger.info(f"✓ Đã đọc {len(df)} bản ghi cảm biến")
            logger.info(f"  Khoảng thời gian: {df['timestamp'].min()} đến {df['timestamp'].max()}")
            
            return df
            
        except Exception as e:
            logger.error(f"Lỗi khi đọc dữ liệu cảm biến: {e}")
            return pd.DataFrame()


class OpenMeteoAPIClient:
    """Lấy dữ liệu từ Open-Meteo API"""
    
    @staticmethod
    def fetch_open_meteo_data(
        latitude: float = DEFAULT_LAT,
        longitude: float = DEFAULT_LON,
        hours: int = 48,
        timezone: str = "auto"
    ) -> pd.DataFrame:
        """
        Gọi Open-Meteo API để lấy dữ liệu tầng cao
        
        API URL gốc:
        https://api.open-meteo.com/v1/forecast?latitude=10.95&longitude=106.82&hourly=wind_speed_10m,wind_direction_10m,cloud_cover,temperature_850hPa,temperature_700hPa,temperature_500hPa,dew_point_850hPa,dew_point_700hPa,dew_point_500hPa&timezone=auto
        
        Dữ liệu trả về:
        - Tầng 850hPa (dew_point_850hPa, temperature_850hPa): Điểm sương và nhiệt độ
        - Tầng 700hPa (dew_point_700hPa, temperature_700hPa): Điểm sương và nhiệt độ  
        - Tầng 500hPa (dew_point_500hPa, temperature_500hPa): Điểm sương và nhiệt độ
        - Tốc độ gió ở bề mặt (wind_speed_10m, wind_direction_10m)
        - Độ bao phủ mây (cloud_cover)
        
        Args:
            latitude: Vĩ độ (mặc định 10.95 - Biên Hòa)
            longitude: Kinh độ (mặc định 106.82 - Biên Hòa)
            hours: Số giờ dự báo (mặc định 48)
            timezone: Múi giờ (mặc định auto)
            
        Returns:
            DataFrame với dữ liệu từ Open-Meteo
        """
        try:
            logger.info(f"Đang gọi Open-Meteo API (lat={latitude}, lon={longitude}, hours={hours})...")
            
            # Xây dựng URL với các tham số cần thiết
            # Các tham số hourly theo đúng spec của Open-Meteo
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "hourly": "wind_speed_10m,wind_direction_10m,cloud_cover,"
                         "temperature_850hPa,temperature_700hPa,temperature_500hPa,"
                         "dew_point_850hPa,dew_point_700hPa,dew_point_500hPa",
                "timezone": timezone,
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh"
            }
            
            # Tạo URL query string
            query_parts = []
            for key, value in params.items():
                query_parts.append(f"{key}={value}")
            
            url = OPENMETEO_API_URL + "?" + "&".join(query_parts)
            
            logger.info(f"  URL API: {url[:100]}...")
            
            # Gọi API
            with urllib.request.urlopen(url, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
            
            logger.info("✓ Đã nhận dữ liệu từ Open-Meteo API")
            
            # Xử lý phản hồi
            df = OpenMeteoAPIClient._parse_openmeteo_response(data)
            
            logger.info(f"✓ Đã xử lý {len(df)} bản ghi từ Open-Meteo")
            logger.info(f"  Khoảng thời gian: {df['timestamp'].min()} đến {df['timestamp'].max()}")
            
            return df
            
        except urllib.error.URLError as e:
            logger.error(f"Lỗi kết nối API: {e}")
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"Lỗi khi gọi Open-Meteo API: {e}")
            return pd.DataFrame()
    
    @staticmethod
    def _parse_openmeteo_response(data: Dict) -> pd.DataFrame:
        """
        Xử lý phản hồi từ Open-Meteo API
        
        Tham số dữ liệu:
        - wind_speed_10m: Tốc độ gió ở 10m
        - wind_direction_10m: Hướng gió
        - cloud_cover: Độ bao phủ mây
        - temperature_850hPa: Nhiệt độ tầng 850hPa
        - temperature_700hPa: Nhiệt độ tầng 700hPa
        - temperature_500hPa: Nhiệt độ tầng 500hPa
        - dew_point_850hPa: Điểm sương tầng 850hPa
        - dew_point_700hPa: Điểm sương tầng 700hPa
        - dew_point_500hPa: Điểm sương tầng 500hPa
        
        Args:
            data: Dữ liệu JSON từ API
            
        Returns:
            DataFrame với cột được đổi tên rõ ràng
        """
        hourly = data.get('hourly', {})
        
        df = pd.DataFrame({
            'timestamp': pd.to_datetime(hourly['time']),
            'wind_speed_10m': hourly['wind_speed_10m'],
            'wind_direction_10m': hourly['wind_direction_10m'],
            'cloud_cover': hourly['cloud_cover'],
            'T_850': hourly['temperature_850hPa'],
            'Td_850': hourly['dew_point_850hPa'],
            'T_700': hourly['temperature_700hPa'],
            'Td_700': hourly['dew_point_700hPa'],
            'T_500': hourly['temperature_500hPa'],
            'Td_500': hourly['dew_point_500hPa'],
        })
        
        return df

    @staticmethod
    def read_weather_data_from_csv(csv_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Đọc dữ liệu thời tiết từ file CSV (weather_data_for_ai.csv)
        File này chứa dữ liệu từ Open-Meteo API bao gồm precipitation
        
        Cột dữ liệu:
        - temperature_2m: Nhiệt độ bề mặt
        - relative_humidity_2m: Độ ẩm bề mặt  
        - surface_pressure: Áp suất bề mặt
        - precipitation: LỰ LƯỢNG MƯA (mm) ← TARGET LABEL
        - temperature_850hPa, 700hPa, 500hPa: Nhiệt độ các tầng
        - dew_point_850hPa, 700hPa, 500hPa: Điểm sương các tầng
        
        Args:
            csv_path: Đường dẫn file CSV (mặc định: weather_data_for_ai.csv)
            
        Returns:
            DataFrame với dữ liệu thời tiết (bao gồm precipitation)
        """
        if csv_path is None:
            csv_path = WEATHER_API_CSV
            
        if not csv_path.exists():
            logger.error(f"File CSV không tồn tại: {csv_path}")
            return pd.DataFrame()
        
        try:
            logger.info(f"Đang đọc dữ liệu API từ CSV: {csv_path}")
            
            # Đọc file CSV
            df = pd.read_csv(csv_path)
            
            # Chuyển đổi timestamp sang datetime
            df['time'] = pd.to_datetime(df['time'])
            df = df.rename(columns={'time': 'timestamp'})
            
            # Lấy các cột cần thiết
            required_cols = [
                'timestamp',
                'temperature_2m',
                'relative_humidity_2m', 
                'surface_pressure',
                'precipitation',  # ← TARGET: Lượng mưa (mm)
                'temperature_850hPa', 'dew_point_850hPa',
                'temperature_700hPa', 'dew_point_700hPa',
                'temperature_500hPa', 'dew_point_500hPa'
            ]
            
            # Chỉ giữ cột tồn tại
            available_cols = [col for col in required_cols if col in df.columns]
            df = df[available_cols]
            
            # Đổi tên cột để thống nhất với code hiện tại
            rename_mapping = {
                'temperature_850hPa': 'T_850',
                'dew_point_850hPa': 'Td_850',
                'temperature_700hPa': 'T_700',
                'dew_point_700hPa': 'Td_700',
                'temperature_500hPa': 'T_500',
                'dew_point_500hPa': 'Td_500',
            }
            df = df.rename(columns=rename_mapping)
            
            # Sắp xếp theo timestamp
            df = df.sort_values('timestamp').reset_index(drop=True)
            
            logger.info(f"✓ Đã đọc {len(df)} bản ghi từ CSV")
            logger.info(f"  Khoảng thời gian: {df['timestamp'].min()} → {df['timestamp'].max()}")
            logger.info(f"  Lượng mưa: Min={df['precipitation'].min():.1f}mm, Max={df['precipitation'].max():.1f}mm")
            logger.info(f"  Có mưa: {(df['precipitation'] > 0).sum()} bản ghi")
            
            return df
            
        except Exception as e:
            logger.error(f"Lỗi khi đọc file CSV: {e}")
            return pd.DataFrame()


class DataIntegration:
    """Tích hợp dữ liệu từ hai nguồn"""
    
    @staticmethod
    def integrate_data(
        sensor_df: pd.DataFrame,
        openmeteo_df: pd.DataFrame,
        tolerance_minutes: int = 30
    ) -> pd.DataFrame:
        """
        Đồng bộ hóa và gộp dữ liệu cảm biến với dữ liệu Open-Meteo
        
        Args:
            sensor_df: DataFrame từ cảm biến tại chỗ
            openmeteo_df: DataFrame từ Open-Meteo API
            tolerance_minutes: Dung sai thời gian khi khớp dữ liệu (phút)
            
        Returns:
            DataFrame tích hợp
        """
        if sensor_df.empty or openmeteo_df.empty:
            logger.warning("Một trong hai nguồn dữ liệu là rỗng!")
            return pd.DataFrame()
        
        logger.info("Đang tích hợp dữ liệu từ hai nguồn...")
        
        try:
            # Tạo bản sao để không ảnh hưởng đến dữ liệu gốc
            df_api = openmeteo_df.copy()
            df_sensor = sensor_df.copy()
            
            # Rename sensor columns nếu cần
            df_sensor = df_sensor.rename(columns={
                'temp': 'temp_surface',
                'humidity': 'humidity_surface',
                'pressure': 'pressure_surface'
            })
            
            # Thêm cột dt nếu không có (Unix timestamp)
            if 'dt' not in df_sensor.columns:
                df_sensor['dt'] = pd.to_datetime(df_sensor['timestamp']).astype('int64') // 10**9

            # Thêm cột dt nếu không có (Unix timestamp)
            if 'dt' not in df_sensor.columns:
                # Nếu timestamp là local, cần chuyển đổi cẩn thận để có Unix timestamp chuẩn
                df_sensor['dt'] = pd.to_datetime(df_sensor['timestamp']).view('int64') // 10**9
            
            # CHUẨN HÓA TIMESTAMP - ĐỒNG BỘ VỀ GIỜ VIỆT NAM (GMT+7)
            # 1. Xử lý df_sensor: Chuyển từ Unix timestamp (UTC) sang giờ Việt Nam, sau đó bỏ múi giờ (localize None)
            df_sensor['timestamp'] = pd.to_datetime(df_sensor['dt'], unit='s', utc=True) \
                                       .dt.tz_convert('Asia/Ho_Chi_Minh') \
                                       .dt.tz_localize(None) \
                                       .astype('datetime64[s]')

            # 2. Xử lý df_api: Đảm bảo timestamp từ Open-Meteo là giờ địa phương và không chứa thông tin múi giờ
            df_api['timestamp'] = pd.to_datetime(df_api['timestamp']).dt.tz_localize(None).astype('datetime64[s]')
            
            # Sắp xếp theo timestamp
            df_api = df_api.sort_values('timestamp').reset_index(drop=True)
            df_sensor = df_sensor.sort_values('timestamp').reset_index(drop=True)
            
            logger.info(f"   API timestamps (Local): {df_api['timestamp'].min()} → {df_api['timestamp'].max()}")
            logger.info(f"   Sensor timestamps (Local): {df_sensor['timestamp'].min()} → {df_sensor['timestamp'].max()}")
            
            # Merge dữ liệu dựa trên timestamp với dung sai
            # Sử dụng merge_asof để khớp các bản ghi trong khoảng thời gian
            
            # # Chuẩn hóa timestamp - loại bỏ timezone và chuẩn hóa độ phân giải
            # df_api['timestamp'] = pd.to_datetime(df_api['timestamp']).dt.tz_localize(None).astype('datetime64[s]')
            # df_sensor['timestamp'] = pd.to_datetime(df_sensor['timestamp']).dt.tz_localize(None).astype('datetime64[s]')
            
            # # Sắp xếp theo timestamp
            # df_api = df_api.sort_values('timestamp').reset_index(drop=True)
            # df_sensor = df_sensor.sort_values('timestamp').reset_index(drop=True)
            
            # logger.info(f"  API timestamps: {df_api['timestamp'].min()} → {df_api['timestamp'].max()}")
            # logger.info(f"  Sensor timestamps: {df_sensor['timestamp'].min()} → {df_sensor['timestamp'].max()}")
            
            # # Merge dữ liệu dựa trên timestamp với dung sai
            # # Sử dụng merge_asof để khớp các bản ghi trong khoảng thời gian
            merged_df = pd.merge_asof(
                df_api,
                df_sensor,
                on='timestamp',
                direction='nearest',
                tolerance=pd.Timedelta(minutes=tolerance_minutes)
            )
            
            # Loại bỏ những dòng không có dữ liệu cảm biến
            merged_df = merged_df.dropna(subset=['temp_surface'])
            
        except Exception as e:
            logger.error(f"Lỗi khi merge dữ liệu: {e}")
            return pd.DataFrame()
        
        # Sắp xếp lại các cột - output tên cột từ API mới
        column_order = [
            'timestamp', 'dt',
            # Dữ liệu cảm biến bề mặt
            'temp_surface', 'humidity_surface', 'pressure_surface', 'rain_mm',
            # Dữ liệu từ API - cộtmới từ weather_data_for_ai.csv
            # Cần thêm cột temperature_2m, relative_humidity_2m từ API
            'temperature_2m', 'relative_humidity_2m', 'surface_pressure',
            # Tầng cao
            'temperature_850hPa', 'dew_point_850hPa',
            'temperature_700hPa', 'dew_point_700hPa',
            'temperature_500hPa', 'dew_point_500hPa',
            # Hoặc tên cũ nếu đã rename
            'T_850', 'Td_850', 'T_700', 'Td_700', 'T_500', 'Td_500',
            # Dữ liệu gió và mây
            'wind_speed_10m', 'wind_direction_10m', 'cloud_cover',
        ]
        
        # Chỉ giữ các cột tồn tại
        column_order = [col for col in column_order if col in merged_df.columns]
        merged_df = merged_df[column_order]
        
        logger.info(f"✓ Đã tích hợp {len(merged_df)} bản ghi")
        logger.info(f"  Cột dữ liệu: {len(merged_df.columns)} cột")
        logger.info(f"  Các cột: {', '.join(merged_df.columns[:10])}...")
        
        return merged_df
    
    @staticmethod
    def save_integrated_data(df: pd.DataFrame, file_path: Optional[Path] = None) -> bool:
        """
        Lưu dữ liệu đã tích hợp vào file
        
        Args:
            df: DataFrame
            file_path: Đường dẫn file (mặc định: integrated_sensor_openmeteo_data.json)
            
        Returns:
            True nếu lưu thành công
        """
        if file_path is None:
            file_path = INTEGRATED_DATA_FILE
        
        if df.empty:
            logger.warning("DataFrame rỗng, không thể lưu!")
            return False
        
        try:
            # Chuyển timestamp thành string để serialize
            df_copy = df.copy()
            df_copy['timestamp'] = df_copy['timestamp'].astype(str)
            
            # Lưu dưới dạng JSON
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(df_copy.to_dict(orient='records'), f, indent=2, ensure_ascii=False)
            
            logger.info(f"✓ Đã lưu dữ liệu tích hợp vào: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Lỗi khi lưu dữ liệu: {e}")
            return False


def main():
    """
    Chạy Bước 1: Thu thập và Tích hợp dữ liệu
    """
    logger.info("=" * 80)
    logger.info("BƯỚC 1: THU THẬP VÀ TÍCH HỢP DỮ LIỆU (Data Integration)")
    logger.info("=" * 80)
    
    # Chọn nguồn dữ liệu
    import argparse
    parser = argparse.ArgumentParser(description='Bước 1: Thu thập và Tích hợp dữ liệu')
    parser.add_argument('--source', choices=['sample', 'mqtt', 'csv'], default='csv',
                       help='Nguồn dữ liệu: sample (file mẫu), mqtt (payload MQTT), csv (dữ liệu CSV từ API)')
    args = parser.parse_args()
    
    # 1. Đọc dữ liệu cảm biến
    logger.info("\n[1/3] Đang đọc dữ liệu cảm biến tại chỗ...")
    if args.source == 'mqtt':
        logger.info("  → Sử dụng payload MQTT thực tế")
        sensor_data = SensorDataReader.read_mqtt_payload()
    elif args.source == 'csv':
        logger.info("  → Sử dụng dữ liệu từ CSV (có precipitation từ API)")
        sensor_data = OpenMeteoAPIClient.read_weather_data_from_csv()
    else:
        logger.info("  → Sử dụng dữ liệu mẫu từ file")
        sensor_data = SensorDataReader.read_sensor_data()
    
    if sensor_data.empty:
        logger.error("Không thể đọc dữ liệu cảm biến. Dừng.")
        return
    
    # 2. Lấy dữ liệu từ Open-Meteo API
    logger.info("\n[2/3] Đang lấy dữ liệu từ Open-Meteo API...")
    logger.info(f"  📍 Vị trí: Latitude {DEFAULT_LAT}, Longitude {DEFAULT_LON}")
    logger.info(f"  📅 Dự báo: 48 giờ tới")
    
    openmeteo_data = OpenMeteoAPIClient.fetch_open_meteo_data(
        latitude=DEFAULT_LAT,
        longitude=DEFAULT_LON,
        hours=48
    )
    
    if openmeteo_data.empty:
        logger.error("Không thể lấy dữ liệu từ Open-Meteo API. Dừng.")
        return
    
    # 3. Tích hợp dữ liệu
    logger.info("\n[3/3] Đang tích hợp dữ liệu từ hai nguồn...")
    integrated_data = DataIntegration.integrate_data(sensor_data, openmeteo_data)
    
    if integrated_data.empty:
        logger.error("Tích hợp dữ liệu thất bại. Dừng.")
        return
    
    # 4. Lưu dữ liệu
    logger.info("\n[4/4] Đang lưu dữ liệu tích hợp...")
    DataIntegration.save_integrated_data(integrated_data)
    
    # In thống kê
    logger.info("\n" + "=" * 80)
    logger.info("📊 THỐNG KÊ BƯỚC 1:")
    logger.info("=" * 80)
    logger.info(f"✓ Dữ liệu cảm biến: {len(sensor_data)} bản ghi")
    logger.info(f"✓ Dữ liệu Open-Meteo: {len(openmeteo_data)} bản ghi")
    logger.info(f"✓ Dữ liệu tích hợp: {len(integrated_data)} bản ghi")
    logger.info(f"✓ Số lượng cột: {len(integrated_data.columns)}")
    logger.info(f"✓ Khoảng thời gian: {integrated_data['timestamp'].min()} → {integrated_data['timestamp'].max()}")
    logger.info("\n📋 Danh sách các cột dữ liệu:")
    for i, col in enumerate(integrated_data.columns, 1):
        logger.info(f"   {i:2d}. {col}")
    
    logger.info("\n" + "=" * 80)
    logger.info("✅ BƯỚC 1 HOÀN THÀNH!")
    logger.info("=" * 80)
    logger.info("📝 Kết quả: Dữ liệu đã được tích hợp và lưu trong integrated_sensor_openmeteo_data.json")
    logger.info("➡️  Bước tiếp theo: BƯỚC 2 - Kỹ thuật đặc trưng (Feature Engineering)")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()
