#!/usr/bin/env python3
"""
Script kiểm tra trạng thái MQTT Sensor
- Xem timestamp cuối cùng nhận được
- Tính chênh lệch với thời gian hiện tại
- Xác định sensor có offline không
"""

import json
from pathlib import Path
from datetime import datetime, timezone

def check_mqtt_status():
    """Kiểm tra trạng thái MQTT sensor"""
    
    cache_file = Path("data/cache/mqtt_sensor_cache.json")
    forecast_file = Path("results/current_forecast.json")
    
    print("=" * 70)
    print("KIỂM TRA TRẠNG THÁI MQTT SENSOR")
    print("=" * 70)
    
    # Kiểm tra cache
    if not cache_file.exists():
        print("❌ Không tìm thấy MQTT cache: data/cache/mqtt_sensor_cache.json")
        return
    
    try:
        with open(cache_file, 'r', encoding='utf-8') as f:
            cache_data = json.load(f)
        
        cache_timestamp = cache_data.get('timestamp')
        sensor_data = cache_data.get('sensor', {})
        sensor_dt = sensor_data.get('dt')
        
        # Chuyển đổi timestamp
        if sensor_dt:
            sensor_time = datetime.fromtimestamp(sensor_dt, tz=timezone.utc).replace(tzinfo=None)
        else:
            sensor_time = None
        
        now = datetime.utcnow()
        
        print(f"\n📊 MQTT CACHE STATUS:")
        print(f"  • Cache file: {cache_file}")
        print(f"  • Sensor timestamp (dt): {sensor_dt}")
        print(f"  • Sensor time: {sensor_time}")
        print(f"  • Thời gian hiện tại: {now}")
        
        if sensor_time:
            chenhLech = (now - sensor_time).total_seconds()
            print(f"\n⏱️ CHÊNH LỆCH:")
            print(f"  • Giây: {chenhLech:.0f}s")
            print(f"  • Phút: {chenhLech/60:.1f}m")
            print(f"  • Số chu kỳ (10s): {chenhLech/10:.1f}")
            
            # Phán đoán trạng thái
            print(f"\n🔍 PHÁN ĐOÁN TRẠNG THÁI:")
            if chenhLech < 15:
                print(f"  ✅ SENSOR HOẠT ĐỘNG: Chênh lệch < 15s (Bình thường)")
            elif chenhLech < 60:
                print(f"  ⚠️ SENSOR CÓ DELAY: Chênh lệch {chenhLech:.0f}s")
                print(f"     → Kiểm tra WiFi hoặc network")
            elif chenhLech < 300:
                print(f"  ⚠️⚠️ SENSOR CÓ VẤN ĐỀ: Chênh lệch {chenhLech/60:.1f}m")
                print(f"     → Sensor gần như offline")
                print(f"     → Cần restart hoặc kiểm tra device")
            else:
                print(f"  ❌❌ SENSOR OFFLINE: Chênh lệch {chenhLech/60:.1f}m")
                print(f"     → Sensor đã ngừng gửi MQTT")
                print(f"     → Cần kiểm tra và restart device ngay")
        
        # Kiểm tra forecast file
        print(f"\n📄 FORECAST FILE STATUS:")
        if forecast_file.exists():
            with open(forecast_file, 'r', encoding='utf-8') as f:
                forecast = json.load(f)
            
            generated_at_str = forecast.get('generated_at')
            timestamp_str = forecast.get('latest_sample', {}).get('timestamp')
            
            print(f"  • generated_at: {generated_at_str}")
            print(f"  • timestamp: {timestamp_str}")
            print(f"  • buffer_length: {forecast.get('buffer_length')}")
            print(f"  • status: {forecast.get('status')}")
        else:
            print(f"  ⚠️ Không tìm thấy forecast file")
        
        # Gợi ý
        print(f"\n💡 GỢI Ý:")
        if chenhLech > 60:
            print(f"  1. Kiểm tra thiết bị gửi MQTT:")
            print(f"     - Có kết nối WiFi OK không?")
            print(f"     - Có error log?")
            print(f"     - Có chạy được không?")
            print(f"\n  2. Restart sensor:")
            print(f"     - Restart device hoặc service gửi MQTT")
            print(f"\n  3. Kiểm tra lại sau 30 giây")
            print(f"     - Chênh lệch sẽ quay lại < 15s nếu OK")
    
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    check_mqtt_status()