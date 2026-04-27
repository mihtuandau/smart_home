# AI Rain Prediction System

Hệ thống AI dự báo xác suất mưa thời gian thực sử dụng dữ liệu sensor và API thời tiết.

## 📁 Cấu trúc thư mục

```
/AI_Py_DuDoanTT/
├── config/                        # Cấu hình hệ thống
│   └── .env                       # Environment variables
├── data/                          # Dữ liệu đầu vào
│   ├── sensor_data_30days.csv     # Dữ liệu sensor thực 30 ngày
│   ├── cache/                     # Cache MQTT data
│   │   └── mqtt_sensor_cache.json
│   └── processed/                 # Dữ liệu đã xử lý
│       ├── weather_data_for_ai.csv # Dữ liệu training từ API
│       └── enriched_features_data.json # Features đã làm giàu
├── models/                        # Models đã train
│   └── hybrid_rain_forecast_model/
│       └── lstm_model.h5          # Model LSTM chính
├── results/                       # Kết quả và output
│   ├── current_forecast.json      # Dự báo hiện tại
│   ├── forecast_buffer.json       # Buffer dữ liệu thời gian thực
│   ├── model_evaluation_report.json # Báo cáo đánh giá model
│   ├── training_history.json      # Lịch sử training
│   └── training_history.png       # Đồ thị training
├── docs/                          # Tài liệu và hướng dẫn
│   ├── Cac_buoc_TH_v2             # Yêu cầu lập trình gốc
│   ├── HuongDan_Training.md       # Hướng dẫn training từng bước
│   ├── Cach_Hoat_Dong.md          # Cách hoạt động của chương trình
│   └── Co_So_Khoa_Hoc.md          # Cơ sở khoa học
├── scripts/                       # Scripts tiện ích
│   ├── json_to_csv.py             # Chuyển đổi dữ liệu API
│   └── create_training_plot.py    # Tạo biểu đồ training
└── src/                          # Source code
    ├── data_integration.py        # Tích hợp dữ liệu
    ├── feature_engineering.py     # Feature engineering
    ├── hybrid_model.py            # Model AI hybrid
    ├── model_explanation.py       # Giải thích model
    ├── realtime_forecast.py       # Dự báo thời gian thực
    └── train_ai_model.py          # Script training
```

## 🚀 Cách sử dụng

### 1. Training Model
```bash
# Kích hoạt virtual environment
.\.venv\Scripts\activate

# Training model với dữ liệu thực
python.exe src/train_ai_model.py
```

### 2. Dự báo thời gian thực

#### Development mode (dùng simulated data)
```bash
python.exe src/realtime_forecast.py
```

#### Production mode (dùng MQTT real-time)
```bash
python.exe src/realtime_forecast.py --use-mqtt
```

### 3. Tạo dữ liệu training
```bash
python.exe scripts/json_to_csv.py
```

## 📚 Tài liệu chi tiết

- **[Hướng dẫn Training](docs/HuongDan_Training.md)**: Cách training model từng bước
- **[Cách hoạt động](docs/Cach_Hoat_Dong.md)**: Kiến trúc và luồng xử lý
- **[Cơ sở khoa học](docs/Co_So_Khoa_Hoc.md)**: Nguyên lý vật lý và khoa học dữ liệu
- **[Yêu cầu gốc](docs/Cac_buoc_TH_v2)**: Yêu cầu lập trình ban đầu

## 🔧 Cấu hình

### Environment Variables (.env)
```env
# MQTT Configuration
MQTT_BROKER=nfa1412a.ala.asia-southeast1.emqxsl.com
MQTT_PORT=8883
MQTT_TOPIC=TN/IOT/smarthome/tt
MQTT_USER=*****
MQTT_PASS=*****

# LED Power Consumption (mW)
LED1_POWER_MW=500
LED2_POWER_MW=800
```

### Model Hyperparameters (src/hybrid_model.py)
```python
SEQUENCE_LENGTH = 12      # Giờ quá khứ để dự báo
BATCH_SIZE = 64           # Kích thước batch
EPOCHS = 20              # Số epochs tối đa
LEARNING_RATE = 0.001    # Tốc độ học
```

## 📊 Kết quả

### Metrics chính
- **Accuracy**: ~87% trên validation set
- **R² Score**: 0.8729 (correlation với dữ liệu thực)
- **MAE**: 0.0202 (mean absolute error)
- **Precision**: 0.957 (đối với mưa)
- **Recall**: 0.900 (đối với mưa)

### Features quan trọng
1. **Td_850** (điểm sương 850hPa): Correlation cao nhất
2. **T_850** (nhiệt độ 850hPa): Ảnh hưởng đến độ ẩm
3. **cloud_cover**: Mây nhiều → mưa nhiều
4. **wind_speed_10m**: Gió ảnh hưởng đến thời tiết
5. **K_Index**: Chỉ số bất ổn định khí quyển

## 🔄 Fallback System

Hệ thống có 4 mức fallback để đảm bảo luôn hoạt động:

1. **MQTT Real-time** (ưu tiên cao nhất)
2. **Cache MQTT** (dữ liệu đã lưu)
3. **Simulated Data** (dữ liệu giả lập)
4. **Sample File** (dữ liệu mẫu)

## 🛠 Troubleshooting

### Lỗi thường gặp
- **MQTT connection failed**: Kiểm tra credentials trong .env
- **Training quá chậm**: Giảm SEQUENCE_LENGTH hoặc tăng BATCH_SIZE
- **Memory error**: Giảm batch size hoặc sử dụng máy có RAM lớn hơn
- **Low accuracy**: Kiểm tra chất lượng dữ liệu đầu vào

### Performance Tuning
- **Tăng tốc training**: Tăng BATCH_SIZE, giảm SEQUENCE_LENGTH
- **Cải thiện accuracy**: Tăng số units LSTM, thêm epochs
- **Giảm overfitting**: Tăng dropout, thêm regularization

## 📈 Monitoring

### Logs
- Training logs: Console output với timestamp
- Prediction logs: Lưu trong results/ với timestamp
- Error logs: Detailed error messages với context

### Metrics tracking
- Training history: `results/training_history.png`
- Model evaluation: `results/model_evaluation_report.json`
- Real-time predictions: `results/current_forecast.json`

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License.
python.exe src/realtime_forecast.py --watch --interval 300
```

#### Dự báo với dữ liệu MQTT (thời gian thực)
```bash
# Chạy một lần với dữ liệu từ MQTT broker
python.exe src/realtime_forecast.py --use-mqtt

# Chạy liên tục với MQTT, cập nhật mỗi 10 phút
python.exe src/realtime_forecast.py --use-mqtt --watch --interval 600
```

### 3. Đánh giá Model
```bash
python src/model_explanation.py
```

### 4. Scripts Utility
```bash
# Convert JSON to CSV
python scripts/Json_to_csv.py
```

## 📊 Dữ liệu

- **Sensor**: Nhiệt độ, độ ẩm, áp suất bề mặt
- **API**: Dữ liệu upper-air (850hPa, 700hPa, 500hPa), gió, mây
- **MQTT**: Dữ liệu cảm biến thời gian thực từ broker EMQX
- **Features**: 12 đặc trưng cho LSTM (24 giờ sequences)
- **Output**: Xác suất mưa giờ kế tiếp (0.0-1.0)

## ⚙️ Cấu hình MQTT

Tạo file `.env` trong thư mục gốc:

```env
MQTT_BROKER=nfa1412a.ala.asia-southeast1.emqxsl.com
MQTT_PORT=8883
MQTT_TOPIC=TN/IOT/smarthome/tt
MQTT_USER=your_username
MQTT_PASS=your_password
```

## 🛠️ Dependencies

- Python 3.8+
- TensorFlow/Keras
- Pandas, NumPy, Scikit-learn
- Paho-MQTT, Requests, python-dotenv

## 📚 Tài liệu và Hướng dẫn

### ⭐ Hướng dẫn Training chi tiết
📖 **`docs/HuongDan_Training.txt`** - Hướng dẫn đầy đủ cách training model từ đầu đến cuối

### ⭐ Giải thích Timestamps (generated_at vs timestamp)
📖 **`docs/GiaiThich_Timestamps.txt`** - Tại sao chênh lệch giữa generated_at và timestamp?
📊 **`docs/Phan_Tich_ChenhLech_MQTT_10s.txt`** - Phân tích chi tiết khi sensor gửi MQTT mỗi 10s

### Các tài liệu quan trọng
- `docs/KetQuaTraining_Moi.txt` - Kết quả training mới nhất
- `docs/GiaiThich.txt` - Giải thích thuật toán và model
- `docs/ChienLuocTraining_Moi.txt` - Chiến lược training
- `docs/TomTat_SapXepLai_CT.txt` - Tóm tắt sắp xếp cấu trúc

## 📝 Ghi chú

- **Cấu trúc**: Code được tổ chức theo chuẩn Python với src/, data/, models/, results/
- **MQTT**: Hệ thống tự động kết nối đến broker EMQX để nhận dữ liệu sensor thời gian thực
- **API**: Tự động gọi Open-Meteo API để làm giàu dữ liệu meteorological
- **Model**: Sử dụng LSTM với 24 giờ sequences để dự báo xác suất mưa
- **Output**: Xác suất từ 0.0 (không mưa) đến 1.0 (có mưa)
- **Training History**: Lưu tại `results/training_history.json` và `results/training_history.png`

## 📝 Ghi chú

- **Cấu trúc**: Code được tổ chức theo chuẩn Python với src/, data/, models/, results/
- **MQTT**: Hệ thống tự động kết nối đến broker EMQX để nhận dữ liệu sensor thời gian thực
- **API**: Tự động gọi Open-Meteo API để làm giàu dữ liệu meteorological
- **Model**: Sử dụng LSTM với 24 giờ sequences để dự báo xác suất mưa
- **Output**: Xác suất từ 0.0 (không mưa) đến 1.0 (có mưa)
- **Training History**: Lưu tại `results/training_history.json` và `results/training_history.png`

## 📈 Kết quả mẫu

### Dự báo với dữ liệu MQTT (thời gian thực)
```json
{
  "generated_at": "2026-04-26T03:19:27.700807Z",
  "buffer_length": 34,
  "latest_sample": {
    "dt": 1777173565,
    "timestamp": "2026-04-26T03:19:25",
    "temp_surface": 29.9,
    "humidity_surface": 52.58,
    "pressure_surface": 1007.25,
    "rain_mm": 0.0,
    "T_850": 19.3,
    "Td_850": 11.6,
    "wind_speed_10m": 6.1,
    "wind_direction_10m": 135.0,
    "cloud_cover": 41.0
  },
  "prediction": {
    "next_hour_rain_probability": 0.0074,
    "interpretation": "Giá trị gần đúng, dùng cho cảnh báo sớm."
  },
  "status": "predicted"
}
```

### Dự báo với dữ liệu mẫu
```json
{
  "prediction": {
    "next_hour_rain_probability": 0.0104,
    "interpretation": "Giá trị gần đúng, dùng cho cảnh báo sớm."
  },
  "status": "predicted"
}
```

## 📝 License

Dự án cá nhân cho mục đích nghiên cứu và học tập.