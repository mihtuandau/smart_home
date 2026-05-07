# 🚀 AI Rain Prediction - Quick Guide

## ⚡ Cách hoạt động đơn giản

**Input từ Smart Home:**
- 🌡️ Nhiệt độ (Temperature)
- 💧 Độ ẩm (Humidity)
- 📊 Áp suất (Pressure)

**→ AI tính toán →**

**Output: Xác suất mưa 0.0 - 1.0**

## 📈 Quy tắc cơ bản

| Chỉ số | Khi tăng | Khi giảm |
|--------|----------|----------|
| **Nhiệt độ** | Mưa ↓ | Mưa ↑ |
| **Độ ẩm** | Mưa ↑ | Mưa ↓ |
| **Áp suất** | Mưa ↓ | Mưa ↑ |

## 🎯 Ý nghĩa kết quả

- **0.0 - 0.3**: Thời tiết khô ráo ☀️
- **0.3 - 0.7**: Có thể mưa nhỏ 🌦️
- **0.7 - 1.0**: Sắp mưa to ⛈️

## 🤖 Công nghệ

**LSTM + XGBoost** học từ:
- 24 giờ dữ liệu quá khứ
- 11 chỉ số thời tiết
- 5 chỉ số khí tượng tính toán

**Độ chính xác:** ~85%
