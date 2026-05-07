# CƠ SỞ KHOA HỌC CỦA CHƯƠNG TRÌNH AI DỰ BÁO MƯA

## Nguyên lý vật lý khí tượng học

### 1. Cơ chế hình thành mưa
Mưa được hình thành khi hơi nước trong khí quyển ngưng tụ thành các giọt nước và rơi xuống đất. Quá trình này phụ thuộc vào:

**Ba yếu tố chính:**
- **Độ ẩm (Humidity)**: Lượng hơi nước trong không khí
- **Nhiệt độ (Temperature)**: Ảnh hưởng đến khả năng chứa hơi nước
- **Áp suất (Pressure)**: Xác định mật độ không khí và chuyển động khí quyển

### 2. Các chỉ số dự báo khoa học

#### K-Index (KI) - Chỉ số quan trọng nhất
**Công thức:** `KI = (T850 - T500) + Td850 - (T700 - Td700)`

**Ý nghĩa khoa học:**
- Đo sự bất ổn định của khí quyển giữa các tầng
- T850, T700, T500: Nhiệt độ tại các tầng áp suất
- Td850, Td700: Điểm sương tại các tầng
- **Ngưỡng quan trọng:**
  - KI < 20: Khí quyển ổn định, ít mưa
  - 20 < KI < 35: Có thể có mưa rào
  - KI > 35: Xác suất mưa dông > 80%

#### Lifted Index (LI) - Chỉ số nâng
**Công thức:** `LI = T_env_500 - T_parcel_500`

**Ý nghĩa khoa học:**
- Đo mức độ bất ổn định khi không khí được nâng lên
- T_env_500: Nhiệt độ môi trường tại 500hPa
- T_parcel_500: Nhiệt độ của khối khí khi nâng lên 500hPa
- **Ngưỡng quan trọng:**
  - LI > 0: Khí quyển ổn định
  - -3 < LI < 0: Bất ổn định trung bình
  - LI < -3: Rất bất ổn định, dễ hình thành dông

#### Dew Point (Điểm sương)
**Ý nghĩa khoa học:**
- Nhiệt độ mà tại đó hơi nước bắt đầu ngưng tụ
- Khi nhiệt độ không khí tiến sát điểm sương → độ ẩm bão hòa
- **Hiện tượng:** Sương mù, mưa, dông xuất hiện

### 3. Dữ liệu đầu vào và ý nghĩa

#### Dữ liệu bề mặt (Surface Data)
- **Nhiệt độ bề mặt**: Xác định khả năng chứa hơi nước
- **Độ ẩm bề mặt**: Lượng hơi nước hiện tại
- **Áp suất bề mặt**: Cho biết hệ thống thời tiết (thấp → mưa)

#### Dữ liệu tầng cao (Upper Atmosphere)
- **T850, T700, T500**: Nhiệt độ các tầng ảnh hưởng đến ổn định khí quyển
- **Td850, Td700**: Điểm sương các tầng cho biết độ ẩm dọc
- **Tốc độ gió**: Chuyển động khí quyển, hướng gió
- **Độ bao phủ mây**: Mây nhiều → khả năng mưa cao

### 4. Phương pháp AI và Machine Learning

#### LSTM (Long Short-Term Memory)
**Nguyên lý:** Xử lý dữ liệu chuỗi thời gian, ghi nhớ thông tin dài hạn

**Ứng dụng trong dự báo thời tiết:**
- Học các pattern thời tiết từ 12-24 giờ quá khứ
- Dự đoán xu hướng thay đổi của các thông số khí tượng
- Xử lý dependency thời gian trong dữ liệu thời tiết

#### XGBoost Classifier
**Nguyên lý:** Thuật toán ensemble learning, kết hợp nhiều decision trees

**Ứng dụng:**
- Nhận features từ LSTM + chỉ số vật lý (KI, LI)
- Phân loại xác suất mưa (0-100%)
- Robust với outliers và missing data

#### Hybrid Approach
**Lý do kết hợp:**
- LSTM: Xử lý temporal patterns
- XGBoost: Classification mạnh mẽ với features phức tạp
- Kết hợp: Tận dụng ưu điểm của cả hai

### 5. Validation và độ tin cậy

#### Metrics đánh giá
- **Accuracy**: Tỷ lệ dự đoán đúng
- **Precision/Recall**: Đánh giá chất lượng dự đoán mưa
- **R² Score**: Độ phù hợp của model (target: > 0.8)
- **MAE (Mean Absolute Error)**: Sai số trung bình

#### Cơ sở khoa học của validation
- **Physical Consistency**: Kết quả phải phù hợp với định luật vật lý
- **Meteorological Patterns**: Phù hợp với các pattern thời tiết thực tế
- **Statistical Significance**: p-value < 0.05

### 6. Cơ chế fallback và robustness

#### Multi-level Fallback System
1. **MQTT Real-time**: Dữ liệu sensor trực tiếp
2. **Cache**: Dữ liệu MQTT đã lưu
3. **Simulated Data**: Dữ liệu giả lập với noise
4. **Sample File**: Dữ liệu mẫu

#### Lý do thiết kế
- **Reliability**: Hệ thống luôn hoạt động kể cả khi mất kết nối
- **Data Quality**: Ưu tiên dữ liệu real-time, fallback có chất lượng giảm dần
- **Scientific Accuracy**: Simulated data dựa trên phân phối thực tế

### 7. Ứng dụng thực tiễn

#### Lợi ích khoa học
- **Early Warning**: Cảnh báo mưa sớm 48 giờ
- **Quantitative**: Xác suất cụ thể thay vì qualitative
- **Location-specific**: Dự báo cho tọa độ chính xác
- **Physics-based**: Dựa trên các chỉ số khí tượng chuẩn

#### Hạn chế và cải tiến
- **Uncertainty**: Thời tiết có yếu tố ngẫu nhiên
- **Model Drift**: Cần retraining định kỳ
- **Data Quality**: Phụ thuộc vào chất lượng dữ liệu đầu vào
- **Computational Cost**: Cân bằng giữa accuracy và performance

### 8. Tài liệu tham khảo

#### Nguồn khoa học
- [K-Index formulation](https://en.wikipedia.org/wiki/K-index)
- [Lifted Index](https://en.wikipedia.org/wiki/Lifted_index)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [LSTM for time series](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)

#### Research papers
- "Machine Learning for Weather Prediction" - Nature (2020)
- "Deep Learning for Precipitation Nowcasting" - arXiv (2019)
- "Hybrid Models for Weather Forecasting" - Journal of Applied Meteorology (2021)