from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from PIL import Image, ImageDraw


def append_training_history(models_dir: str, metrics: dict[str, Any]) -> Path:
    out_path = Path(models_dir) / "training_history.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    row = {"timestamp": datetime.now().isoformat(timespec="seconds")}
    row.update(metrics)
    df_new = pd.DataFrame([row])

    if out_path.exists():
        df_old = pd.read_csv(out_path)
        df = pd.concat([df_old, df_new], ignore_index=True)
    else:
        df = df_new

    df.to_csv(out_path, index=False)
    return out_path


def _draw_series(draw: ImageDraw.ImageDraw, x_vals: list[int], y_vals: list[float], box: tuple[int, int, int, int], color: str) -> None:
    x0, y0, x1, y1 = box
    if not y_vals:
        return
    finite = [v for v in y_vals if pd.notna(v)]
    if not finite:
        return
    ymin = min(finite)
    ymax = max(finite)
    if ymin == ymax:
        ymin -= 1
        ymax += 1

    points: list[tuple[int, int]] = []
    for i, v in enumerate(y_vals):
        if pd.isna(v):
            continue
        px = x0 + int((x1 - x0) * (i / max(1, len(y_vals) - 1)))
        py = y1 - int((y1 - y0) * ((v - ymin) / (ymax - ymin)))
        points.append((px, py))
        r = 3
        draw.ellipse((px - r, py - r, px + r, py + r), fill=color)
    if len(points) >= 2:
        draw.line(points, fill=color, width=2)


def build_training_history_plot(models_dir: str) -> Path:
    history_path = Path(models_dir) / "training_history.csv"
    output_path = Path(models_dir) / "training_history.png"
    if not history_path.exists():
        raise FileNotFoundError(f"History file not found: {history_path}")

    df = pd.read_csv(history_path)
    if df.empty:
        raise ValueError("Training history is empty.")
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"]).sort_values("timestamp")

    width, height = 1400, 900
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)

    margin = 60
    row_h = (height - margin * 2) // 3
    titles = [
        ("K-Means Silhouette (higher is better)", "kmeans_silhouette", "#1f77b4"),
        ("IsolationForest Anomaly Ratio", "iforest_anomaly_ratio", "#ff7f0e"),
        ("IsolationForest Mean Decision Score", "iforest_score_mean", "#2ca02c"),
    ]

    for idx, (title, col, color) in enumerate(titles):
        top = margin + idx * row_h
        bottom = top + row_h - 20
        box = (120, top + 25, width - 40, bottom - 30)
        draw.text((120, top), title, fill="black")
        draw.rectangle(box, outline="#cccccc", width=1)
        y_vals = df[col].tolist() if col in df.columns else []
        _draw_series(draw, list(range(len(y_vals))), y_vals, box, color)

    draw.text((120, height - 30), f"Generated at {datetime.now().isoformat(timespec='seconds')}", fill="#666666")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    return output_path
