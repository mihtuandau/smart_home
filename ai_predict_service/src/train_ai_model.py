#!/usr/bin/env python3
"""
SCRIPT TRAINING MODEL AI DỰ BÁO XÁC SUẤT MƯA

Dựa trên dữ liệu từ weather_data_for_ai.csv và sensor mẫu.
Bao gồm: Load data, preprocess, build LSTM model, train, evaluate, save.
"""

import os
import pandas as pd
import numpy as np
import logging
from sklearn.preprocessing import MinMaxScaler
from feature_engineering import FeatureEngineering

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình
SEQUENCE_LENGTH = 24  # Quay lại 24 giờ (từ 12 giờ)
WEATHER_CSV = 'data/processed/weather_data_for_ai.csv'  # File weather từ API (có precipitation)
LSTM_FEATURES = [
    'temperature_2m', 'relative_humidity_2m', 'surface_pressure',
    'temperature_850hPa', 'dew_point_850hPa', 'temperature_700hPa',
    'dew_point_700hPa', 'temperature_500hPa', 'dew_point_500hPa',
    'wind_speed_10m', 'cloud_cover', 'precipitation'
]
MODEL_SAVE_PATH = 'models/hybrid_rain_forecast_model/lstm_model.h5'

def load_weather_data(csv_file):
    """Load dữ liệu thời tiết từ CSV (có precipitation từ API)"""
    df = pd.read_csv(csv_file, encoding='utf-8-sig')
    
    # Đổi tên cột về English để match code
    column_mapping = {
        'time': 'time',
        'temperature_2m': 'temperature_2m',
        'relative_humidity_2m': 'relative_humidity_2m',
        'surface_pressure': 'surface_pressure',
        'precipitation': 'precipitation',  # ← TARGET: Lượng mưa từ API
        'temperature_850hPa': 'temperature_850hPa',
        'temperature_700hPa': 'temperature_700hPa',
        'temperature_500hPa': 'temperature_500hPa',
        'dew_point_850hPa': 'dew_point_850hPa',
        'dew_point_700hPa': 'dew_point_700hPa',
        'dew_point_500hPa': 'dew_point_500hPa'
    }
    df.rename(columns=column_mapping, inplace=True)
    df['time'] = pd.to_datetime(df['time'])
    
    # Tạo rain_probability từ precipitation
    df['rain_probability'] = (df['precipitation'] > 0).astype(int)
    
    logger.info(f"✓ Đã load {len(df)} bản ghi từ weather CSV")
    logger.info(f"  Precipitation: Min={df['precipitation'].min():.1f}mm, Max={df['precipitation'].max():.1f}mm")
    logger.info(f"  Rain probability: {df['rain_probability'].sum()}/{len(df)} samples")
    
    return df

def load_real_sensor_data(sensor_csv):
    """Load dữ liệu sensor thực từ CSV"""
    try:
        df = pd.read_csv(sensor_csv, encoding='utf-8-sig')
    except UnicodeDecodeError:
        df = pd.read_csv(sensor_csv, encoding='latin1')
    
    # Handle BOM in column names
    df.columns = df.columns.str.replace('ï»¿', '')
    
    # Đổi tên cột về format chuẩn
    column_mapping = {
        'Time': 'time',
        'Temperature (°C)': 'temp_surface',  # Nếu có °C
        'Temperature (do C)': 'temp_surface',  # Nếu đã sửa
        'Humidity (%)': 'humidity_surface', 
        'Pressure (hPa)': 'pressure_surface',
        'Raining': 'raining',
        'Samples': 'samples'
    }
    df.rename(columns=column_mapping, inplace=True)
    df['time'] = pd.to_datetime(df['time'], errors='coerce')  # Chuyển đổi time
    df['rain_mm'] = df['raining'].map({'Yes': 1.0, 'No': 0.0}).fillna(0.0)  # Chuyển raining thành rain_mm
    return df[['time', 'temp_surface', 'humidity_surface', 'pressure_surface', 'rain_mm']].dropna()

def integrate_data(sensor_df, weather_df):
    """Tích hợp sensor + weather data theo thời gian"""
    # Đảm bảo time là datetime
    sensor_df['time'] = pd.to_datetime(sensor_df['time'])
    weather_df['time'] = pd.to_datetime(weather_df['time'])
    
    # Chỉ giữ rain_mm từ sensor
    sensor_df = sensor_df[['time', 'rain_mm']]
    
    # Merge theo thời gian gần nhất (tolerance 1 giờ)
    merged = pd.merge_asof(
        sensor_df.sort_values('time'), 
        weather_df.sort_values('time'), 
        on='time', 
        tolerance=pd.Timedelta('1 hour')
    )
    
    # KHÔNG rename - giữ tên cột từ API
    # feature_engineering.py sẽ sử dụng tên cột API: temperature_2m, relative_humidity_2m, etc.
    
    # Sử dụng precipitation từ API làm rain_mm
    merged['rain_mm'] = merged['precipitation']
    
    # Loại bỏ rows có NaN
    merged_clean = merged.dropna(subset=['temperature_2m'])
    
    logger.info(f"✓ Đã merge {len(merged)} bản ghi, sau khi dropna: {len(merged_clean)} bản ghi")
    logger.info(f"  Rain samples: {(merged_clean['precipitation'] > 0).sum()}")
    
    return merged_clean
    
    logger.info(f"Integrated {len(merged)} records after merging")
    return merged

def prepare_training_data(df, sequence_length=24):
    """Chuẩn bị dữ liệu training: tạo sequences và target"""
    # Target: rain probability (0-1) từ rain_mm
    df['rain_probability'] = (df['rain_mm'] > 0).astype(int)  # Binary: mưa/không mưa

    # Tạo sequences
    X_sequences = []
    y_targets = []
    for i in range(len(df) - sequence_length):
        seq = df[LSTM_FEATURES].iloc[i:i+sequence_length].values
        target = df['rain_probability'].iloc[i+sequence_length]
        X_sequences.append(seq)
        y_targets.append(target)

    X = np.array(X_sequences)
    y = np.array(y_targets)

    # Scale
    scaler = MinMaxScaler(feature_range=(-1, 1))
    X_scaled = scaler.fit_transform(X.reshape(-1, len(LSTM_FEATURES))).reshape(X.shape)

    return X_scaled, y, scaler

def main():
    logger.info("=== BƯỚC TRAINING MODEL AI (CHỈ DÙNG DỮ LIỆU API) ===")

    # 1. Load dữ liệu weather từ API
    logger.info("1. Loading weather data from API CSV...")
    weather_df = load_weather_data(WEATHER_CSV)
    logger.info(f"Loaded {len(weather_df)} weather records")

    # 2. Tính features từ dữ liệu API
    logger.info("2. Calculating meteorological features...")
    featured_df = FeatureEngineering.engineer_features(weather_df)

    # 3. Tạo target nhãn rain_probability từ precipitation
    logger.info("3. Adding rain probability target from precipitation...")
    featured_df['rain_probability'] = (featured_df['precipitation'] > 0).astype(float)

    # 4. Training Hybrid Model
    logger.info("4. Building and training Hybrid Model (API-only)...")
    from hybrid_model import HybridModel

    hybrid_model = HybridModel()
    training_info = hybrid_model.build_and_train(featured_df)

    # 5. Hiển thị kết quả training
    logger.info("5. Training Results:")
    val_metrics = training_info.get('validation_metrics', {})
    data_info = training_info.get('data_info', {})

    logger.info("📊 Validation Metrics:")
    logger.info(f"  • MSE: {val_metrics.get('mse', 0):.4f}")
    logger.info(f"  • RMSE: {val_metrics.get('rmse', 0):.4f}")
    logger.info(f"  • R² Score: {val_metrics.get('r2', 0):.4f}")
    logger.info(f"  • Accuracy: {val_metrics.get('accuracy', 0):.1f}%")
    logger.info(f"  • Precision: {val_metrics.get('precision', 0):.3f}")
    logger.info(f"  • Recall: {val_metrics.get('recall', 0):.3f}")
    logger.info(f"  • F1-Score: {val_metrics.get('f1', 0):.3f}")

    logger.info("📈 Data Augmentation Info:")
    logger.info(f"  • Original samples: {data_info.get('original_samples', 0)}")
    logger.info(f"  • Augmented samples: {data_info.get('augmented_samples', 0)}")
    logger.info(f"  • Rain samples: {data_info.get('rain_samples', 0)}")
    logger.info(f"  • No-rain samples: {data_info.get('no_rain_samples', 0)}")

    logger.info("=== TRAINING HOÀN THÀNH VỚI DỮ LIỆU API ===")
    logger.info(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    main()