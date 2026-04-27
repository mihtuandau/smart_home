# CẢI TIẾN MODEL - CHI TIẾT TRIỂN KHAI

## 🎯 Mục tiêu
Training lại model theo các đề xuất cải tiến để nâng cao hiệu suất dự báo xác suất mưa.

## ✨ Các cải tiến đã triển khai

### 1. **Attention Mechanism** (Cơ chế Chú Ý)
**Vấn đề cũ:** Model xử lý mọi time step với vai trò như nhau
**Giải pháp:** Thêm MultiHeadAttention layer (4 heads, key_dim=16)
**Lợi ích:**
- Model tự động "tập trung" vào thời điểm quan trọng
- Cải thiện độ chính xác cho sequences dài (24 giờ)
- Tăng interpretability - dễ giải thích quyết định

**Kiến trúc mới:**
```
Input → LSTM(64) → Attention(4-head) → LSTM(32) → Dense(16) → Output
                     (tập trung vào pattern quan trọng)
```

### 2. **Early Stopping Cải Tiến**
**Cấu hình:**
- `patience=15` (tăng từ 5): Cho model thêm cơ hội học
- `min_delta=0.0001`: Ngưỡng cải thiện tối thiểu
- `restore_best_weights=True`: Khôi phục weights tốt nhất

**Hiệu quả:**
- Tránh training quá lâu khi không còn cải thiện
- Lấy model với validation loss tốt nhất
- Tiết kiệm thời gian training ~30-40%

### 3. **Learning Rate Reduction** (Mới thêm)
**Cấu hình:**
- Giám sát: `val_loss`
- Giảm factor: 0.5 (nhân learning rate với 0.5)
- Patience: 5 epochs (nếu không cải thiện)
- Min LR: 1e-7 (giới hạn dưới)

**Nguyên lý:** Khi loss "bị kẹt" ở plateau, giảm learning rate để:
- Model có cơ hội tìm local minimum tốt hơn
- Tránh overfitting với learning rate quá cao

### 4. **Dropout Tăng Lên**
**Trước:**
```
LSTM(64) → Dropout(0.2)
LSTM(32) → Dropout(0.2)
Dense(16) → Dropout(0.1)
```

**Sau:**
```
LSTM(64) → Dropout(0.3)  ← Tăng
LSTM(32) → Dropout(0.3)  ← Tăng
Dense(16) → Dropout(0.3) ← Tăng từ 0.1
```

**Lợi ích:**
- Ngăn chặn overfitting mạnh hơn
- Model généralizes tốt hơn trên dữ liệu mới
- Giảm dependency vào trọng số cụ thể

### 5. **Batch Normalization** (Mới thêm)
**Thêm vào:** Sau mỗi layer LSTM và Dense
```
Dense(16) → BatchNorm → Dropout → Output
```

**Tác dụng:**
- Chuẩn hóa input của mỗi layer
- Tăng tốc độ hội tụ
- Ổn định quá trình training
- Cho phép learning rate cao hơn

### 6. **ACF Analysis Script** (Phân tích Autocorrelation)
**File mới:** `scripts/analyze_acf.py`

**Chức năng:**
```python
python.exe scripts/analyze_acf.py
```

**Phân tích:**
- Kiểm tra stationarity của dữ liệu (Augmented Dickey-Fuller test)
- Vẽ ACF/PACF plot
- Xác nhận SEQUENCE_LENGTH=24 là hợp lý
- Lưu biểu đồ vào `results/acf_analysis_*.png`

**Kết quả:**
- Nếu ACF giảm nhanh ở ~24h → SEQUENCE_LENGTH tối ưu
- Nếu ACF còn cao → Xét tăng sequence length
- Xác nhận đặc tính time-series của dữ liệu

## 📊 Kiến trúc Model Cải Tiến

```
┌──────────────────────────────────────────┐
│       Input Sequences (24h × 12 features)
└──────────────────────┬───────────────────┘
                       │
              ┌────────▼────────┐
              │  LSTM(64, return_seq=True)
              │  + BatchNorm + Dropout(0.3)
              └────────┬────────┘
                       │
         ┌─────────────▼─────────────┐
         │ MultiHeadAttention (4-head)│ ← Tập trung vào thời điểm quan trọng
         │ + Dropout(0.3)            │
         └─────────────┬─────────────┘
                       │
              ┌────────▼────────┐
              │ LSTM(32, return_seq=False)
              │ + BatchNorm + Dropout(0.3)
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ Dense(16, ReLU)
              │ + BatchNorm + Dropout(0.3)
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ Dense(1, Sigmoid)
              │ Output: Rain Probability
              └────────┬────────┘
                       │
          ┌────────────▼──────────────┐
          │ Xác suất mưa (0-1)
          └───────────────────────────┘
```

## 🔧 Hyperparameters

### Training Configuration
| Tham số | Giá trị | Ghi chú |
|--------|--------|--------|
| SEQUENCE_LENGTH | 24h | Xác nhận bằng ACF |
| BATCH_SIZE | 32 | Cân bằng giữa tốc độ và chất lượng |
| EPOCHS | 100 | Max epochs, Early Stopping sẽ dừng sớm |
| LEARNING_RATE | 0.001 | Giảm dần bằng ReduceLROnPlateau |

### Callbacks Configuration
| Callback | Tham số | Mục đích |
|----------|--------|---------|
| EarlyStopping | patience=15, min_delta=0.0001 | Dừng khi không cải thiện |
| ModelCheckpoint | save_best_only=True | Lưu model tốt nhất |
| ReduceLROnPlateau | factor=0.5, patience=5 | Giảm LR khi plateau |

## 📈 Kết Quả Mong Đợi

### Cải tiến so với phiên bản cũ:
- **Accuracy**: +2-5% (từ ~87% → 89-92%)
- **Validation Loss**: Giảm 10-20%
- **Generalization**: Model tổng quát hóa tốt hơn
- **Training Time**: Tương đương (~45-60 phút)

### Metrics Chính
| Metric | Mục tiêu | Cách đánh giá |
|--------|---------|--------------|
| Accuracy | > 90% | Tỷ lệ dự đoán đúng |
| R² Score | > 0.85 | Correlation với dữ liệu thực |
| Precision | > 0.90 | Khi dự báo mưa, bao nhiêu % đúng |
| Recall | > 0.90 | Trong các lần mưa thực, bao nhiêu % phát hiện được |

## 🚀 Cách Chạy

### Bước 1: Phân tích ACF
```bash
python.exe scripts/analyze_acf.py
```
Kiểm tra xem SEQUENCE_LENGTH=24 có hợp lý không

### Bước 2: Training Model
```bash
python.exe src/train_ai_model.py
```
Training sẽ tự động:
- Dừng khi Early Stopping triggered
- Giảm learning rate nếu cần
- Lưu model tốt nhất
- Tạo biểu đồ training_history.png

### Bước 3: Kiểm tra Kết Quả
```
results/
├── training_history.png        # Biểu đồ 4 subplots
├── training_history.json       # Raw data
├── model_evaluation_report.json # Metrics
└── acf_analysis_*.png          # ACF/PACF plots (từ bước 1)
```

## 💡 Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-----------|----------|
| Early Stopping quá sớm (< 20 epochs) | patience=15 nhưng model hội tụ nhanh | Bình thường, model tốt |
| Learning Rate quá thấp | LR giảm quá nhiều | Kiểm tra ReduceLROnPlateau logs |
| Out of Memory | Model quá phức tạp với Attention | Giảm BATCH_SIZE từ 32→16 |
| Validation Loss không giảm | Dữ liệu không đủ | Kiểm tra data preprocessing |

## 📚 Tài liệu Tham Khảo

- **Attention Mechanism**: https://arxiv.org/abs/1706.03762
- **Early Stopping**: Regularization technique chuẩn
- **Batch Normalization**: https://arxiv.org/abs/1502.03167
- **ACF Analysis**: Statsmodels documentation

## ✅ Checklist

- [x] Thêm Attention Mechanism
- [x] Cải tiến Early Stopping (patience=15)
- [x] Thêm Learning Rate Reduction
- [x] Tăng Dropout (0.2→0.3)
- [x] Thêm Batch Normalization
- [x] Tạo ACF analysis script
- [x] Cập nhật HuongDan_Training.md
- [x] Chạy training với cấu hình mới
- [ ] Kiểm tra kết quả (sau khi training xong)
- [ ] So sánh metrics cũ vs mới

## 🎓 Giáo Dục

Những kỹ thuật này là **best practices** trong Deep Learning:
- Attention: Standard trong NLP, được sử dụng trong Transformer
- Early Stopping: Ngăn overfitting tự động
- Learning Rate Scheduling: Cải thiện hội tụ
- Batch Norm: Tăng tốc độ training
- ACF Analysis: Validate time series assumptions