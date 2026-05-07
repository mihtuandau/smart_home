from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data.preprocess import preprocess_data


def test_preprocess_creates_processed_file() -> None:
    config_path = "configs/config.yaml"
    df = preprocess_data(config_path)

    assert not df.empty
    assert "hour" in df.columns
    assert "power_mW" in df.columns

    output_file = Path("data/processed/smart_home_processed.csv")
    assert output_file.exists()
