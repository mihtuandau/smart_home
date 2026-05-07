# CÁCH HOẠT ĐỘNG CỦA CHƯƠNG TRÌNH AI DỰ BÁO MƯA

## Kiến trúc tổng quan

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MQTT Broker   │    │   Open-Meteo    │    │   AI Model      │
│   (Real-time)   │───▶│   API (48h)     │───▶│   (LSTM+XGB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Sensor Data     │    │ Weather Data    │    │ Rain Forecast   │
│ (Temp, Hum, P)  │    │ (T850, Td850,   │    │ (0-100% prob)   │
│                 │    │  Wind, Cloud)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Luồng hoạt động chi tiết

### 1. Thu thập dữ liệu thời gian thực
**MQTT Integration:**
- Kết nối đến broker: `nfa1412a.ala.asia-southeast1.emqxsl.com:8883`
- Topic: `TN/IOT/smarthome/tt`
- Credentials: Username/Password được cấu hình trong `.env`
- Timeout: 30 giây cho mỗi lần lấy dữ liệu

**Dữ liệu MQTT mẫu:**
```json
{
  "temperature": 29.97,
  "humidity": 52.72,
  "pressure": 1007.27,
  "rain": false
}
```

### 2. Lấy dữ liệu thời tiết dự báo
**Open-Meteo API:**
- URL: `https://api.open-meteo.com/v1/forecast`
- Tọa độ: TP.HCM (10.95°N, 106.82°E)
- Thời gian: 48 giờ tới
- Thông số: Nhiệt độ, độ ẩm, áp suất các tầng, gió, mây

**Fallback System:**
1. Ưu tiên: Dữ liệu MQTT real-time
2. Fallback 1: Cache dữ liệu MQTT
3. Fallback 2: Simulated data (cho development)
4. Fallback 3: Sample file

### 3. Xử lý và làm giàu dữ liệu
**Feature Engineering:**
- **K-Index (KI)**: `(T850 - T500) + Td850 - (T700 - Td700)`
  - KI > 35: Xác suất mưa dông > 80%
- **Dew Point (Td)**: Tính từ nhiệt độ và độ ẩm bề mặt
- **Lifted Index (LI)**: `T_env_500 - T_parcel_500`
  - LI < -3: Khí quyển rất bất ổn định

**Chuẩn hóa dữ liệu:**
- MinMaxScaler cho tất cả features
- Đưa về khoảng [0, 1] cho LSTM

### 4. Dự báo với AI Model
**Kiến trúc Hybrid:**
```
Input (12h quá khứ) → LSTM (64 units) → LSTM (32 units) → Dense (16) → Features
                                                                       ↓
                                                            XGBoost Classifier
                                                                       ↓
                                                            Rain Probability (0-100%)
```

**Quy trình dự báo:**
1. Lấy 12 giờ dữ liệu gần nhất
2. Trích xuất features bằng LSTM
3. XGBoost phân loại xác suất mưa
4. Xuất kết quả cho 48 giờ tới

### 5. Lưu trữ và hiển thị kết quả
**Files được tạo:**
- `results/current_forecast.json`: Dự báo hiện tại
- `results/forecast_buffer.json`: Buffer dữ liệu
- `results/training_history.png`: Biểu đồ training

**Format output:**
```json
{
  "generated_at": "2026-04-27T08:47:01.586638Z",
  "latest_sample": {
    "timestamp": "2026-04-27T01:47:00",
    "temp_surface": 29.89,
    "humidity_surface": 52.55,
    "K_Index": 27.9,
    "Lifted_Index": -6.45
  },
  "prediction": {
    "next_hour_rain_probability": 0.062,
    "interpretation": "Giá trị gần đúng, dùng cho cảnh báo sớm."
  }
}
```

## Chế độ hoạt động

### Development Mode
```bash
python src/realtime_forecast.py
```
- Sử dụng simulated data
- Không cần MQTT connection
- Phù hợp cho testing và development

### Production Mode
```bash
python src/realtime_forecast.py --use-mqtt
```
- Kết nối MQTT real-time
- Cần cấu hình credentials trong `.env`
- Phù hợp cho production deployment

## Monitoring và Logging
- Logs được ghi vào console với format timestamp
- Error handling với fallback system
- Performance metrics được lưu trong results/

## Performance
- **Training time**: 5-10 phút (cấu hình tối ưu)
- **Inference time**: < 2 giây cho 48 giờ dự báo
- **Memory usage**: ~500MB RAM
- **Accuracy**: ~87% R² score trên validation set