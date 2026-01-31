# Energy Page - Trang Giám Sát Năng Lượng

Trang giám sát hệ thống năng lượng mặt trời và pin của Smart Home.

## 📊 Components

### 1. **EnergyStatsGrid** 
Hiển thị 4 chỉ số chính:
- ☀️ **Solar Panel** - Công suất hiện tại (W)
- ⚡ **Dòng điện** - Dòng tiêu thụ (A)
- 🔌 **Điện áp** - Điện áp đầu ra (V)
- 📊 **Năng lượng** - Tổng năng lượng 24h (Wh)

**API:** `GET /energy/stats?hours=24`

### 2. **BatteryStatus**
Trạng thái pin real-time:
- Mức pin (%)
- Điện áp (V)
- Dòng điện (A)
- Trạng thái (Đang sạc/Đang xả/Chờ)

**API:** `GET /energy/battery`

### 3. **SolarPowerChart**
Biểu đồ công suất Solar Panel theo thời gian (Area Chart)

**API:** `GET /energy/solar?hours=24`

### 4. **CurrentVoltageChart**
Biểu đồ dòng điện & điện áp theo thời gian (Line Chart)

**API:** `GET /energy/stats?hours=24`

### 5. **EnergySystemTable**
Bảng thông tin hệ thống năng lượng:
- Solar Panel specs
- Năng lượng thu được
- Nguồn điện
- Hiệu suất

**API:** 
- `GET /energy/stats?hours=24`
- `GET /energy/sources?hours=24`

---

## 🔌 API Endpoints

```typescript
// Energy Stats - Dữ liệu năng lượng
GET /energy/stats?hours=24
Response: {
  success: true,
  period: "24h",
  count: 100,
  data: [
    {
      timestamp: "2026-01-31T10:00:00Z",
      power: 8.23,      // W
      energy: 0.15,     // Wh
      voltage: 4.90,    // V
      current: 1.06,    // A
      source: "SOLAR"
    }
  ]
}

// Battery Status - Trạng thái pin
GET /energy/battery
Response: {
  success: true,
  data: {
    level: 75,           // %
    voltage: 3.65,       // V
    current: 0.5,        // A
    status: "CHARGING",  // CHARGING | DISCHARGING | IDLE
    lastUpdate: "2026-01-31T10:00:00Z"
  }
}

// Solar Stats - Thống kê năng lượng mặt trời
GET /energy/solar?hours=24
Response: {
  success: true,
  period: "24h",
  data: [
    {
      timestamp: "2026-01-31T10:00:00Z",
      power: 8.5,
      energy: 0.2
    }
  ]
}

// Power Sources - Nguồn điện
GET /energy/sources?hours=24
Response: {
  success: true,
  period: "24h",
  data: {
    solar: 45.2,  // Wh
    grid: 0,      // Wh
    battery: 12.5 // Wh
  }
}

// Efficiency Metrics - Hiệu suất
GET /energy/efficiency?hours=24
Response: {
  success: true,
  data: {
    solarEfficiency: 85,
    batteryEfficiency: 92,
    systemEfficiency: 80
  }
}
```

---

## 🎯 Hooks

```typescript
import { 
  useEnergyStats, 
  useBatteryStatus, 
  useSolarStats,
  usePowerSources,
  useEfficiencyMetrics 
} from '@/hooks/useEnergy';

// Usage
const { data, isLoading, error } = useEnergyStats(24);
const { data: battery } = useBatteryStatus(); // Auto refetch every 10s
```

---

## 📦 Features

- ✅ **Real-time Data** - Auto refetch battery status mỗi 10 giây
- ✅ **Loading States** - Skeleton loading cho tất cả components
- ✅ **Error Handling** - Hiển thị error khi API fail
- ✅ **Responsive Charts** - Biểu đồ tự động scale
- ✅ **Color Coded** - Màu sắc theo trạng thái (xanh/vàng/đỏ)

---

## 🎨 Color Scheme

- **Solar Panel**: Orange (#f59e0b)
- **Current**: Orange (#f97316)
- **Voltage**: Purple (#a855f7)
- **Energy**: Green (#10b981)
- **Battery Charging**: Green
- **Battery Discharging**: Orange
- **Battery Low**: Red

---

## 🔄 Data Flow

```
Component → Hook (useEnergy) → Service (energyService) → API Client → Backend
```

---

## 📝 Notes

- Tất cả data đều lưu trong bảng `powerData` của database
- Backend tính toán energy từ power readings
- Charts tự động group data theo interval (1h cho 24h)
- Battery status được cache 5 phút, refetch mỗi 10 giây

---

## 🚀 Usage

```tsx
import EnergyPage from '@/app/energy/page';

// Hoặc import từng component
import {
  EnergyStatsGrid,
  BatteryStatus,
  SolarPowerChart,
  CurrentVoltageChart,
  EnergySystemTable
} from '@/components/energy';
```
