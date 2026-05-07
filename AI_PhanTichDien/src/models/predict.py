from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a script from any directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import argparse
from typing import Any

import joblib
import pandas as pd
import yaml

from src.utils.logger import setup_logger

logger = setup_logger("Inference")

def load_config(config_path: str) -> dict[str, Any]:
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        raise

def resolve_path(path_str: str) -> Path:
    project_root = Path(__file__).resolve().parents[2]
    return (project_root / path_str).resolve()


def _normalize_timestamp_column(df: pd.DataFrame, timestamp_col: str) -> pd.DataFrame:
    if timestamp_col in df.columns:
        return df
    for alias in ("time", "datetime", "date", "created_at"):
        if alias in df.columns:
            return df.rename(columns={alias: timestamp_col})
    return df


def _add_time_features(df: pd.DataFrame, timestamp_col: str) -> pd.DataFrame:
    def _parse_ts(val: Any) -> pd.Timestamp:
        ts = pd.to_datetime(val, errors="coerce")
        if pd.notna(ts):
            return ts
        try:
            num = float(val)
        except Exception:
            return pd.NaT
        if abs(num) >= 1e12:
            return pd.to_datetime(num, unit="ms", errors="coerce")
        return pd.to_datetime(num, unit="s", errors="coerce")

    if timestamp_col in df.columns:
        ts = df[timestamp_col].apply(_parse_ts)
        df["hour"] = ts.dt.hour
        df["day_of_week"] = ts.dt.dayofweek
        df["is_weekend"] = (df["day_of_week"] >= 5).astype("Int64")
    elif "hour" not in df.columns:
        df["hour"] = pd.NA
    return df


class PowerInferenceService:
    def __init__(self, config_path: str = "configs/config.yaml") -> None:
        self.config = load_config(config_path)
        paths = self.config["paths"]

        try:
            self.kmeans = joblib.load(resolve_path(paths["kmeans_model"]))
            self.iforest = joblib.load(resolve_path(paths["iforest_model"]))
            self.kmeans_meta = joblib.load(resolve_path("models/kmeans_metadata.pkl"))
            self.iforest_meta = joblib.load(resolve_path("models/iforest_metadata.pkl"))
            logger.info("Successfully loaded all AI models.")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise

        self.kmeans_scaler = None
        self.iforest_scaler = None
        kmeans_scaler_path = resolve_path("models/kmeans_scaler.pkl")
        iforest_scaler_path = resolve_path("models/iforest_scaler.pkl")
        
        if kmeans_scaler_path.exists():
            self.kmeans_scaler = joblib.load(kmeans_scaler_path)
        if iforest_scaler_path.exists():
            self.iforest_scaler = joblib.load(iforest_scaler_path)

        self.timestamp_col = self.config["data"]["timestamp_col"]
        self.numeric_cols = self.config["data"]["numeric_columns"]
        self.anomaly_threshold = self.config["realtime"]["inference"]["anomaly_score_threshold"]

    def _prepare_input(self, payload: dict[str, Any]) -> pd.DataFrame:
        df = pd.DataFrame([payload])
        df = _normalize_timestamp_column(df, self.timestamp_col)
        df = _add_time_features(df, self.timestamp_col)
        for col in self.numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        
        # Fill missing numeric values with 0
        for col in self.numeric_cols:
            if col in df.columns:
                df[col] = df[col].fillna(0)
        return df

    def predict_one(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            df = self._prepare_input(payload)
            raw_derived_hour = None
            if "hour" in df.columns:
                hour_val = pd.to_numeric(df["hour"], errors="coerce").iloc[0]
                raw_derived_hour = None if pd.isna(hour_val) else int(hour_val)

            kmeans_features = self.kmeans_meta["features"]
            iforest_features = self.iforest_meta["features"]
            
            # Ensure all required features exist
            for col in set(kmeans_features + iforest_features):
                if col not in df.columns:
                    df[col] = 0
            
            for col in ("hour", "day_of_week", "is_weekend"):
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

            # K-Means Prediction
            x_kmeans = df[kmeans_features]
            if self.kmeans_scaler is not None:
                x_kmeans = self.kmeans_scaler.transform(x_kmeans)
            cluster_id = int(self.kmeans.predict(x_kmeans)[0])

            # Isolation Forest Prediction
            x_iforest = df[iforest_features]
            if self.iforest_scaler is not None:
                x_iforest = self.iforest_scaler.transform(x_iforest)
            
            decision_score = float(self.iforest.decision_function(x_iforest)[0])
            model_pred = int(self.iforest.predict(x_iforest)[0])  # -1 anomaly, 1 normal
            is_anomaly = (model_pred == -1) or (decision_score < self.anomaly_threshold)

            return {
                "cluster_id": cluster_id,
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": round(decision_score, 6),
                "model_pred": model_pred,
                "derived_hour": raw_derived_hour,
            }
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {
                "cluster_id": -1,
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "model_pred": 1,
                "error": str(e)
            }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run one-shot inference on processed CSV row.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    parser.add_argument(
        "--input_csv",
        type=str,
        default="data/processed/smart_home_processed.csv",
        help="CSV file to take the first row for inference smoke test.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    service = PowerInferenceService(args.config)
    sample = pd.read_csv(args.input_csv).iloc[0].to_dict()
    result = service.predict_one(sample)
    print("Inference completed.")
    print(result)


if __name__ == "__main__":
    main()
