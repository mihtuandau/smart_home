#!/usr/bin/env python3
"""
Script tạo biểu đồ training history từ file JSON
"""

import json
import matplotlib.pyplot as plt
from pathlib import Path

def create_training_plot(json_file: str, output_file: str):
    """Tạo biểu đồ training history từ file JSON"""

    # Đọc data từ JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        history = json.load(f)

    # Tạo figure với 2x2 subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('AI Rain Prediction Model - Training History', fontsize=16, fontweight='bold')

    epochs = range(1, len(history['accuracy']) + 1)

    # Plot 1: Accuracy
    ax1.plot(epochs, history['accuracy'], 'b-', label='Training Accuracy', linewidth=2)
    ax1.plot(epochs, history['val_accuracy'], 'r-', label='Validation Accuracy', linewidth=2)
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Plot 2: Loss
    ax2.plot(epochs, history['loss'], 'b-', label='Training Loss', linewidth=2)
    ax2.plot(epochs, history['val_loss'], 'r-', label='Validation Loss', linewidth=2)
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    # Plot 3: Precision & Recall
    ax3.plot(epochs, history['precision'], 'g-', label='Precision', linewidth=2)
    ax3.plot(epochs, history['recall'], 'm-', label='Recall', linewidth=2)
    ax3.set_title('Precision & Recall')
    ax3.set_xlabel('Epoch')
    ax3.set_ylabel('Score')
    ax3.legend()
    ax3.grid(True, alpha=0.3)

    # Plot 4: MAE
    ax4.plot(epochs, history['mae'], 'c-', label='MAE', linewidth=2)
    ax4.set_title('Mean Absolute Error')
    ax4.set_xlabel('Epoch')
    ax4.set_ylabel('MAE')
    ax4.legend()
    ax4.grid(True, alpha=0.3)

    # Lưu biểu đồ
    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"[OK] Da tao bieu do training history: {output_file}")

if __name__ == "__main__":
    json_file = "results/training_history.json"
    output_file = "results/training_history.png"

    if Path(json_file).exists():
        create_training_plot(json_file, output_file)
    else:
        print(f"❌ Không tìm thấy file: {json_file}")