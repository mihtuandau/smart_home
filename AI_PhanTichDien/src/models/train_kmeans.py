from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
import yaml
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

# Allow running as a script: python src/models/train_kmeans.py
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
        raise ValueError(f"Missing kmeans features in processed data: {missing}")


def train_kmeans(config_path: str) -> dict[str, Any]:
    config = load_config(config_path)
    paths_cfg = config["paths"]
    features_cfg = config["features"]
    train_cfg = config["training"]["kmeans"]
    random_state = config["project"]["random_state"]

    data_path = resolve_path(paths_cfg["processed_csv"])
    model_path = resolve_path(paths_cfg["kmeans_model"])
    models_dir = resolve_path(paths_cfg["models_dir"])
    scaler_path = models_dir / "kmeans_scaler.pkl"
    meta_path = models_dir / "kmeans_metadata.pkl"

    df = pd.read_csv(data_path)
    feature_cols = features_cfg["kmeans_features"]
    validate_features(df, feature_cols)

    x = df[feature_cols].copy()
    use_scaler = features_cfg.get("scale_features", True)
    scaler = None

    if use_scaler:
        scaler = StandardScaler()
        x_train = scaler.fit_transform(x)
    else:
        x_train = x.values

    model = KMeans(
        n_clusters=train_cfg["n_clusters"],
        init=train_cfg.get("init", "k-means++"),
        n_init=train_cfg.get("n_init", 10),
        max_iter=train_cfg.get("max_iter", 300),
        random_state=random_state,
    )
    cluster_labels = model.fit_predict(x_train)

    silhouette = None
    if len(set(cluster_labels)) > 1:
        silhouette = float(silhouette_score(x_train, cluster_labels))

    models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    if scaler is not None:
        joblib.dump(scaler, scaler_path)
    joblib.dump(
        {
            "features": feature_cols,
            "scale_features": use_scaler,
            "silhouette_score": silhouette,
            "n_clusters": train_cfg["n_clusters"],
        },
        meta_path,
    )

    return {
        "model_path": str(model_path),
        "scaler_path": str(scaler_path) if scaler is not None else None,
        "meta_path": str(meta_path),
        "silhouette_score": silhouette,
        "n_clusters": train_cfg["n_clusters"],
        "kmeans_inertia": float(model.inertia_),
        "num_samples": len(df),
        "models_dir": str(models_dir),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train K-Means model from processed data.")
    parser.add_argument(
        "--config",
        type=str,
        default="configs/config.yaml",
        help="Path to YAML config file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = train_kmeans(args.config)
    print("K-Means training completed.")
    print(f"Samples: {result['num_samples']}")
    print(f"Clusters: {result['n_clusters']}")
    print(f"Silhouette score: {result['silhouette_score']}")
    print(f"Model saved: {result['model_path']}")
    if result["scaler_path"]:
        print(f"Scaler saved: {result['scaler_path']}")
    print(f"Metadata saved: {result['meta_path']}")
    append_training_history(
        result["models_dir"],
        {
            "model_name": "kmeans",
            "kmeans_silhouette": result["silhouette_score"],
            "kmeans_inertia": result["kmeans_inertia"],
        },
    )


if __name__ == "__main__":
    main()
