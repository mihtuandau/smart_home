#!/usr/bin/env python3
"""
BƯỚC 4: ĐÁNH GIÁ VÀ GIẢI THÍCH MÔ HÌNH (XAI)

Mục tiêu:
1. Đánh giá hiệu năng mô hình LSTM trên tập validation
2. Phân tích độ nhạy đặc trưng bằng gradient sensitivity
3. Lưu báo cáo đánh giá và các đặc trưng quan trọng
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import load_model

try:
    from .hybrid_model import DataPreprocessor, HybridModel, FEATURES_DATA_FILE, LSTM_MODEL_PATH, SEQUENCE_LENGTH, LSTM_FEATURES, STATIC_FEATURES
except ImportError:
    from hybrid_model import DataPreprocessor, HybridModel, FEATURES_DATA_FILE, LSTM_MODEL_PATH, SEQUENCE_LENGTH, LSTM_FEATURES, STATIC_FEATURES

# ========== CẤU HÌNH ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

REPORT_FILE = Path("results/model_evaluation_report.json")


class XAIAnalyzer:
    """Đánh giá và giải thích mô hình"""

    def __init__(self):
        self.preprocessor = DataPreprocessor()
        self.model = None

    def load_features_data(self, file_path: Optional[Path] = None) -> pd.DataFrame:
        if file_path is None:
            file_path = FEATURES_DATA_FILE

        if not file_path.exists():
            logger.error(f"File dữ liệu đặc trưng không tồn tại: {file_path}")
            return pd.DataFrame()

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        logger.info(f"✓ Đã đọc {len(df)} bản ghi đặc trưng")
        return df

    def ensure_model(self):
        if LSTM_MODEL_PATH.exists():
            logger.info(f"Đang load mô hình LSTM đã lưu từ: {LSTM_MODEL_PATH}")
            self.model = load_model(LSTM_MODEL_PATH, compile=False)
        else:
            logger.warning("Không tìm thấy mô hình LSTM đã lưu. Sẽ huấn luyện lại bằng Bước 3.")
            hybrid = HybridModel()
            features_df = self.load_features_data()
            if features_df.empty:
                return False
            hybrid.build_and_train(features_df)
            if not LSTM_MODEL_PATH.exists():
                logger.error("Không thể tạo mô hình LSTM sau khi huấn luyện.")
                return False
            self.model = load_model(LSTM_MODEL_PATH)
        return True

    def build_evaluation_data(self, feature_df: pd.DataFrame, num_samples: int = 1000):
        # Tạo cột rain_probability từ rain_mm nếu chưa có
        if 'rain_probability' not in feature_df.columns:
            feature_df['rain_probability'] = (feature_df['rain_mm'] > 0).astype(int)
            logger.info(f"✓ Đã tạo cột rain_probability từ rain_mm")

        synthetic_df = self.preprocessor.generate_balanced_synthetic_data(feature_df, target_samples=num_samples)
        X_sequences, X_static, y_targets = self.preprocessor.create_sequences(synthetic_df)
        X_sequences_norm, X_static_norm = self.preprocessor.normalize_data(X_sequences, X_static)
        X_seq_train, X_seq_val, X_static_train, X_static_val, y_train, y_val = train_test_split(
            X_sequences_norm, X_static_norm, y_targets,
            test_size=0.2, random_state=42
        )
        logger.info(f"✓ Đã chuẩn bị dữ liệu đánh giá: {len(y_val)} mẫu validation")
        return X_seq_val, X_static_val, y_val

    def evaluate_model(self, X_seq_val, y_val) -> Dict:
        logger.info("Đang đánh giá mô hình trên tập validation...")
        y_pred = self.model.predict(X_seq_val, verbose=0).flatten()
        y_val_binary = (y_val > 0.5).astype(int)
        y_pred_binary = (y_pred > 0.5).astype(int)

        mse = mean_squared_error(y_val, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_val, y_pred)
        accuracy = accuracy_score(y_val_binary, y_pred_binary)

        metrics = {
            'mse': float(mse),
            'rmse': float(rmse),
            'r2': float(r2),
            'accuracy': float(accuracy),
            'target_mean': float(np.mean(y_val)),
            'prediction_mean': float(np.mean(y_pred)),
            'num_samples': int(len(y_val))
        }

        logger.info(f"  • MSE: {metrics['mse']:.4f}")
        logger.info(f"  • RMSE: {metrics['rmse']:.4f}")
        logger.info(f"  • R²: {metrics['r2']:.4f}")
        logger.info(f"  • Accuracy: {metrics['accuracy']:.3f}")
        logger.info(f"  • Target mean: {metrics['target_mean']:.3f}")
        logger.info(f"  • Prediction mean: {metrics['prediction_mean']:.3f}")

        return metrics, y_pred

    def compute_gradient_feature_importance(self, X_seq_val) -> Dict[str, float]:
        logger.info("Đang tính độ nhạy đặc trưng bằng gradient sensitivity...")
        X = tf.convert_to_tensor(X_seq_val, dtype=tf.float32)
        with tf.GradientTape() as tape:
            tape.watch(X)
            y_pred = self.model(X, training=False)
        grads = tape.gradient(y_pred, X)
        grads = tf.abs(grads).numpy()
        importance = grads.mean(axis=(0, 1))

        importance_score = importance / (importance.sum() + 1e-12)
        feature_importance = {
            feature: float(importance_score[idx])
            for idx, feature in enumerate(LSTM_FEATURES)
        }

        logger.info("✓ Đã tính xong độ nhạy đặc trưng")
        return feature_importance

    def compute_correlation(self, X_seq_val, y_val) -> Dict[str, float]:
        logger.info("Đang tính correlation giữa đặc trưng và target...")
        last_step = X_seq_val[:, -1, :]
        correlations = {}
        for idx, feature in enumerate(LSTM_FEATURES):
            try:
                corr = np.corrcoef(last_step[:, idx], y_val)[0, 1]
                correlations[feature] = float(np.nan_to_num(corr))
            except Exception:
                correlations[feature] = 0.0

        logger.info("✓ Đã tính xong correlation")
        return correlations

    def save_report(self, report: Dict):
        with open(REPORT_FILE, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        logger.info(f"✓ Đã lưu báo cáo XAI vào: {REPORT_FILE}")

    def run(self):
        logger.info("=" * 80)
        logger.info("BƯỚC 4: ĐÁNH GIÁ VÀ GIẢI THÍCH MÔ HÌNH (XAI)")
        logger.info("=" * 80)

        features_df = self.load_features_data()
        if features_df.empty:
            logger.error("Không thể đọc dữ liệu đặc trưng. Hãy chạy Bước 2 trước.")
            return

        if not self.ensure_model():
            return

        X_seq_val, X_static_val, y_val = self.build_evaluation_data(features_df)
        metrics, y_pred = self.evaluate_model(X_seq_val, y_val)
        gradient_importance = self.compute_gradient_feature_importance(X_seq_val)
        correlation = self.compute_correlation(X_seq_val, y_val)

        report = {
            'evaluation_metrics': metrics,
            'gradient_feature_importance': gradient_importance,
            'feature_correlation': correlation,
            'notes': [
                "Gradient sensitivity đo độ nhạy của output với mỗi đặc trưng đầu vào.",
                "Correlation là chỉ báo phụ giúp hiểu hướng ảnh hưởng của từng đặc trưng.",
                "Kết quả đánh giá sử dụng dữ liệu tổng hợp demo. Dùng dữ liệu thực tế sẽ cho kết quả tin cậy hơn."
            ]
        }

        self.save_report(report)
        logger.info("\n📌 TOP 5 đặc trưng quan trọng theo gradient sensitivity:")
        sorted_features = sorted(gradient_importance.items(), key=lambda x: x[1], reverse=True)
        for feature, score in sorted_features[:5]:
            logger.info(f"  • {feature}: {score:.4f}")

        logger.info("\nBƯỚC 4 HOÀN THÀNH!" )
        logger.info("=" * 80)


def main():
    analyzer = XAIAnalyzer()
    analyzer.run()


if __name__ == "__main__":
    main()
