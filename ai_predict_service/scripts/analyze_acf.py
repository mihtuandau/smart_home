#!/usr/bin/env python3
"""
Script phân tích Autocorrelation Function (ACF) để xác định SEQUENCE_LENGTH optimal

ACF giúp xác định:
- Nên dùng bao nhiêu giờ quá khứ để dự báo
- Mối liên hệ giữa các time steps
- Xác nhận SEQUENCE_LENGTH=24h có hợp lệ không
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import logging
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import adfuller

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_weather_data(csv_file: str) -> pd.DataFrame:
    """Load dữ liệu thời tiết từ CSV"""
    if not Path(csv_file).exists():
        logger.error(f"File không tồn tại: {csv_file}")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(csv_file, encoding='utf-8-sig')
        df['time'] = pd.to_datetime(df['time'])
        return df
    except Exception as e:
        logger.error(f"Lỗi khi đọc file: {e}")
        return pd.DataFrame()

def analyze_acf(df: pd.DataFrame, column: str, lags: int = 48):
    """
    Phân tích ACF và PACF cho một feature
    
    Args:
        df: DataFrame
        column: Tên cột để phân tích
        lags: Số lags để vẽ (48 = 48 giờ)
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Phân tích ACF cho column: {column}")
    logger.info(f"{'='*60}")
    
    if column not in df.columns:
        logger.error(f"Column '{column}' không tồn tại")
        return
    
    # Lấy dữ liệu
    data = df[column].dropna().values
    
    if len(data) < lags:
        logger.warning(f"Dữ liệu quá ít ({len(data)} < {lags})")
        return
    
    # 1. Kiểm tra stationarity
    logger.info("\n[1] Kiểm tra Stationarity (Augmented Dickey-Fuller Test)")
    adf_result = adfuller(data)
    logger.info(f"  ADF Statistic: {adf_result[0]:.6f}")
    logger.info(f"  p-value: {adf_result[1]:.6f}")
    
    if adf_result[1] < 0.05:
        logger.info("  ✓ Dữ liệu là stationary (có thể dùng ARIMA/LSTM trực tiếp)")
    else:
        logger.warning("  ⚠ Dữ liệu không stationary (cần differencing)")
    
    # 2. Tính autocorrelation quan trọng
    logger.info(f"\n[2] Autocorrelation quan trọng (> 0.1):")
    acf_values = np.correlate(data - np.mean(data), data - np.mean(data), mode='full')
    acf_normalized = acf_values[len(acf_values)//2:] / acf_values[len(acf_values)//2]
    
    significant_lags = []
    for i in range(1, min(lags, len(acf_normalized))):
        if abs(acf_normalized[i]) > 0.1:
            significant_lags.append(i)
            logger.info(f"  Lag {i}h: {acf_normalized[i]:.3f}")
    
    # 3. Khuyến cáo SEQUENCE_LENGTH
    logger.info(f"\n[3] Khuyến cáo SEQUENCE_LENGTH:")
    max_significant = max(significant_lags) if significant_lags else 12
    logger.info(f"  Autocorrelation cao đến lag: {max_significant}h")
    
    if max_significant < 12:
        logger.info(f"  ✓ SEQUENCE_LENGTH=24 là hợp lý (có buffer)")
    elif max_significant < 24:
        logger.info(f"  ✓ SEQUENCE_LENGTH=24 là phù hợp")
    else:
        logger.warning(f"  ⚠ Xét tăng SEQUENCE_LENGTH lên {max_significant + 6}h")
    
    # 4. Vẽ biểu đồ
    logger.info(f"\n[4] Tạo biểu đồ ACF/PACF...")
    
    fig, axes = plt.subplots(2, 1, figsize=(12, 8))
    fig.suptitle(f'Autocorrelation Analysis: {column}\n(Lags: {lags}h)', fontsize=14, fontweight='bold')
    
    # ACF plot
    plot_acf(data, lags=lags, ax=axes[0], title='Autocorrelation Function (ACF)')
    axes[0].axhline(y=0.1, color='r', linestyle='--', alpha=0.5, label='Threshold 0.1')
    axes[0].axhline(y=-0.1, color='r', linestyle='--', alpha=0.5)
    axes[0].axvline(x=24, color='g', linestyle='--', alpha=0.7, label='SEQUENCE_LENGTH=24')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # PACF plot
    plot_pacf(data, lags=lags, ax=axes[1], title='Partial Autocorrelation Function (PACF)')
    axes[1].axhline(y=0.1, color='r', linestyle='--', alpha=0.5, label='Threshold 0.1')
    axes[1].axhline(y=-0.1, color='r', linestyle='--', alpha=0.5)
    axes[1].axvline(x=24, color='g', linestyle='--', alpha=0.7, label='SEQUENCE_LENGTH=24')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    output_file = f"results/acf_analysis_{column}.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"  ✓ Đã lưu biểu đồ: {output_file}")
    plt.close()

def main():
    """Phân tích ACF cho các features quan trọng"""
    csv_file = "data/processed/weather_data_for_ai.csv"
    
    logger.info("XÂY DỰNG PHÂN TÍCH AUTOCORRELATION CHO SEQUENCE_LENGTH VALIDATION")
    
    # Load dữ liệu
    df = load_weather_data(csv_file)
    if df.empty:
        logger.error("Không thể load dữ liệu")
        return
    
    logger.info(f"✓ Đã load {len(df)} mẫu dữ liệu")
    
    # Features quan trọng để phân tích
    important_features = [
        'temperature_2m',
        'relative_humidity_2m',
        'surface_pressure',
        'precipitation',
        'wind_speed_10m',
        'cloud_cover'
    ]
    
    # Phân tích từng feature
    for feature in important_features:
        if feature in df.columns:
            analyze_acf(df, feature, lags=48)
    
    logger.info(f"\n{'='*60}")
    logger.info("KẾT LUẬN:")
    logger.info("Nếu ACF giảm nhanh và cắt ngang ở ~24h: SEQUENCE_LENGTH=24 là tối ưu")
    logger.info("Nếu ACF còn cao ở 24h: Xét tăng SEQUENCE_LENGTH")
    logger.info("Nếu ACF cắt ở <12h: Có thể giảm xuống SEQUENCE_LENGTH=12")
    logger.info(f"{'='*60}\n")

if __name__ == "__main__":
    main()
