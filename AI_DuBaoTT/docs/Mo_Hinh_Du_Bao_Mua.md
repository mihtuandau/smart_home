# Mô Hình Dự Báo Mưa - Giải Thích Dễ Hiểu

## 🎯 Tổng Quan
Mô hình AI dự báo xác suất mưa 48 giờ cho hệ thống Smart Home, sử dụng dữ liệu từ cảm biến nhà và API thời tiết để đưa ra dự báo chính xác.

## 📊 Dữ Liệu Đầu Vào

### 1. **Từ Cảm Biến Smart Home (MQTT)**
- **Nhiệt độ bề mặt** (`temp_surface`): Nhiệt độ không khí tại mặt đất
- **Độ ẩm bề mặt** (`humidity_surface`): Độ ẩm tương đối tại mặt đất
- **Áp suất bề mặt** (`pressure_surface`): Áp suất khí quyển tại mặt đất
- **Lượng mưa** (`rain_mm`): Lượng mưa thực tế (0 = không mưa, >0 = có mưa)

### 2. **Từ API Thời Tiết (Open-Meteo)**
- **Nhiệt độ ở các tầng** (500hPa, 700hPa, 850hPa)
- **Điểm sương ở các tầng** (500hPa, 700hPa, 850hPa)
- **Tốc độ gió** (`wind_speed_10m`)
- **Độ che phủ mây** (`cloud_cover`)

## 🧮 Các Chỉ Số Tính Toán

### **Chỉ Số Khí Tượng Cơ Bản**

#### 1. **K-Index (Chỉ số K)**
```
K = (T850 - T500) + Td850 - (T700 - Td700)
```
- **Ý nghĩa**: Đo lường sự bất ổn định của khí quyển
- **Khi tăng**: Xác suất mưa tăng ↑
- **Ngưỡng**: >20 = có thể có mưa, >30 = mưa lớn

#### 2. **Lifted Index (Chỉ số nâng lên)**
```
LI = T500 - Tparcel500
```
- **Ý nghĩa**: Đo nhiệt độ của khối không khí khi nâng lên đến 500hPa
- **Khi giảm** (âm hơn): Xác suất mưa tăng ↑
- **Ngưỡng**: <0 = không ổn định, <-5 = mưa rất lớn

#### 3. **Điểm sương bề mặt (Td_surface)**
```
Td_surface = T850 - ((100 - RH850)/5)
```
- **Ý nghĩa**: Nhiệt độ mà không khí bắt đầu ngưng tụ
- **Khi tăng**: Xác suất mưa tăng ↑ (không khí ẩm hơn)

#### 4. **Độ chênh lệch nhiệt độ - điểm sương**
```
temp_dewpoint_spread = T850 - Td850
```
- **Ý nghĩa**: Đo độ khô của không khí
- **Khi giảm**: Xác suất mưa tăng ↑ (không khí ẩm hơn)

#### 5. **Chỉ số ổn định (Stability Index)**
```
stability_index = (T850 - T500) - (Td850 - Td500)
```
- **Ý nghĩa**: Đo sự ổn định của khí quyển
- **Khi giảm**: Xác suất mưa tăng ↑ (không khí không ổn định)

## 📈 Ảnh Hưởng Của Các Chỉ Số Cơ Bản

### **Nhiệt Độ (Temperature)**
- **Khi tăng**: Xác suất mưa giảm ↓ (không khí nóng hơn, khô hơn, khó ngưng tụ)
- **Khi giảm**: Xác suất mưa tăng ↑ (không khí lạnh hơn, dễ ngưng tụ tạo mưa)
- **Ngưỡng**: < 25°C = dễ mưa, > 30°C = ít mưa

### **Độ Ẩm (Humidity)**
- **Khi tăng**: Xác suất mưa tăng ↑ (không khí ẩm hơn, dễ tạo mưa)
- **Khi giảm**: Xác suất mưa giảm ↓ (không khí khô hơn)
- **Ngưỡng**: > 80% = rất dễ mưa, < 50% = ít mưa

### **Áp Suất (Pressure)**
- **Khi tăng**: Xác suất mưa giảm ↓ (áp cao = thời tiết ổn định, khô)
- **Khi giảm**: Xác suất mưa tăng ↑ (áp thấp = thời tiết xấu, dễ mưa)
- **Ngưỡng**: < 1005 hPa = dễ mưa, > 1015 hPa = ít mưa

## 🤖 Kiến Trúc Mô Hình AI

### **LSTM (Long Short-Term Memory)**
- **Đầu vào**: 24 giờ dữ liệu quá khứ của 11 chỉ số thời tiết
- **Công việc**: Học pattern thời tiết theo thời gian
- **Đầu ra**: Vector đặc trưng 64 chiều

### **XGBoost Classifier**
- **Đầu vào**: Vector từ LSTM + 5 chỉ số khí tượng tĩnh
- **Công việc**: Dự báo xác suất mưa dựa trên pattern học được
- **Đầu ra**: Xác suất mưa (0.0 - 1.0)

## 🔄 Quy Trình Hoạt Động Thời Gian Thực

### **Bước 1: Thu thập dữ liệu**
```
Smart Home Sensors ──MQTT──► AI System
     ↓                        ↓
  Temperature              Process Data
  Humidity                 Calculate Features
  Pressure                 Run Prediction
     ↓                        ↓
  API Weather Data ──────────┘
```

### **Bước 2: Xử lý dữ liệu mỗi giờ**
1. **Nhận dữ liệu**: Cảm biến gửi T, H, P qua MQTT
2. **Lấy thời tiết**: Gọi API Open-Meteo cho dữ liệu bổ sung
3. **Tính chỉ số**: Tạo 5 chỉ số khí tượng (K, LI, Td, Spread, Stability)
4. **Dự báo**: LSTM + XGBoost → Xác suất mưa
5. **Điều khiển**: Tự động điều khiển mái che nếu mưa > 70%

### **Bước 3: Cập nhật liên tục**
- **Tần suất**: Mỗi 1 giờ
- **Dự báo**: 48 giờ phía trước
- **Độ trễ**: < 30 giây từ khi nhận dữ liệu

## 🎯 Cách Đọc Kết Quả

- **0.0 - 0.3**: Ít có khả năng mưa
- **0.3 - 0.7**: Có thể có mưa nhỏ
- **0.7 - 1.0**: Rất có khả năng mưa lớn

## 📝 Lưu Ý Quan Trọng

1. **Độ chính xác**: Model được train với dữ liệu thực tế, độ chính xác ~85%
2. **Cập nhật**: Model tự động cải thiện khi có thêm dữ liệu
3. **Giới hạn**: Dự báo 48 giờ, phụ thuộc vào chất lượng dữ liệu đầu vào
4. **Ứng dụng**: Tự động điều khiển mái che, thông báo người dùng

---