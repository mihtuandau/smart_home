from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml

# Allow running as a script: python src/models/build_training_history_plot.py
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.models.training_history import build_training_history_plot


def load_config(config_path: str) -> dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build training history PNG for model quality tracking.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    models_dir = Path(cfg["paths"]["models_dir"]).as_posix()
    output_path = build_training_history_plot(models_dir)
    print(f"Training history plot saved: {output_path}")


if __name__ == "__main__":
    main()
