from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
import yaml
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Allow running as a script: python src/models/train_isolation_forest.py
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.models.training_history import append_training_history


def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def resolve_path(path_str: str) -> Path:
    project_root = Path(__file__).resolve().parents[2]
    return (project_root / path_str).resolve()


def validate_features(df: pd.DataFrame, features: list[str]) -> None:
    missing = [col for col in features if col not in df.columns]
    if missing:
        raise ValueError(f"Missing isolation forest features in processed data: {missing}")


def train_isolation_forest(config_path: str) -> dict[str, Any]:
    config = load_config(config_path)
    paths_cfg = config["paths"]
    features_cfg = config["features"]
    train_cfg = config["training"]["isolation_forest"]
    random_state = config["project"]["random_state"]

    data_path = resolve_path(paths_cfg["processed_csv"])
    model_path = resolve_path(paths_cfg["iforest_model"])
    models_dir = resolve_path(paths_cfg["models_dir"])
    scaler_path = models_dir / "iforest_scaler.pkl"
    meta_path = models_dir / "iforest_metadata.pkl"

    df = pd.read_csv(data_path)
    feature_cols = features_cfg["iforest_features"]
    validate_features(df, feature_cols)

    x = df[feature_cols].copy()
    use_scaler = features_cfg.get("scale_features", True)
    scaler = None

    if use_scaler:
        scaler = StandardScaler()
        x_train = scaler.fit_transform(x)
    else:
        x_train = x.values

    model = IsolationForest(
        n_estimators=train_cfg.get("n_estimators", 100),
        contamination=train_cfg.get("contamination", "auto"),
        max_samples=train_cfg.get("max_samples", "auto"),
        bootstrap=train_cfg.get("bootstrap", False),
        random_state=random_state,
    )
    model.fit(x_train)

    preds = model.predict(x_train)
    anomaly_ratio = float((preds == -1).sum() / len(preds))
    decision_scores = model.decision_function(x_train)

    models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    if scaler is not None:
        joblib.dump(scaler, scaler_path)
    joblib.dump(
        {
            "features": feature_cols,
            "scale_features": use_scaler,
            "anomaly_ratio_on_train": anomaly_ratio,
            "decision_score_min": float(decision_scores.min()),
            "decision_score_max": float(decision_scores.max()),
            "decision_score_mean": float(decision_scores.mean()),
        },
        meta_path,
    )

    return {
        "model_path": str(model_path),
        "scaler_path": str(scaler_path) if scaler is not None else None,
        "meta_path": str(meta_path),
        "anomaly_ratio_on_train": anomaly_ratio,
        "decision_score_mean": float(decision_scores.mean()),
        "num_samples": len(df),
        "models_dir": str(models_dir),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Isolation Forest from processed data.")
    parser.add_argument(
        "--config",
        type=str,
        default="configs/config.yaml",
        help="Path to YAML config file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = train_isolation_forest(args.config)
    print("Isolation Forest training completed.")
    print(f"Samples: {result['num_samples']}")
    print(f"Anomaly ratio (train): {result['anomaly_ratio_on_train']:.4f}")
    print(f"Model saved: {result['model_path']}")
    if result["scaler_path"]:
        print(f"Scaler saved: {result['scaler_path']}")
    print(f"Metadata saved: {result['meta_path']}")
    append_training_history(
        result["models_dir"],
        {
            "model_name": "iforest",
            "iforest_anomaly_ratio": result["anomaly_ratio_on_train"],
            "iforest_score_mean": result["decision_score_mean"],
        },
    )


if __name__ == "__main__":
    main()
