import requests
import pandas as pd

# 1. Cấu hình URL API (Sử dụng Forecast API để lấy dữ liệu 3 tháng gần nhất)
url = "https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=10.95&longitude=106.82&start_date=2025-10-26&end_date=2026-04-25&hourly=temperature_2m,relative_humidity_2m,surface_pressure,precipitation,wind_speed_10m,cloud_cover,temperature_850hPa,temperature_700hPa,temperature_500hPa,dew_point_850hPa,dew_point_700hPa,dew_point_500hPa&timezone=auto"

def fetch_weather_to_csv(api_url, filename="weather_data_for_ai.csv"):
    print("Đang tải dữ liệu từ Open-Meteo...")

    # 2. Gọi API
    response = requests.get(api_url)

    if response.status_code == 200:
        data = response.json()

        # 3. Trích xuất dữ liệu hourly
        hourly_data = data['hourly']

        # 4. Chuyển đổi sang DataFrame của Pandas
        df = pd.DataFrame(hourly_data)

        # 5. Chuyển cột 'time' sang định dạng datetime (Rất quan trọng cho AI)
        df['time'] = pd.to_datetime(df['time'])

        # 6. Xuất ra file CSV
        df.to_csv(filename, index=False, encoding='utf-8')

        print(f"Thành công! File đã được lưu tại: {filename}")
        print(df.head()) # Hiển thị 5 dòng đầu tiên để kiểm tra
    else:
        print(f"Lỗi khi gọi API: {response.status_code}")

# Thực hiện
fetch_weather_to_csv(url)