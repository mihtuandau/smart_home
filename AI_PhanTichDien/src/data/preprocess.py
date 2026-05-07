from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import pandas as pd
import yaml


def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def validate_required_columns(df: pd.DataFrame, required_columns: list[str]) -> None:
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def normalize_timestamp_column(df: pd.DataFrame, timestamp_col: str) -> pd.DataFrame:
    if timestamp_col in df.columns:
        return df

    aliases = ("time", "datetime", "date", "created_at")
    for alias in aliases:
        if alias in df.columns:
            df = df.rename(columns={alias: timestamp_col})
            return df

    return df


def cast_numeric_columns(df: pd.DataFrame, numeric_columns: list[str]) -> pd.DataFrame:
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def fill_missing_values(
    df: pd.DataFrame, numeric_columns: list[str], strategy: str = "median"
) -> pd.DataFrame:
    if strategy == "median":
        for col in numeric_columns:
            df[col] = df[col].fillna(df[col].median())
    elif strategy == "mean":
        for col in numeric_columns:
            df[col] = df[col].fillna(df[col].mean())
    elif strategy == "zero":
        for col in numeric_columns:
            df[col] = df[col].fillna(0)
    else:
        raise ValueError(f"Unsupported fillna strategy: {strategy}")
    return df


def add_time_features(
    df: pd.DataFrame, timestamp_col: str, time_cfg: dict[str, bool]
) -> pd.DataFrame:
    df[timestamp_col] = pd.to_datetime(df[timestamp_col], errors="coerce")
    df = df.dropna(subset=[timestamp_col]).copy()

    if time_cfg.get("add_hour", True):
        df["hour"] = df[timestamp_col].dt.hour.astype(int)
    if time_cfg.get("add_day_of_week", True):
        df["day_of_week"] = df[timestamp_col].dt.dayofweek.astype(int)
    if time_cfg.get("add_is_weekend", True):
        df["is_weekend"] = (df[timestamp_col].dt.dayofweek >= 5).astype(int)
    return df


def preprocess_data(config_path: str) -> pd.DataFrame:
    config = load_config(config_path)

    raw_csv = config["paths"]["raw_csv"]
    processed_csv = config["paths"]["processed_csv"]
    data_cfg = config["data"]
    feature_cfg = config["features"]

    df = pd.read_csv(raw_csv)
    df = normalize_timestamp_column(df, data_cfg["timestamp_col"])

    validate_required_columns(df, data_cfg["required_columns"])

    timestamp_col = data_cfg["timestamp_col"]
    numeric_columns = data_cfg["numeric_columns"]

    df = cast_numeric_columns(df, numeric_columns)
    df = fill_missing_values(df, numeric_columns, data_cfg.get("fillna_strategy", "median"))
    df = add_time_features(df, timestamp_col, feature_cfg.get("time", {}))

    if data_cfg.get("drop_duplicates", True):
        df = df.drop_duplicates().copy()

    output_path = Path(processed_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    return df


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preprocess ESP32 power consumption CSV data.")
    parser.add_argument(
        "--config",
        type=str,
        default="configs/config.yaml",
        help="Path to YAML config file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    processed_df = preprocess_data(args.config)
    print(
        f"Preprocessing completed. Output rows: {len(processed_df)}, "
        f"columns: {len(processed_df.columns)}"
    )


if __name__ == "__main__":
    main()
