#!/usr/bin/env python3
"""
BƯỚC 2: KỸ THUẬT ĐẶC TRƯNG (Feature Engineering)

Tính toán các chỉ số vật lý quan trọng để làm giàu dữ liệu cho AI:
1. Chỉ số K (K-Index - KI): Dự báo dông nhiệt đới
2. Điểm sương (Dew Point - Td): Độ ẩm tương đối tại bề mặt
3. Chỉ số nâng (Lifted Index - LI): Độ bất ổn định của khí quyển

Input: integrated_sensor_openmeteo_data.json (từ Bước 1)
Output: enriched_features_data.json (dữ liệu với các đặc trưng mới)
"""

import json
import math
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
import logging

# ========== CẤU HÌNH ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# File dữ liệu
INPUT_DATA_FILE = Path("data/processed/integrated_sensor_openmeteo_data.json")
INPUT_CSV_FILE = Path("data/processed/weather_data_for_ai.csv")  # Alternative: use CSV directly
OUTPUT_DATA_FILE = Path("data/processed/enriched_features_data.json")


class FeatureEngineering:
    """Tính toán các đặc trưng vật lý cho dự báo mưa"""

    @staticmethod
    def calculate_k_index(temperature_850hPa: float, temperature_500hPa: float, dew_point_850hPa: float, temperature_700hPa: float, dew_point_700hPa: float) -> float:
        """
        Tính Chỉ số K (K-Index) - Chỉ số quan trọng nhất để dự báo dông nhiệt đới

        Công thức: KI = (temperature_850hPa - temperature_500hPa) + dew_point_850hPa - (temperature_700hPa - dew_point_700hPa)

        Ý nghĩa:
        - KI > 35: Xác suất mưa dông > 80%
        - KI > 30: Xác suất mưa dông > 60%
        - KI > 25: Xác suất mưa dông > 40%
        - KI < 20: Xác suất mưa dông thấp

        Args:
            temperature_850hPa: Nhiệt độ tầng 850hPa (°C)
            temperature_500hPa: Nhiệt độ tầng 500hPa (°C)
            dew_point_850hPa: Điểm sương tầng 850hPa (°C)
            temperature_700hPa: Nhiệt độ tầng 700hPa (°C)
            dew_point_700hPa: Điểm sương tầng 700hPa (°C)

        Returns:
            Chỉ số K (đơn vị: °C)
        """
        try:
            ki = (temperature_850hPa - temperature_500hPa) + dew_point_850hPa - (temperature_700hPa - dew_point_700hPa)
            return round(ki, 2)
        except (TypeError, ValueError):
            return np.nan

    @staticmethod
    def calculate_dew_point(temperature_2m: float, relative_humidity_2m: float) -> float:
        """
        Tính điểm sương tại bề mặt từ nhiệt độ và độ ẩm

        Công thức Magnus-Tetens:
        Td = (b * α(T,RH)) / (a - α(T,RH))
        Trong đó: α(T,RH) = ln(RH/100) + (a*T)/(b+T)

        Ý nghĩa:
        - Khi nhiệt độ bề mặt tiến sát điểm sương, xác suất mưa tăng cao
        - Nếu T - Td < 3°C: Có thể có mưa
        - Nếu T - Td < 1°C: Có mưa

        Args:
            temperature_2m: Nhiệt độ bề mặt (°C)
            relative_humidity_2m: Độ ẩm tương đối (%)

        Returns:
            Điểm sương (°C)
        """
        try:
            if relative_humidity_2m <= 0 or relative_humidity_2m > 100:
                return np.nan

            # Hằng số Magnus-Tetens
            a = 17.27
            b = 237.3

            # Tính α
            alpha = (a * temperature_2m) / (b + temperature_2m) + math.log(relative_humidity_2m / 100.0)

            # Tính điểm sương
            td = (b * alpha) / (a - alpha)

            return round(td, 2)

        except (TypeError, ValueError, ZeroDivisionError):
            return np.nan

    @staticmethod
    def calculate_lifted_index(temperature_500hPa: float, temperature_850hPa: float, dew_point_850hPa: float) -> float:
        """
        Tính Chỉ số nâng (Lifted Index) - Đo độ bất ổn định của khí quyển

        Công thức đơn giản hóa:
        LI = T_env,500 - T_parcel,500

        Trong đó T_parcel,500 là nhiệt độ của khối khí khi nâng lên tầng 500hPa
        (ước tính từ điều kiện tại 850hPa)

        Ý nghĩa:
        - LI < -3: Khí quyển rất bất ổn định, dễ có dông
        - LI < -1: Khí quyển bất ổn định
        - LI > 0: Khí quyển ổn định

        Args:
            temperature_500hPa: Nhiệt độ tầng 500hPa (°C)
            temperature_850hPa: Nhiệt độ tầng 850hPa (°C)
            dew_point_850hPa: Điểm sương tầng 850hPa (°C)

        Returns:
            Chỉ số nâng (°C)
        """
        try:
            # Ước tính nhiệt độ của parcel khi nâng lên 500hPa
            # Công thức đơn giản: Giả sử adiabatic lapse rate = 6.5°C/km
            # Chênh lệch áp suất: 500 - 850 = -350 hPa
            # Ước tính độ cao tương ứng ≈ 3500m
            # Nhiệt độ parcel giảm ≈ 22.75°C

            # T_parcel_500 ≈ temperature_850hPa - 22.75 (ước tính đơn giản)
            # Trong thực tế cần tính toán chính xác hơn với moist adiabatic lapse rate
            lapse_rate = 6.5  # °C/km
            height_diff = 3.5  # km (ước tính từ 850hPa lên 500hPa)

            T_parcel_500 = temperature_850hPa - (lapse_rate * height_diff)

            # Nếu dew_point_850hPa < temperature_850hPa, điều chỉnh cho độ ẩm
            if dew_point_850hPa < temperature_850hPa:
                # Moist adiabatic lapse rate thấp hơn (khoảng 4-5°C/km)
                moist_lapse_rate = 4.5
                T_parcel_500 = temperature_850hPa - (moist_lapse_rate * height_diff)

            li = temperature_500hPa - T_parcel_500
            return round(li, 2)

        except (TypeError, ValueError):
            return np.nan

    @staticmethod
    def calculate_additional_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Tính toán các đặc trưng bổ sung

        Args:
            df: DataFrame với dữ liệu gốc

        Returns:
            DataFrame với các đặc trưng bổ sung
        """
        df_copy = df.copy()

        # Hỗ trợ cả tên cột cũ / alternate names từ realtime_forecast
        if 'temp_surface' in df_copy.columns and 'temperature_2m' not in df_copy.columns:
            df_copy['temperature_2m'] = df_copy['temp_surface']
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

        try:
            # Tính chênh lệch nhiệt độ - điểm sương tại bề mặt
            df_copy['temp_dewpoint_spread'] = df_copy['temperature_2m'] - df_copy['Td_surface']

            # Tính chênh lệch nhiệt độ giữa các tầng
            df_copy['temp_diff_850_500'] = df_copy['temperature_850hPa'] - df_copy['temperature_500hPa']
            df_copy['temp_diff_850_700'] = df_copy['temperature_850hPa'] - df_copy['temperature_700hPa']

            # Tính chênh lệch điểm sương giữa các tầng
            df_copy['dewpoint_diff_850_700'] = df_copy['dew_point_850hPa'] - df_copy['dew_point_700hPa']

            # Tính tốc độ gió (magnitude từ u,v components nếu có)
            # Hiện tại chỉ có wind_speed_10m, có thể bổ sung sau

            # Tính các đặc trưng từ thông tin điện năng (nếu có)
            # Lưu ý: Thông tin điện năng có thể gây nhiễu cho mô hình dự báo mưa
            # Chỉ sử dụng nếu có bằng chứng khoa học về mối liên hệ
            if 'voltage' in df_copy.columns and False:  # Tắt tính năng này
                df_copy['power_efficiency'] = df_copy['power_mW'] / df_copy['voltage'] if (df_copy['voltage'] > 0).any() else 0
                df_copy['current_stability'] = df_copy['current_mA'].rolling(window=3, center=True).std()  # Độ ổn định dòng điện
            
            # Tính độ ổn định của khí quyển (Stability Index)
            # SI = temperature_850hPa - temperature_500hPa + dew_point_850hPa - temperature_700hPa (tương tự KI nhưng khác chút)
            df_copy['stability_index'] = (df_copy['temperature_850hPa'] - df_copy['temperature_500hPa'] +
                                        df_copy['dew_point_850hPa'] - df_copy['temperature_700hPa'])

        except Exception as e:
            logger.warning(f"Lỗi khi tính đặc trưng bổ sung: {e}")

        return df_copy

    @staticmethod
    def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Thực hiện toàn bộ quá trình kỹ thuật đặc trưng

        Args:
            df: DataFrame với dữ liệu gốc từ Bước 1

        Returns:
            DataFrame với các đặc trưng mới
        """
        logger.info("Đang tính toán các đặc trưng vật lý...")

        df_enriched = df.copy()

        # 1. Tính điểm sương tại bề mặt
        logger.info("  → Tính điểm sương tại bề mặt (Td_surface)...")
        df_enriched['Td_surface'] = df_enriched.apply(
            lambda row: FeatureEngineering.calculate_dew_point(
                row['temperature_2m'], row['relative_humidity_2m']
            ),
            axis=1
        )

        # 2. Tính Chỉ số K (K-Index)
        logger.info("  → Tính Chỉ số K (K-Index)...")
        df_enriched['K_Index'] = df_enriched.apply(
            lambda row: FeatureEngineering.calculate_k_index(
                row['temperature_850hPa'], row['temperature_500hPa'], row['dew_point_850hPa'],
                row['temperature_700hPa'], row['dew_point_700hPa']
            ),
            axis=1
        )

        # 3. Tính Chỉ số nâng (Lifted Index)
        logger.info("  → Tính Chỉ số nâng (Lifted Index)...")
        df_enriched['Lifted_Index'] = df_enriched.apply(
            lambda row: FeatureEngineering.calculate_lifted_index(
                row['temperature_500hPa'], row['temperature_850hPa'], row['dew_point_850hPa']
            ),
            axis=1
        )

        # 4. Tính các đặc trưng bổ sung
        logger.info("  → Tính các đặc trưng bổ sung...")
        df_enriched = FeatureEngineering.calculate_additional_features(df_enriched)

        # Thống kê các đặc trưng mới
        new_features = ['Td_surface', 'K_Index', 'Lifted_Index', 'temp_dewpoint_spread',
                       'temp_diff_850_500', 'temp_diff_850_700', 'dewpoint_diff_850_700',
                       'stability_index']

        logger.info(f"✓ Đã tính toán {len(new_features)} đặc trưng mới:")
        for feature in new_features:
            if feature in df_enriched.columns:
                valid_count = df_enriched[feature].notna().sum()
                logger.info(f"   • {feature}: {valid_count} giá trị hợp lệ")

        return df_enriched


class DataProcessor:
    """Xử lý dữ liệu cho Feature Engineering"""

    @staticmethod
    def load_integrated_data(file_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Đọc dữ liệu tích hợp từ Bước 1 (JSON) hoặc CSV fallback

        Args:
            file_path: Đường dẫn file (mặc định: integrated_sensor_openmeteo_data.json)

        Returns:
            DataFrame
        """
        if file_path is None:
            file_path = INPUT_DATA_FILE

        # Try to load from JSON first
        if file_path.exists():
            try:
                logger.info(f"Đang đọc dữ liệu tích hợp từ: {file_path}")

                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                df = pd.DataFrame(data)

                # Chuyển timestamp về datetime
                df['timestamp'] = pd.to_datetime(df['timestamp'])

                logger.info(f"✓ Đã đọc {len(df)} bản ghi dữ liệu tích hợp")
                logger.info(f"  Cột dữ liệu: {len(df.columns)} cột")

                return df

            except Exception as e:
                logger.warning(f"Lỗi khi đọc JSON: {e}. Thử CSV fallback...")
        
        # Fallback: Load from CSV if JSON doesn't exist
        if INPUT_CSV_FILE.exists():
            try:
                logger.info(f"Đang đọc dữ liệu từ CSV: {INPUT_CSV_FILE}")
                df = pd.read_csv(INPUT_CSV_FILE)
                
                # Rename columns for consistency
                df = df.rename(columns={
                    'time': 'timestamp',
                    'temperature_2m': 'temperature_2m',
                    'relative_humidity_2m': 'relative_humidity_2m',
                    'surface_pressure': 'surface_pressure',
                    'precipitation': 'precipitation'
                })
                
                # Chuyển timestamp về datetime
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                
                logger.info(f"✓ Đã đọc {len(df)} bản ghi từ CSV")
                logger.info(f"  Cột dữ liệu: {len(df.columns)} cột")
                
                return df
                
            except Exception as e:
                logger.error(f"Lỗi khi đọc CSV: {e}")
                return pd.DataFrame()
        
        logger.error(f"Không tìm thấy file: {file_path} hoặc {INPUT_CSV_FILE}")
        return pd.DataFrame()

    @staticmethod
    def save_enriched_data(df: pd.DataFrame, file_path: Optional[Path] = None) -> bool:
        """
        Lưu dữ liệu đã làm giàu đặc trưng

        Args:
            df: DataFrame
            file_path: Đường dẫn file (mặc định: enriched_features_data.json)

        Returns:
            True nếu lưu thành công
        """
        if file_path is None:
            file_path = OUTPUT_DATA_FILE

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

            logger.info(f"✓ Đã lưu dữ liệu đặc trưng vào: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Lỗi khi lưu dữ liệu: {e}")
            return False

    @staticmethod
    def analyze_features(df: pd.DataFrame) -> None:
        """
        Phân tích và hiển thị thống kê các đặc trưng

        Args:
            df: DataFrame với các đặc trưng
        """
        logger.info("\n" + "="*80)
        logger.info("📊 PHÂN TÍCH CÁC ĐẶC TRƯNG:")
        logger.info("="*80)

        # Các đặc trưng chính
        key_features = {
            'K_Index': {
                'name': 'Chỉ số K (K-Index)',
                'unit': '°C',
                'thresholds': {
                    '>35': 'Xác suất dông >80%',
                    '30-35': 'Xác suất dông 60-80%',
                    '25-30': 'Xác suất dông 40-60%',
                    '<20': 'Xác suất dông thấp'
                }
            },
            'Lifted_Index': {
                'name': 'Chỉ số nâng (Lifted Index)',
                'unit': '°C',
                'thresholds': {
                    '<-3': 'Khí quyển rất bất ổn định',
                    '-3 đến -1': 'Khí quyển bất ổn định',
                    '>-1': 'Khí quyển ổn định'
                }
            },
            'Td_surface': {
                'name': 'Điểm sương bề mặt',
                'unit': '°C',
                'thresholds': {
                    'T-Td<1': 'Có mưa',
                    'T-Td<3': 'Có thể có mưa',
                    'T-Td>5': 'Ít có mưa'
                }
            }
        }

        for feature, info in key_features.items():
            if feature in df.columns:
                values = df[feature].dropna()
                if len(values) > 0:
                    logger.info(f"\n🔹 {info['name']} ({info['unit']}):")
                    logger.info(f"   • Số lượng: {len(values)} giá trị")
                    logger.info(f"   • Trung bình: {values.mean():.2f}")
                    logger.info(f"   • Min/Max: {values.min():.2f} / {values.max():.2f}")
                    logger.info(f"   • Ngưỡng quan trọng:")

                    for threshold, meaning in info['thresholds'].items():
                        logger.info(f"     - {threshold}: {meaning}")


def main():
    """
    Chạy Bước 2: Kỹ thuật đặc trưng (Feature Engineering)
    """
    logger.info("=" * 80)
    logger.info("BƯỚC 2: KỸ THUẬT ĐẶC TRƯNG (Feature Engineering)")
    logger.info("=" * 80)

    # 1. Đọc dữ liệu từ Bước 1
    logger.info("\n[1/3] Đang đọc dữ liệu tích hợp từ Bước 1...")
    integrated_data = DataProcessor.load_integrated_data()

    if integrated_data.empty:
        logger.error("Không thể đọc dữ liệu tích hợp. Hãy chạy Bước 1 trước.")
        return

    # 2. Tính toán các đặc trưng
    logger.info("\n[2/3] Đang tính toán các đặc trưng vật lý...")
    enriched_data = FeatureEngineering.engineer_features(integrated_data)

    if enriched_data.empty:
        logger.error("Tính toán đặc trưng thất bại.")
        return

    # 3. Lưu dữ liệu
    logger.info("\n[3/3] Đang lưu dữ liệu đặc trưng...")
    DataProcessor.save_enriched_data(enriched_data)

    # Phân tích kết quả
    DataProcessor.analyze_features(enriched_data)

    # Thống kê tổng quan
    logger.info("\n" + "=" * 80)
    logger.info("📊 THỐNG KÊ BƯỚC 2:")
    logger.info("=" * 80)
    logger.info(f"✓ Dữ liệu đầu vào: {len(integrated_data)} bản ghi")
    logger.info(f"✓ Dữ liệu đầu ra: {len(enriched_data)} bản ghi")
    logger.info(f"✓ Số cột gốc: {len(integrated_data.columns)}")
    logger.info(f"✓ Số cột mới: {len(enriched_data.columns)}")
    logger.info(f"✓ Đặc trưng mới: {len(enriched_data.columns) - len(integrated_data.columns)}")

    logger.info("\n📋 Các đặc trưng mới được thêm:")
    new_columns = set(enriched_data.columns) - set(integrated_data.columns)
    for i, col in enumerate(sorted(new_columns), 1):
        logger.info(f"   {i:2d}. {col}")

    logger.info("\n" + "=" * 80)
    logger.info("✅ BƯỚC 2 HOÀN THÀNH!")
    logger.info("=" * 80)
    logger.info("📝 Kết quả: Dữ liệu đặc trưng đã được tính toán và lưu trong enriched_features_data.json")
    logger.info("➡️  Bước tiếp theo: BƯỚC 3 - Xây dựng mô hình AI Hybrid (LSTM + XGBoost)")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()