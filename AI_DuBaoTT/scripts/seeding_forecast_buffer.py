import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# 1. Cấu hình Endpoint HISTORICAL chuyên dụng
URL_HISTORICAL = "https://historical-forecast-api.open-meteo.com/v1/forecast"
LAT = 10.95
LON = 106.82

def calculate_indices(row):
    """
    Tính toán Feature Engineering - Khắc phục lỗi NaN bằng cách định nghĩa đầy đủ
    """
    T = row['temperature_2m']
    RH = row['relative_humidity_2m']
    
    # Tính điểm sương bề mặt
    row['Td_surface'] = T - ((100 - RH) / 5)
    
    # Chỉ số K-Index
    row['K_Index'] = (row['temperature_850hPa'] - row['temperature_500hPa']) + \
                     row['dew_point_850hPa'] - (row['temperature_700hPa'] - row['dew_point_700hPa'])
    
    # Chỉ số Lifted Index (xấp xỉ)
    row['Lifted_Index'] = row['temperature_500hPa'] - (row['temperature_2m'] - 20) 
    
    # Các đặc trưng hiệu số cơ bản
    row['temp_dewpoint_spread'] = T - row['Td_surface']
    row['stability_index'] = row['K_Index'] - row['Lifted_Index']
    
    # --- CÁC PHÉP TÍNH BỊ THIẾU DẪN ĐẾN NaN ---
    row['temp_diff_850_500'] = row['temperature_850hPa'] - row['temperature_500hPa']
    row['temp_diff_850_700'] = row['temperature_850hPa'] - row['temperature_700hPa']
    row['dewpoint_diff_850_700'] = row['dew_point_850hPa'] - row['dew_point_700hPa']
    
    return row

def get_seeding_data():
    # Lấy dữ liệu 2 ngày gần nhất để đảm bảo đủ 24 mẫu thực tế
    today = datetime.now()
    start_date = (today - timedelta(days=2)).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')

    params = {
        "latitude": LAT,
        "longitude": LON,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": [
            "temperature_2m", "relative_humidity_2m", "surface_pressure", "precipitation",
            "wind_speed_10m", "cloud_cover",
            "temperature_850hPa", "temperature_700hPa", "temperature_500hPa",
            "dew_point_850hPa", "dew_point_700hPa", "dew_point_500hPa"
        ],
        "timezone": "auto"
    }

    try:
        print(f"Đang gọi API Historical: {start_date} đến {end_date}...")
        response = requests.get(URL_HISTORICAL, params=params)
        response.raise_for_status()
        data = response.json()['hourly']

        df = pd.DataFrame(data)
        df['dt_obj'] = pd.to_datetime(df['time'])
        
        # Lấy đúng 24 mẫu gần nhất so với thời điểm hiện tại
        now = datetime.now()
        df_past = df[df['dt_obj'] < now].tail(24)

        # Thực hiện tính toán các chỉ số (Feature Engineering)
        df_past = df_past.apply(calculate_indices, axis=1)

        final_buffer = []
        for _, row in df_past.iterrows():
            precip_val = round(float(row['precipitation']), 2)
            
            # Đóng gói dữ liệu - Đảm bảo KHÔNG CÒN NaN
            item = {
                "dt": int(row['dt_obj'].timestamp()),
                "timestamp": row['dt_obj'].strftime("%Y-%m-%d %H:%M:%S"),
                "temperature_2m": round(float(row['temperature_2m']), 2),
                "relative_humidity_2m": round(float(row['relative_humidity_2m']), 2),
                "surface_pressure": round(float(row['surface_pressure']), 2),
                "precipitation": precip_val,
                "rain_mm": precip_val,
                "temperature_850hPa": round(float(row['temperature_850hPa']), 2),
                "dew_point_850hPa": round(float(row['dew_point_850hPa']), 2),
                "temperature_700hPa": round(float(row['temperature_700hPa']), 2),
                "dew_point_700hPa": round(float(row['dew_point_700hPa']), 2),
                "temperature_500hPa": round(float(row['temperature_500hPa']), 2),
                "dew_point_500hPa": round(float(row['dew_point_500hPa']), 2),
                "wind_speed_10m": round(float(row['wind_speed_10m']), 2),
                "cloud_cover": round(float(row['cloud_cover']), 2),
                "Td_surface": round(float(row['Td_surface']), 2),
                "K_Index": round(float(row['K_Index']), 2),
                "Lifted_Index": round(float(row['Lifted_Index']), 2),
                "temp_dewpoint_spread": round(float(row['temp_dewpoint_spread']), 2),
                "stability_index": round(float(row['stability_index']), 2),
                # Đã sửa lỗi NaN bằng cách cung cấp giá trị đã tính toán
                "temp_diff_850_500": round(float(row['temp_diff_850_500']), 2),
                "temp_diff_850_700": round(float(row['temp_diff_850_700']), 2),
                "dewpoint_diff_850_700": round(float(row['dewpoint_diff_850_700']), 2)
            }
            final_buffer.append(item)

        # Lưu file
        os.makedirs("results", exist_ok=True)
        with open("results/forecast_buffer.json", "w", encoding='utf-8') as f:
            json.dump(final_buffer, f, indent=4, ensure_ascii=False)
        
        print(f"✅ Seeding hoàn tất! File buffer đã sạch lỗi NaN và sẵn sàng cho LSTM.")

    except Exception as e:
        print(f"❌ Lỗi thực thi Seeding: {e}")

if __name__ == "__main__":
    get_seeding_data()

# import requests
# import json
# import pandas as pd
# import numpy as np
# from datetime import datetime, timedelta
# import os

# # 1. Cấu hình tọa độ
# LAT = 10.95
# LON = 106.82
# URL = "https://api.open-meteo.com/v1/forecast"

# # 2. Cấu hình tham số API
# params = {
#     "latitude": LAT,
#     "longitude": LON,
#     "hourly": [
#         "temperature_2m", "relative_humidity_2m", "surface_pressure", "rain",
#         "wind_speed_10m", "cloud_cover",
#         "temperature_850hPa", "temperature_700hPa", "temperature_500hPa",
#         "dew_point_850hPa", "dew_point_700hPa", "dew_point_500hPa"
#     ],
#     "timezone": "auto",
#     "past_days": 1,      # Lấy dữ liệu quá khứ 24h
#     "forecast_days": 1   # Chỉ lấy thêm 1 ngày dự báo để nhẹ data
# }

# def calculate_indices(row):
#     """Tính toán Feature Engineering cho mô hình Hybrid"""
#     # Tính điểm sương bề mặt (Td)
#     T = row['temperature_2m']
#     RH = row['relative_humidity_2m']
#     row['Td_surface'] = T - ((100 - RH) / 5)
    
#     # Tính K-Index
#     row['K_Index'] = (row['temperature_850hPa'] - row['temperature_500hPa']) + \
#                      row['dew_point_850hPa'] - (row['temperature_700hPa'] - row['dew_point_700hPa'])
    
#     # Tính Lifted Index xấp xỉ
#     row['Lifted_Index'] = row['temperature_500hPa'] - (row['temperature_2m'] - 20) 
    
#     # Các đặc trưng hiệu số
#     row['temp_dewpoint_spread'] = T - row['Td_surface']
#     row['temp_diff_850_500'] = row['temperature_850hPa'] - row['temperature_500hPa']
#     row['temp_diff_850_700'] = row['temperature_850hPa'] - row['temperature_700hPa']
#     row['dewpoint_diff_850_700'] = row['dew_point_850hPa'] - row['dew_point_700hPa']
#     row['stability_index'] = row['K_Index'] - row['Lifted_Index']
    
#     return row

# try:
#     print(f"Đang gọi API Open-Meteo cho tọa độ {LAT}, {LON}...")
#     response = requests.get(URL, params=params)
#     response.raise_for_status()
#     data = response.json()['hourly']

#     # 3. Xử lý dữ liệu bằng Pandas[cite: 5]
#     df = pd.DataFrame(data)
#     df['dt_obj'] = pd.to_datetime(df['time'])
    
#     # LỌC CHÍNH XÁC: Chỉ lấy 24 mẫu có thời gian <= hiện tại (Dữ liệu quá khứ)[cite: 5]
#     now = datetime.now()
#     df_past = df[df['dt_obj'] <= now].tail(24)

#     # Nếu vì lý do gì đó không đủ 24 mẫu quá khứ, lấy 24 mẫu đầu tiên của kết quả trả về
#     if len(df_past) < 24:
#         df_subset = df.head(24)
#     else:
#         df_subset = df_past

#     # Áp dụng tính toán chỉ số
#     df_subset = df_subset.apply(calculate_indices, axis=1)

#     # 4. Chuyển đổi sang định dạng JSON khớp với hệ thống của bạn[cite: 5]
#     final_buffer = []
#     for _, row in df_subset.iterrows():
#         item = {
#             "dt": int(row['dt_obj'].timestamp()),
#             "timestamp": row['dt_obj'].strftime("%Y-%m-%d %H:%M:%S"),
#             "temperature_2m": round(row['temperature_2m'], 2),
#             "relative_humidity_2m": round(row['relative_humidity_2m'], 2),
#             "surface_pressure": round(row['surface_pressure'], 2),
#             "rain_mm": round(row['rain'], 2),
#             "precipitation": round(row['rain'], 2),
#             "temperature_850hPa": round(row['temperature_850hPa'], 2),
#             "dew_point_850hPa": round(row['dew_point_850hPa'], 2),
#             "temperature_700hPa": round(row['temperature_700hPa'], 2),
#             "dew_point_700hPa": round(row['dew_point_700hPa'], 2),
#             "temperature_500hPa": round(row['temperature_500hPa'], 2),
#             "dew_point_500hPa": round(row['dew_point_500hPa'], 2),
#             "wind_speed_10m": round(row['wind_speed_10m'], 2),
#             "cloud_cover": round(row['cloud_cover'], 2),
#             "Td_surface": round(row['Td_surface'], 2),
#             "K_Index": round(row['K_Index'], 2),
#             "Lifted_Index": round(row['Lifted_Index'], 2),
#             "temp_dewpoint_spread": round(row['temp_dewpoint_spread'], 2),
#             "temp_diff_850_500": round(row['temp_diff_850_500'], 2),
#             "temp_diff_850_700": round(row['temp_diff_850_700'], 2),
#             "dewpoint_diff_850_700": round(row['dewpoint_diff_850_700'], 2),
#             "stability_index": round(row['stability_index'], 2)
#         }
#         final_buffer.append(item)

#     # 5. Ghi file vào đúng thư mục results
#     output_dir = "results"
#     if not os.path.exists(output_dir):
#         os.makedirs(output_dir)

#     file_path = os.path.join(output_dir, "forecast_buffer.json")

#     with open(file_path, "w") as f:
#         json.dump(final_buffer, f, indent=4)

#     print(f"Thành công! Đã tạo và lưu 24 mẫu dữ liệu QUÁ KHỨ vào: {file_path}")

# except Exception as e:
#     print(f"Lỗi khi tạo buffer: {e}")