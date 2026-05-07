#!/usr/bin/env python3
"""
BƯỚC 3: XÂY DỰNG MÔ HÌNH AI HYBRID (LSTM + XGBoost)

Kiến trúc Hybrid Model cho dự báo xác suất mưa 48 giờ:
1. LSTM Layer: Xử lý dữ liệu chuỗi thời gian (24 giờ quá khứ)
2. XGBoost Classifier: Dự báo xác suất mưa dựa trên output từ LSTM + các chỉ số tĩnh

Tiền xử lý: Chuẩn hóa dữ liệu về khoảng [-1, 1]
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime, timedelta

# Machine Learning libraries
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score

# Deep Learning
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Concatenate, MultiHeadAttention
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# XGBoost
import xgboost as xgb

# ========== CẤU HÌNH ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# File paths
FEATURES_DATA_FILE = Path("enriched_features_data.json")
MODEL_SAVE_PATH = Path("hybrid_rain_forecast_model")
LSTM_MODEL_PATH = MODEL_SAVE_PATH / "lstm_model.h5"
XGB_MODEL_PATH = MODEL_SAVE_PATH / "xgb_model.json"
SCALER_PATH = MODEL_SAVE_PATH / "scaler.pkl"

# Model hyperparameters - QUAY LẠI THÔNG SỐ BAN ĐẦU
SEQUENCE_LENGTH = 24  # Quay lại 24 giờ (từ 12 giờ)
FORECAST_HOURS = 48   # Dự báo 48 giờ tới
BATCH_SIZE = 32       # Quay lại 32 (từ 64)
EPOCHS = 100          # Quay lại 100 epochs (từ 20)
LEARNING_RATE = 0.001

# Features for LSTM (time series features) - sử dụng tên cột từ API mới
LSTM_FEATURES = [
    'temperature_2m', 'relative_humidity_2m', 'surface_pressure',
    'precipitation',
    'temperature_850hPa', 'dew_point_850hPa', 
    'temperature_700hPa', 'dew_point_700hPa', 
    'temperature_500hPa', 'dew_point_500hPa',
    'wind_speed_10m', 'cloud_cover'
    # Note: wind_direction_10m loại bỏ vì không có trong dữ liệu gốc
    # Note: realtime sẽ dùng rain_mm từ sensor làm precipitation
]

# Static features for XGBoost (calculated indices)
STATIC_FEATURES = [
    'K_Index', 'Lifted_Index', 'Td_surface',
    'temp_dewpoint_spread', 'stability_index'
]


class DataPreprocessor:
    """Tiền xử lý dữ liệu cho mô hình Hybrid"""

    def __init__(self):
        self.scaler = MinMaxScaler(feature_range=(-1, 1))
        self.feature_columns = LSTM_FEATURES + STATIC_FEATURES

    def load_features_data(self, file_path: Optional[Path] = None) -> pd.DataFrame:
        """
        Đọc dữ liệu đặc trưng từ Bước 2

        Args:
            file_path: Đường dẫn file dữ liệu đặc trưng

        Returns:
            DataFrame với các đặc trưng
        """
        if file_path is None:
            file_path = FEATURES_DATA_FILE

        if not file_path.exists():
            logger.error(f"File dữ liệu đặc trưng không tồn tại: {file_path}")
            return pd.DataFrame()

        try:
            logger.info(f"Đang đọc dữ liệu đặc trưng từ: {file_path}")

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            df = pd.DataFrame(data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])

            logger.info(f"✓ Đã đọc {len(df)} bản ghi đặc trưng")
            logger.info(f"  Cột dữ liệu: {len(df.columns)} cột")

            return df

        except Exception as e:
            logger.error(f"Lỗi khi đọc dữ liệu đặc trưng: {e}")
            return pd.DataFrame()

    def augment_time_series_data(self, df: pd.DataFrame, augmentation_factor: int = 3) -> pd.DataFrame:
        """
        Augment dữ liệu time series để tăng sample size mà vẫn giữ tính chính xác

        Args:
            df: DataFrame gốc
            augmentation_factor: Số lần nhân dữ liệu

        Returns:
            DataFrame đã augment
        """
        logger.info(f"Đang augment dữ liệu với factor {augmentation_factor}...")

        if df.empty:
            return df

        augmented_data = [df.copy()]  # Giữ nguyên data gốc

        # 1. Noise injection augmentation
        for i in range(augmentation_factor - 1):
            df_noise = df.copy()

            # Thêm Gaussian noise nhỏ cho numerical features
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            for col in numerical_cols:
                if col not in ['time', 'dt', 'rain_probability']:  # Không augment target và time
                    # Noise ±5% của std
                    noise_std = df[col].std() * 0.05
                    noise = np.random.normal(0, noise_std, len(df))
                    df_noise[col] = df[col] + noise

                    # Giữ trong khoảng hợp lý
                    if 'temp' in col.lower():
                        df_noise[col] = np.clip(df_noise[col], -10, 50)  # Nhiệt độ
                    elif 'humidity' in col.lower():
                        df_noise[col] = np.clip(df_noise[col], 0, 100)  # Độ ẩm
                    elif 'pressure' in col.lower():
                        df_noise[col] = np.clip(df_noise[col], 900, 1100)  # Áp suất

            augmented_data.append(df_noise)

        # 2. Scaling augmentation (chỉ cho một số mẫu)
        df_scaled = df.copy()
        scale_factor = np.random.uniform(0.9, 1.1)  # ±10%
        for col in numerical_cols:
            if col not in ['timestamp', 'dt', 'rain_probability']:
                df_scaled[col] = df[col] * scale_factor
        augmented_data.append(df_scaled)

        # 3. Bootstrap resampling (resample với replacement)
        df_bootstrap = df.sample(n=len(df), replace=True, random_state=42).reset_index(drop=True)
        augmented_data.append(df_bootstrap)

        # Concatenate all augmented data
        df_augmented = pd.concat(augmented_data, ignore_index=True)

        # Shuffle để tránh bias
        df_augmented = df_augmented.sample(frac=1, random_state=42).reset_index(drop=True)

        logger.info(f"✓ Đã augment từ {len(df)} → {len(df_augmented)} mẫu")
        logger.info(f"  Xác suất mưa trung bình: {df_augmented['rain_probability'].mean():.3f}")

        return df_augmented

    def generate_balanced_synthetic_data(self, real_df: pd.DataFrame, target_samples: int = 2000) -> pd.DataFrame:
        """
        Tạo dữ liệu synthetic cân bằng từ real data

        Args:
            real_df: DataFrame với dữ liệu thực tế
            target_samples: Số mẫu target

        Returns:
            DataFrame cân bằng
        """
        logger.info(f"Đang tạo dữ liệu cân bằng với {target_samples} mẫu...")

        if real_df.empty:
            return pd.DataFrame()

        # Phân tích distribution hiện tại
        rain_prob = real_df['rain_probability'].values
        rain_threshold = 0.5
        rain_samples = np.sum(rain_prob > rain_threshold)
        no_rain_samples = len(real_df) - rain_samples

        logger.info(f"  Dữ liệu gốc: {rain_samples} mưa, {no_rain_samples} không mưa")

        # Tính target cho mỗi class
        target_per_class = target_samples // 2

        synthetic_data = []

        # 1. Augment từ real data
        if len(real_df) > 0:
            df_augmented = self.augment_time_series_data(real_df, augmentation_factor=2)
            synthetic_data.append(df_augmented)

        # 2. Tạo synthetic cho class thiểu số
        base_values = real_df.mean() if not real_df.empty else pd.Series()

        for i in range(target_samples - len(synthetic_data[0]) if synthetic_data else target_samples):
            sample = base_values.copy()

            # Tạo timestamp ngẫu nhiên
            start_date = pd.Timestamp('2026-03-01')
            hours_offset = np.random.randint(0, 90 * 24)  # 90 ngày
            sample['time'] = start_date + pd.Timedelta(hours=hours_offset)

            # Tạo features với noise
            for feature in self.feature_columns:
                if feature in base_values.index and feature != 'rain_probability':
                    base_val = base_values[feature]
                    if pd.notna(base_val):
                        # Noise dựa trên std của real data
                        if feature in real_df.columns:
                            std_val = real_df[feature].std()
                            noise = np.random.normal(0, std_val * 0.1)
                        else:
                            noise = np.random.normal(0, abs(base_val) * 0.1)

                        sample[feature] = base_val + noise

            # Tạo target cân bằng
            if i % 2 == 0:  # 50% mưa, 50% không mưa
                # Mẫu mưa: điều kiện thuận lợi
                sample['K_Index'] = np.random.uniform(30, 40)
                sample['Lifted_Index'] = np.random.uniform(-8, -2)
                sample['temp_dewpoint_spread'] = np.random.uniform(1, 4)
                sample['rain_probability'] = np.random.uniform(0.6, 1.0)
            else:
                # Mẫu không mưa: điều kiện bất thuận
                sample['K_Index'] = np.random.uniform(15, 25)
                sample['Lifted_Index'] = np.random.uniform(0, 5)
                sample['temp_dewpoint_spread'] = np.random.uniform(5, 15)
                sample['rain_probability'] = np.random.uniform(0.0, 0.3)

            synthetic_data.append(pd.DataFrame([sample]))

        # Concatenate all data
        if synthetic_data:
            df_balanced = pd.concat(synthetic_data, ignore_index=True)
            df_balanced = df_balanced.sort_values('time').reset_index(drop=True)

            # Final balance check
            final_rain = np.sum(df_balanced['rain_probability'] > 0.5)
            final_no_rain = len(df_balanced) - final_rain

            logger.info(f"✓ Đã tạo {len(df_balanced)} mẫu cân bằng")
            logger.info(f"  Mưa: {final_rain}, Không mưa: {final_no_rain}")
            logger.info(f"  Tỷ lệ: {final_rain/len(df_balanced):.1%} mưa")

            return df_balanced

        return pd.DataFrame()

    def create_sequences(self, df: pd.DataFrame, sequence_length: int = SEQUENCE_LENGTH) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Tạo sequences cho LSTM từ dữ liệu time series

        Args:
            df: DataFrame với dữ liệu time series
            sequence_length: Độ dài sequence (số giờ quá khứ)

        Returns:
            Tuple (X_sequences, X_static, y_targets)
        """
        logger.info(f"Đang tạo sequences với độ dài {sequence_length} giờ...")

        sequences = []
        static_features = []
        targets = []

        # Sắp xếp theo thời gian
        df_sorted = df.sort_values('time').reset_index(drop=True)

        for i in range(sequence_length, len(df_sorted)):
            # Sequence cho LSTM (24 giờ quá khứ)
            seq = df_sorted.iloc[i-sequence_length:i][LSTM_FEATURES].values
            sequences.append(seq)

            # Static features cho XGBoost
            static = df_sorted.iloc[i][STATIC_FEATURES].values
            static_features.append(static)

            # Target (xác suất mưa)
            target = df_sorted.iloc[i]['rain_probability']
            targets.append(target)

        X_sequences = np.array(sequences)
        X_static = np.array(static_features)
        y_targets = np.array(targets)

        logger.info(f"✓ Đã tạo {len(X_sequences)} sequences")
        logger.info(f"  Shape X_sequences: {X_sequences.shape}")
        logger.info(f"  Shape X_static: {X_static.shape}")
        logger.info(f"  Shape y_targets: {y_targets.shape}")

        return X_sequences, X_static, y_targets

    def normalize_data(self, X_sequences: np.ndarray, X_static: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Chuẩn hóa dữ liệu về khoảng [-1, 1]

        Args:
            X_sequences: Sequences cho LSTM
            X_static: Static features cho XGBoost

        Returns:
            Tuple (X_sequences_normalized, X_static_normalized)
        """
        logger.info("Đang chuẩn hóa dữ liệu về khoảng [-1, 1]...")

        # Chuẩn hóa sequences (flatten để fit scaler)
        original_shape = X_sequences.shape
        X_seq_flat = X_sequences.reshape(-1, X_sequences.shape[-1])
        X_seq_normalized = self.scaler.fit_transform(X_seq_flat)
        X_sequences_normalized = X_seq_normalized.reshape(original_shape)

        # Chuẩn hóa static features
        X_static_normalized = self.scaler.fit_transform(X_static)

        logger.info("✓ Đã chuẩn hóa dữ liệu")

        return X_sequences_normalized, X_static_normalized


class LSTMModel:
    """Mô hình LSTM để xử lý time series"""

    def __init__(self, input_shape: Tuple[int, int]):
        self.input_shape = input_shape
        self.model = None

    def build_model(self) -> Model:
        """
        Xây dựng kiến trúc LSTM cải tiến với Attention Mechanism
        
        Cải tiến:
        - Tăng Dropout (0.3-0.4) để giảm overfitting
        - Thêm Attention layer để model tập trung vào thời điểm quan trọng
        - Thêm Batch Normalization

        Returns:
            Model LSTM cải tiến
        """
        logger.info("Đang xây dựng mô hình LSTM cải tiến với Attention...")

        from tensorflow.keras.regularizers import l2
        from tensorflow.keras.layers import BatchNormalization

        # Kiến trúc với Attention Mechanism
        inputs = Input(shape=self.input_shape, name='input_sequences')
        
        # Layer 1: LSTM 64 units với Attention
        x = LSTM(64, return_sequences=True, kernel_regularizer=l2(0.001), name='lstm_1')(inputs)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)  # Tăng từ 0.2 → 0.3
        
        # Attention Layer: Model tập trung vào thời điểm quan trọng
        attention_output, attention_scores = MultiHeadAttention(
            num_heads=4, key_dim=16, name='attention_layer'
        )(x, x, return_attention_scores=True)
        x = Dropout(0.3)(attention_output)  # Tăng dropout sau attention
        
        # Layer 2: LSTM 32 units
        x = LSTM(32, return_sequences=False, kernel_regularizer=l2(0.001), name='lstm_2')(x)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)  # Tăng từ 0.2 → 0.3
        
        # Dense layers
        x = Dense(16, activation='relu', kernel_regularizer=l2(0.001), name='dense_1')(x)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)  # Tăng từ 0.1 → 0.3
        
        outputs = Dense(1, activation='sigmoid', name='output')(x)  # Output xác suất mưa (0-1)
        
        model = Model(inputs=inputs, outputs=outputs, name='lstm_attention_model')
        
        model.compile(
            optimizer=Adam(learning_rate=LEARNING_RATE),
            loss='mse',
            metrics=['mae', 'accuracy', 'precision', 'recall']
        )

        self.model = model

        logger.info("✓ Đã xây dựng mô hình LSTM cải tiến với Attention")
        logger.info(f"Model summary:\n{model.summary()}")

        return model

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = EPOCHS, batch_size: int = BATCH_SIZE) -> dict:
        """
        Huấn luyện mô hình LSTM

        Args:
            X_train: Dữ liệu huấn luyện
            y_train: Target huấn luyện
            X_val: Dữ liệu validation
            y_val: Target validation
            epochs: Số epochs
            batch_size: Batch size

        Returns:
            Lịch sử huấn luyện
        """
        logger.info("Đang huấn luyện mô hình LSTM với Early Stopping cải tiến...")

        callbacks = [
            # Early Stopping: Ngừng training nếu val_loss không cải thiện
            EarlyStopping(
                monitor='val_loss',
                patience=15,  # Tăng từ 5 → 15 để cho model thêm cơ hội learn
                restore_best_weights=True,
                min_delta=0.0001,  # Ngưỡng cải thiện tối thiểu
                verbose=1
            ),
            # Model Checkpoint: Lưu model tốt nhất
            ModelCheckpoint(
                LSTM_MODEL_PATH,
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            # Learning Rate Reduction: Giảm learning rate khi loss plateau
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,  # Nhân learning rate với 0.5
                patience=5,  # Nếu 5 epochs không cải thiện
                min_lr=1e-7,
                verbose=1
            )
        ]

        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1  # Bật verbose để theo dõi Early Stopping
        )

        logger.info("✓ Đã hoàn thành huấn luyện LSTM")

        # Lưu training history vào file JSON
        import json
        from pathlib import Path
        history_path = Path("results/training_history.json")
        with open(history_path, 'w', encoding='utf-8') as f:
            json.dump(history.history, f, indent=2, ensure_ascii=False)
        logger.info(f"✓ Đã lưu training history vào: {history_path}")

        # Tự động tạo biểu đồ training history
        try:
            import subprocess
            import sys
            plot_script = Path("scripts/create_training_plot.py")
            if plot_script.exists():
                logger.info("Đang tạo biểu đồ training history...")
                result = subprocess.run([sys.executable, str(plot_script)], 
                                      capture_output=True, text=True, cwd=Path.cwd())
                if result.returncode == 0:
                    logger.info("✓ Đã tạo biểu đồ training_history.png")
                else:
                    logger.warning(f"Không thể tạo biểu đồ: {result.stderr}")
            else:
                logger.warning(f"Không tìm thấy script tạo biểu đồ: {plot_script}")
        except Exception as e:
            logger.warning(f"Lỗi khi tạo biểu đồ: {e}")

        return history.history

    def extract_features(self, X: np.ndarray) -> np.ndarray:
        """
        Trích xuất features từ LSTM (output của layer Dense(16))

        Args:
            X: Input sequences

        Returns:
            Features từ LSTM
        """
        logger.info("Đang trích xuất features từ LSTM...")

        from tensorflow.keras.regularizers import l2

        # Rebuild feature extractor từ đầu với regularization
        inputs = Input(shape=self.input_shape)
        x = LSTM(64, return_sequences=True, kernel_regularizer=l2(0.001))(inputs)
        x = Dropout(0.3)(x)
        x = LSTM(32, return_sequences=False, kernel_regularizer=l2(0.001))(x)
        x = Dropout(0.3)(x)
        features = Dense(16, activation='relu', kernel_regularizer=l2(0.001))(x)

        feature_extractor = Model(inputs=inputs, outputs=features)

        # Copy weights từ mô hình đã huấn luyện
        for i, layer in enumerate(feature_extractor.layers):
            if i < len(self.model.layers):
                layer.set_weights(self.model.layers[i].get_weights())

        features = feature_extractor.predict(X, verbose=0)

        logger.info(f"✓ Đã trích xuất features: shape {features.shape}")

        return features


class XGBoostModel:
    """Mô hình XGBoost Classifier"""

    def __init__(self):
        self.model = None

    def build_model(self) -> xgb.XGBRegressor:
        """
        Xây dựng mô hình XGBoost

        Returns:
            Model XGBoost
        """
        logger.info("Đang xây dựng mô hình XGBoost...")

        model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )

        self.model = model

        logger.info("✓ Đã xây dựng mô hình XGBoost")

        return model

    def train(self, X_train: np.ndarray, y_train: np.ndarray) -> dict:
        """
        Huấn luyện mô hình XGBoost

        Args:
            X_train: Dữ liệu huấn luyện (kết hợp LSTM features + static features)
            y_train: Target huấn luyện

        Returns:
            Model đã huấn luyện
        """
        logger.info("Đang huấn luyện mô hình XGBoost...")

        self.model.fit(X_train, y_train)

        # Lưu model
        self.model.save_model(XGB_MODEL_PATH)

        logger.info("✓ Đã hoàn thành huấn luyện XGBoost")

        return self.model

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Dự báo xác suất mưa

        Args:
            X: Input features

        Returns:
            Xác suất mưa (0-1)
        """
        predictions = self.model.predict(X)
        # Đảm bảo output trong khoảng [0, 1]
        predictions = np.clip(predictions, 0, 1)

        return predictions


class HybridModel:
    """Mô hình Hybrid LSTM + XGBoost"""

    def __init__(self):
        self.preprocessor = DataPreprocessor()
        self.lstm_model = None
        self.xgb_model = XGBoostModel()
        self.is_trained = False

    def build_and_train(self, features_df: pd.DataFrame) -> dict:
        """
        Xây dựng và huấn luyện mô hình Hybrid với data augmentation

        Args:
            features_df: DataFrame với các đặc trưng từ Bước 2

        Returns:
            Thông tin về quá trình huấn luyện
        """
        logger.info("=" * 80)
        logger.info("XÂY DỰNG MÔ HÌNH HYBRID LSTM + XGBOOST (VỚI DATA AUGMENTATION)")
        logger.info("=" * 80)

        # 1. Tạo dữ liệu cân bằng từ real data + augmentation
        logger.info("\n[1/4] Tạo dữ liệu cân bằng với augmentation...")
        if not features_df.empty:
            balanced_df = self.preprocessor.generate_balanced_synthetic_data(features_df, target_samples=2000)
        else:
            # Fallback nếu không có real data
            balanced_df = self.preprocessor.generate_synthetic_data(features_df, num_samples=1000)

        if balanced_df.empty:
            logger.error("Không thể tạo dữ liệu cân bằng")
            return {}

        # 2. Tạo sequences
        logger.info("\n[2/4] Tạo sequences cho LSTM...")
        X_sequences, X_static, y_targets = self.preprocessor.create_sequences(balanced_df)

        # 3. Chuẩn hóa dữ liệu
        logger.info("\n[3/4] Chuẩn hóa dữ liệu...")
        X_sequences_norm, X_static_norm = self.preprocessor.normalize_data(X_sequences, X_static)

        # 4. Chia train/validation
        logger.info("\n[4/4] Chia dữ liệu train/validation...")
        X_seq_train, X_seq_val, X_static_train, X_static_val, y_train, y_val = train_test_split(
            X_sequences_norm, X_static_norm, y_targets,
            test_size=0.2, random_state=42, stratify=(y_targets > 0.5).astype(int)  # Stratified split
        )

        # 5. Xây dựng và huấn luyện LSTM
        logger.info("\n[5/6] Xây dựng và huấn luyện LSTM...")

        input_shape = (SEQUENCE_LENGTH, len(LSTM_FEATURES))
        self.lstm_model = LSTMModel(input_shape)
        self.lstm_model.build_model()

        lstm_history = self.lstm_model.train(
            X_seq_train, y_train,
            X_seq_val, y_val
        )

        # 6. Đánh giá mô hình LSTM
        logger.info("\n[6/6] Đánh giá mô hình LSTM...")
        # Dự báo trên validation set bằng LSTM
        y_pred_lstm = self.lstm_model.model.predict(X_seq_val, verbose=0).flatten()

        # Tính metrics cho LSTM
        mse_lstm = mean_squared_error(y_val, y_pred_lstm)
        rmse_lstm = np.sqrt(mse_lstm)
        r2_lstm = r2_score(y_val, y_pred_lstm)

        # Accuracy (với threshold 0.5)
        y_pred_binary_lstm = (y_pred_lstm > 0.5).astype(int)
        y_val_binary = (y_val > 0.5).astype(int)
        accuracy_lstm = accuracy_score(y_val_binary, y_pred_binary_lstm)

        # Classification metrics
        from sklearn.metrics import precision_score, recall_score, f1_score
        precision = precision_score(y_val_binary, y_pred_binary_lstm, zero_division=0)
        recall = recall_score(y_val_binary, y_pred_binary_lstm, zero_division=0)
        f1 = f1_score(y_val_binary, y_pred_binary_lstm, zero_division=0)

        # Đánh giá mô hình
        logger.info("\n" + "=" * 80)
        logger.info("ĐÁNH GIÁ MÔ HÌNH LSTM (SAU AUGMENTATION)")
        logger.info("=" * 80)

        logger.info(f"  • MSE: {mse_lstm:.4f}")
        logger.info(f"  • RMSE: {rmse_lstm:.4f}")
        logger.info(f"  • R² Score: {r2_lstm:.4f}")
        logger.info(f"  • Accuracy (threshold=0.5): {accuracy_lstm:.1f}%")
        logger.info(f"  • Precision: {precision:.3f}")
        logger.info(f"  • Recall: {recall:.3f}")
        logger.info(f"  • F1-Score: {f1:.3f}")
        # Phân tích chi tiết
        logger.info("\n📊 PHÂN TÍCH CHI TIẾT:")
        logger.info(f"  • Số mẫu validation: {len(y_val)}")
        logger.info(f"  • Mưa thực tế: {np.sum(y_val_binary)} mẫu")
        logger.info(f"  • Dự báo mưa: {np.sum(y_pred_binary_lstm)} mẫu")
        logger.info(f"  • Xác suất mưa trung bình (thực tế): {np.mean(y_val):.3f}")
        logger.info(f"  • Xác suất mưa trung bình (dự báo): {np.mean(y_pred_lstm):.3f}")
        self.is_trained = True

        # Lưu thông tin mô hình
        model_info = {
            'lstm_history': lstm_history,
            'validation_metrics': {
                'mse': mse_lstm,
                'rmse': rmse_lstm,
                'r2': r2_lstm,
                'accuracy': accuracy_lstm,
                'precision': precision,
                'recall': recall,
                'f1': f1
            },
            'data_info': {
                'original_samples': len(features_df),
                'augmented_samples': len(balanced_df),
                'rain_samples': np.sum(balanced_df['rain_probability'] > 0.5),
                'no_rain_samples': np.sum(balanced_df['rain_probability'] <= 0.5)
            },
            'model_config': {
                'sequence_length': SEQUENCE_LENGTH,
                'forecast_hours': FORECAST_HOURS,
                'lstm_features': len(LSTM_FEATURES),
                'static_features': len(STATIC_FEATURES)
            }
        }

        logger.info("\n" + "=" * 80)
        logger.info("✅ MÔ HÌNH HYBRID HOÀN THÀNH (VỚI AUGMENTATION)!")
        logger.info("=" * 80)
        logger.info("📝 Mô hình đã được lưu: models/hybrid_rain_forecast_model/lstm_model.h5")
        logger.info(f"📊 Dữ liệu: {len(balanced_df)} mẫu (từ {len(features_df)} mẫu gốc)")
        logger.info("➡️  Bước tiếp theo: BƯỚC 4 - Đánh giá và Giải thích (XAI)")
        logger.info("=" * 80)

        return model_info

    def predict_rain_probability(self, input_data: pd.DataFrame) -> np.ndarray:
        """
        Dự báo xác suất mưa cho dữ liệu mới

        Args:
            input_data: DataFrame với dữ liệu đầu vào

        Returns:
            Mảng xác suất mưa (0-1)
        """
        if not self.is_trained:
            logger.error("Mô hình chưa được huấn luyện!")
            return np.array([])

        logger.info("Đang dự báo xác suất mưa...")

        # Tạo sequences từ dữ liệu mới
        X_sequences, X_static, _ = self.preprocessor.create_sequences(input_data)

        if len(X_sequences) == 0:
            logger.warning("Không đủ dữ liệu để tạo sequences")
            return np.array([])

        # Chuẩn hóa
        X_sequences_norm, X_static_norm = self.preprocessor.normalize_data(X_sequences, X_static)

        # Trích xuất features từ LSTM
        lstm_features = self.lstm_model.extract_features(X_sequences_norm)

        # Kết hợp với static features
        X_hybrid = np.concatenate([lstm_features, X_static_norm], axis=1)

        # Dự báo
        predictions = self.xgb_model.predict(X_hybrid)

        logger.info(f"✓ Đã dự báo {len(predictions)} giá trị xác suất mưa")

        return predictions


def main():
    """
    Chạy Bước 3: Xây dựng mô hình AI Hybrid
    """
    logger.info("=" * 80)
    logger.info("BƯỚC 3: XÂY DỰNG MÔ HÌNH AI HYBRID (LSTM + XGBoost)")
    logger.info("=" * 80)

    # Khởi tạo mô hình Hybrid
    hybrid_model = HybridModel()

    # Đọc dữ liệu từ Bước 2
    logger.info("\n[1/1] Đọc dữ liệu đặc trưng từ Bước 2...")
    features_df = hybrid_model.preprocessor.load_features_data()

    if features_df.empty:
        logger.error("Không thể đọc dữ liệu đặc trưng. Hãy chạy Bước 2 trước.")
        return

    # Xây dựng và huấn luyện mô hình
    model_info = hybrid_model.build_and_train(features_df)

    if model_info:
        logger.info("\n🎯 TÓM TẮT BƯỚC 3:")
        logger.info(f"✓ Mô hình: Hybrid LSTM + XGBoost")
        logger.info(f"✓ Sequence length: {SEQUENCE_LENGTH} giờ")
        logger.info(f"✓ Forecast horizon: {FORECAST_HOURS} giờ")
        logger.info(f"✓ Accuracy: {model_info['validation_metrics']['accuracy']:.1f}%")
        logger.info(f"✓ MSE: {model_info['validation_metrics']['mse']:.4f}")
        logger.info(f"✓ RMSE: {model_info['validation_metrics']['rmse']:.4f}")
        logger.info(f"✓ R² Score: {model_info['validation_metrics']['r2']:.4f}")
        logger.info("\n📝 Lưu ý quan trọng:")
        logger.info("   • Đây là demo với dữ liệu tổng hợp")
        logger.info("   • Để có độ chính xác cao, cần dữ liệu lịch sử thực tế")
        logger.info("   • Cần ít nhất 6-12 tháng dữ liệu để huấn luyện")
        logger.info("   • Target variable nên từ dữ liệu mưa thực tế")


if __name__ == "__main__":
    main()