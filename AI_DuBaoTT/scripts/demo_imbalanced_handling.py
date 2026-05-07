#!/usr/bin/env python3
"""
SCRIPT DEMO XỬ LÝ IMBALANCED DATA CHO DỰ BÁO MƯA

So sánh các phương pháp xử lý imbalanced data:
1. Class Weighting
2. Oversampling (SMOTE)
3. Undersampling + Oversampling
4. Custom Loss Function

Dữ liệu: weather_data_for_ai.csv (84.73% không mưa, 15.27% mưa)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import classification_report, f1_score, roc_auc_score
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load dữ liệu
def load_data():
    """Load và preprocess dữ liệu"""
    df = pd.read_csv('data/processed/weather_data_for_ai.csv')

    # Tạo target binary
    df['rain_label'] = (df['precipitation'] > 0).astype(int)

    # Features (giả sử chỉ dùng 5 features đầu cho demo)
    feature_cols = ['temperature_2m', 'relative_humidity_2m', 'surface_pressure',
                   'wind_speed_10m', 'cloud_cover']

    X = df[feature_cols].values
    y = df['rain_label'].values

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Reshape cho LSTM (sequence_length=1 cho demo)
    X_reshaped = X_scaled.reshape(X_scaled.shape[0], 1, X_scaled.shape[1])

    return X_reshaped, y, scaler

def create_simple_lstm_model(input_shape):
    """Tạo mô hình LSTM đơn giản cho demo"""
    model = Sequential([
        LSTM(32, input_shape=input_shape, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer=Adam(0.001),
                 loss='binary_crossentropy',
                 metrics=['accuracy', 'precision', 'recall'])
    return model

def weighted_binary_crossentropy(y_true, y_pred):
    """Custom loss function với class weights"""
    # Class weights: không mưa = 1, mưa = 5.5 (để cân bằng tỷ lệ 84.73/15.27 ≈ 5.5)
    weight_positive = 5.5  # Cho class mưa (minority)
    weight_negative = 1.0  # Cho class không mưa (majority)

    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    weights = y_true * weight_positive + (1 - y_true) * weight_negative
    return tf.reduce_mean(weights * bce)

def method_1_class_weighting(X_train, y_train, X_test, y_test):
    """Method 1: Class Weighting"""
    logger.info("\n=== METHOD 1: CLASS WEIGHTING ===")

    # Tính class weights
    class_weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
    class_weight_dict = dict(zip(np.unique(y_train), class_weights))
    logger.info(f"Class weights: {class_weight_dict}")

    # Train model
    model = create_simple_lstm_model(X_train.shape[1:])
    model.compile(loss='binary_crossentropy', optimizer=Adam(0.001),
                 metrics=['accuracy', 'precision', 'recall'])

    model.fit(X_train, y_train, epochs=20, batch_size=32,
             class_weight=class_weight_dict, verbose=0)

    # Evaluate
    y_pred_proba = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_pred_proba > 0.5).astype(int)

    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_pred_proba)

    logger.info(f"  F1-Score: {f1:.3f}")
    logger.info(f"  AUC-ROC: {auc:.3f}")

    return f1, auc

def method_2_custom_loss(X_train, y_train, X_test, y_test):
    """Method 2: Custom Loss Function"""
    logger.info("\n=== METHOD 2: CUSTOM LOSS FUNCTION ===")

    # Train model với custom loss
    model = create_simple_lstm_model(X_train.shape[1:])
    model.compile(loss=weighted_binary_crossentropy, optimizer=Adam(0.001),
                 metrics=['accuracy', 'precision', 'recall'])

    model.fit(X_train, y_train, epochs=20, batch_size=32, verbose=0)

    # Evaluate
    y_pred_proba = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_pred_proba > 0.5).astype(int)

    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_pred_proba)

    logger.info(f"  F1-Score: {f1:.3f}")
    logger.info(f"  AUC-ROC: {auc:.3f}")

    return f1, auc

def method_3_oversampling(X_train, y_train, X_test, y_test):
    """Method 3: Oversampling (đơn giản - duplicate minority class)"""
    logger.info("\n=== METHOD 3: OVERSAMPLING (DUPLICATE) ===")

    # Tìm indices của minority class
    minority_indices = np.where(y_train == 1)[0]
    majority_indices = np.where(y_train == 0)[0]

    # Duplicate minority class để cân bằng
    n_duplicates = len(majority_indices) // len(minority_indices)
    duplicated_minority = np.tile(minority_indices, n_duplicates)

    # Kết hợp
    balanced_indices = np.concatenate([majority_indices, duplicated_minority])
    np.random.shuffle(balanced_indices)

    X_train_balanced = X_train[balanced_indices]
    y_train_balanced = y_train[balanced_indices]

    logger.info(f"Balanced dataset: {np.sum(y_train_balanced)} mưa, {len(y_train_balanced) - np.sum(y_train_balanced)} không mưa")

    # Train model
    model = create_simple_lstm_model(X_train.shape[1:])
    model.compile(loss='binary_crossentropy', optimizer=Adam(0.001),
                 metrics=['accuracy', 'precision', 'recall'])

    model.fit(X_train_balanced, y_train_balanced, epochs=20, batch_size=32, verbose=0)

    # Evaluate
    y_pred_proba = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_pred_proba > 0.5).astype(int)

    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_pred_proba)

    logger.info(f"  F1-Score: {f1:.3f}")
    logger.info(f"  AUC-ROC: {auc:.3f}")

    return f1, auc

def method_4_baseline(X_train, y_train, X_test, y_test):
    """Method 4: Baseline (không xử lý imbalanced)"""
    logger.info("\n=== METHOD 4: BASELINE (NO TREATMENT) ===")

    # Train model thông thường
    model = create_simple_lstm_model(X_train.shape[1:])
    model.compile(loss='binary_crossentropy', optimizer=Adam(0.001),
                 metrics=['accuracy', 'precision', 'recall'])

    model.fit(X_train, y_train, epochs=20, batch_size=32, verbose=0)

    # Evaluate
    y_pred_proba = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_pred_proba > 0.5).astype(int)

    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_pred_proba)

    logger.info(f"  F1-Score: {f1:.3f}")
    logger.info(f"  AUC-ROC: {auc:.3f}")

    return f1, auc

def main():
    logger.info("=== DEMO XỬ LÝ IMBALANCED DATA CHO DỰ BÁO MƯA ===")

    # Load data
    X, y, scaler = load_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.2, 
        random_state=42, 
        stratify=y
    )

    logger.info(f"Dataset: {len(X)} samples")

    logger.info(
        f"Train: {len(X_train)} samples "
        f"({np.sum(y_train)} mưa, {len(y_train) - np.sum(y_train)} không mưa)"
    )

    logger.info(
        f"Test: {len(X_test)} samples "
        f"({np.sum(y_test)} mưa, {len(y_test) - np.sum(y_test)} không mưa)"
    )

    # Hiển thị tỷ lệ mưa (imbalance ratio)
    rain_ratio = np.mean(y)
    logger.info(f"Tỷ lệ mưa trong dataset: {rain_ratio:.2f}")

    # Test các methods
    results = {}

    results['baseline'] = method_4_baseline(X_train, y_train, X_test, y_test)
    results['class_weighting'] = method_1_class_weighting(X_train, y_train, X_test, y_test)
    results['custom_loss'] = method_2_custom_loss(X_train, y_train, X_test, y_test)
    results['oversampling'] = method_3_oversampling(X_train, y_train, X_test, y_test)

    # So sánh kết quả
    logger.info("\n" + "="*60)
    logger.info("SO SÁNH KẾT QUẢ CÁC PHƯƠNG PHÁP")
    logger.info("="*60)
    logger.info("<12")
    logger.info("-"*60)

    for method, (f1, auc) in results.items():
        logger.info("<12")

    logger.info("\n📊 KHUYẾN NGHỊ:")
    logger.info("• Class Weighting: Đơn giản, hiệu quả, khuyến nghị đầu tiên")
    logger.info("• Custom Loss: Tương tự class weighting nhưng linh hoạt hơn")
    logger.info("• Oversampling: Tốt khi có ít dữ liệu, cần cẩn thận overfitting")
    logger.info("• SMOTE: Tốt nhất khi có nhiều dữ liệu và thư viện imbalanced-learn")

if __name__ == '__main__':
    main()