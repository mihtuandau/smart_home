# HƯỚNG DẪN TRAINING MODEL AI DỰ BÁO XÁC SUẤT MƯA

## Tổng quan
Hệ thống AI sử dụng mô hình Hybrid (LSTM + XGBoost) để dự báo xác suất mưa 48 giờ dựa trên dữ liệu thời tiết và cảm biến.

## Điều kiện tiên quyết
- Python 3.8+
- Đã cài đặt các thư viện: tensorflow, scikit-learn, xgboost, pandas, numpy, statsmodels
- Dữ liệu training: `data/processed/weather_data_for_ai.csv`

## Các bước training từng bước

### Bước 1: Chuẩn bị môi trường
```bash
# Kích hoạt virtual environment
.\.venv\Scripts\activate

# Cài đặt dependencies (nếu cần)
pip install -r requirements.txt
```

### Bước 2: Phân tích ACF để xác nhận SEQUENCE_LENGTH
```bash
# Phân tích Autocorrelation Function
python.exe scripts/analyze_acf.py
```

**Ý nghĩa:** Script này sẽ:
- Kiểm tra stationarity của dữ liệu
- Xác định lags quan trọng
- Vẽ biểu đồ ACF/PACF
- Xác nhận SEQUENCE_LENGTH=24 giờ là hợp lý
- Lưu biểu đồ vào `results/acf_analysis_*.png`

**Kết quả mong đợi:**
- ACF giảm nhanh → SEQUENCE_LENGTH=24 là tối ưu
- Autocorrelation cao ở lag 24h → Model có đủ thông tin

### Bước 3: Chuẩn bị dữ liệu
```bash
# Chạy script tạo dữ liệu training từ API
python.exe scripts/json_to_csv.py
```
Script này sẽ:
- Gọi Open-Meteo API để lấy dữ liệu thời tiết
- Lưu vào `data/processed/weather_data_for_ai.csv`
- Tạo target labels từ precipitation data

### Bước 4: Training model
```bash
# Chạy training với cấu hình cải tiến
python.exe src/train_ai_model.py
```

**Quá trình training sẽ:**
- Load dữ liệu từ CSV
- Tiền xử lý và feature engineering
- Xây dựng mô hình LSTM với Attention Mechanism ✨
- Áp dụng Early Stopping (patience=15)
- Learning Rate Reduction khi validation loss plateau
- Huấn luyện với cơ chế Dropout cao (0.3-0.4)
- Lưu model vào `models/hybrid_rain_forecast_model/`
- Tạo báo cáo đánh giá và biểu đồ training

### Bước 5: Kiểm tra kết quả
Sau khi training, kiểm tra:
- `results/model_evaluation_report.json`: Metrics đánh giá
- `results/training_history.png`: Biểu đồ quá trình training
- `models/hybrid_rain_forecast_model/lstm_model.h5`: Model đã train

## Cấu hình training
Các thông số quan trọng trong `src/hybrid_model.py`:
- `SEQUENCE_LENGTH = 24`: 24 giờ quá khứ (xác nhận bằng ACF)
- `EPOCHS = 100`: Số epochs tối đa (Early Stopping sẽ dừng sớm hơn)
- `BATCH_SIZE = 32`: Kích thước batch
- `LEARNING_RATE = 0.001`: Tốc độ học

## Cải tiến mô hình mới ✨
1. **Attention Mechanism**: Model tự động tập trung vào thời điểm quan trọng
2. **Early Stopping cải tiến**: patience=15 (nếu validation loss không cải thiện)
3. **Dropout cao hơn**: Tăng lên 0.3-0.4 để ngăn overfitting
4. **Learning Rate Reduction**: Giảm learning rate khi loss plateau
5. **Batch Normalization**: Ổn định quá trình training
6. **ACF Analysis**: Xác nhận SEQUENCE_LENGTH là phù hợp

## Hiểu Early Stopping và Callbacks

### Early Stopping (patience=15)
- Nếu `val_loss` không giảm sau 15 epochs, dừng training
- Khôi phục weights tốt nhất
- Tránh overfitting

### Learning Rate Reduction
- Nếu `val_loss` không giảm sau 5 epochs, giảm learning rate đi 0.5
- Giúp model tìm được local minimum tốt hơn

### Model Checkpoint
- Lưu model tốt nhất (dựa trên `val_loss`)
- Tự động lưu vào `models/hybrid_rain_forecast_model/lstm_model.h5`

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-----------|---------|
| Training quá chậm | SEQUENCE_LENGTH quá dài | Giảm xuống 12h |
| Overfitting | Model quá phức tạp | Tăng Dropout đến 0.5 |
| Underfitting | Model quá đơn giản | Tăng số units LSTM (64→128) |
| Early Stopping quá sớm | patience quá thấp | Tăng patience lên 20-25 |
| Learning rate quá cao | Loss dao động | Giảm LEARNING_RATE xuống 0.0001 |
| Out of Memory | Batch size quá lớn | Giảm BATCH_SIZE xuống 16 |

## Thời gian training
- Với cấu hình hiện tại: 5-15 phút (dừng sớm nếu đạt validation tốt)
- Tối đa (100 epochs): 30-60 phút
- Phụ thuộc vào: Cấu hình máy, kích thước GPU, dữ liệu