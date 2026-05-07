from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pandas as pd
import yaml


def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_config(config_path: Path, config: dict[str, Any]) -> None:
    with config_path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(config, f, sort_keys=False, allow_unicode=True)


def resolve_path(path_str: str) -> Path:
    root = Path(__file__).resolve().parents[2]
    return (root / path_str).resolve()


def load_state(state_path: Path) -> dict[str, Any]:
    if not state_path.exists():
        return {"last_retrained_at": None, "last_total_rows": 0}
    with state_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state_path: Path, state: dict[str, Any]) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    with state_path.open("w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def normalize_timestamp(df: pd.DataFrame, target_col: str = "timestamp") -> pd.DataFrame:
    if target_col in df.columns:
        return df
    for alias in ("time", "datetime", "date", "created_at"):
        if alias in df.columns:
            return df.rename(columns={alias: target_col})
    return df


def merge_raw_sources(config: dict[str, Any]) -> tuple[Path, int]:
    raw_path = resolve_path(config["paths"]["raw_csv"])
    rt_path = resolve_path(config["paths"]["realtime_raw_csv"])
    merged_path = resolve_path(config["paths"]["merged_raw_csv"])

    frames: list[pd.DataFrame] = []
    if raw_path.exists():
        frames.append(pd.read_csv(raw_path))
    if rt_path.exists():
        frames.append(pd.read_csv(rt_path))
    if not frames:
        raise FileNotFoundError("No raw data found for retrain.")

    df = pd.concat(frames, ignore_index=True)
    df = normalize_timestamp(df, config["data"]["timestamp_col"])
    if config["data"]["timestamp_col"] in df.columns:
        df[config["data"]["timestamp_col"]] = pd.to_datetime(
            df[config["data"]["timestamp_col"]], errors="coerce"
        )
        df = df.dropna(subset=[config["data"]["timestamp_col"]])
        df = df.sort_values(config["data"]["timestamp_col"])
    df = df.drop_duplicates()

    merged_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(merged_path, index=False)
    return merged_path, len(df)


def should_retrain(config: dict[str, Any], state: dict[str, Any], total_rows: int) -> tuple[bool, str]:
    retrain_cfg = config["auto_retrain"]
    if not retrain_cfg.get("enabled", True):
        return False, "auto_retrain disabled"

    min_new_rows = int(retrain_cfg.get("min_new_rows", 200))
    interval_days = int(retrain_cfg.get("interval_days", 7))
    last_rows = int(state.get("last_total_rows", 0))
    new_rows = max(0, total_rows - last_rows)

    last_ts = state.get("last_retrained_at")
    if not last_ts:
        return True, "first retrain run"

    last_dt = datetime.fromisoformat(last_ts)
    due_time = datetime.now() - timedelta(days=interval_days)
    is_due = last_dt <= due_time

    if new_rows >= min_new_rows and is_due:
        return True, f"due and enough new rows ({new_rows})"
    if new_rows >= min_new_rows and not is_due:
        return False, f"not due yet; new rows={new_rows}"
    if is_due and new_rows > 0:
        return True, f"due and has new rows ({new_rows})"
    return False, f"skip retrain; due={is_due}, new rows={new_rows}"


def run_pipeline(config_path: Path) -> None:
    py = sys.executable
    cmds = [
        [py, "src/data/preprocess.py", "--config", str(config_path)],
        [py, "src/models/train_kmeans.py", "--config", str(config_path)],
        [py, "src/models/train_isolation_forest.py", "--config", str(config_path)],
    ]
    for cmd in cmds:
        subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Smart auto-retrain manager.")
    parser.add_argument("--config", default="configs/config.yaml")
    args = parser.parse_args()

    base_config_path = resolve_path(args.config)
    config = load_config(str(base_config_path))

    merged_raw_path, total_rows = merge_raw_sources(config)
    state_path = resolve_path(config["paths"]["retrain_state"])
    state = load_state(state_path)
    do_retrain, reason = should_retrain(config, state, total_rows)
    print(f"[auto-retrain] decision: {do_retrain} ({reason})")

    if not do_retrain:
        return

    tmp_config_path = base_config_path.with_name("config.retrain.tmp.yaml")
    tmp_config = dict(config)
    tmp_config["paths"] = dict(config["paths"])
    tmp_config["paths"]["raw_csv"] = str(merged_raw_path).replace("\\", "/")
    save_config(tmp_config_path, tmp_config)

    try:
        run_pipeline(tmp_config_path)
    finally:
        if tmp_config_path.exists():
            tmp_config_path.unlink()

    # Backup latest merged raw as the new baseline raw dataset.
    base_raw_path = resolve_path(config["paths"]["raw_csv"])
    shutil.copy2(merged_raw_path, base_raw_path)

    new_state = {
        "last_retrained_at": datetime.now().isoformat(timespec="seconds"),
        "last_total_rows": total_rows,
    }
    save_state(state_path, new_state)
    print(f"[auto-retrain] completed at {new_state['last_retrained_at']}, rows={total_rows}")


if __name__ == "__main__":
    main()
