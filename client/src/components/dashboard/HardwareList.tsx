'use client';

interface HardwareItem {
  name: string;
  description: string;
  borderColor: string;
}

export default function HardwareList() {
  const hardware: HardwareItem[] = [
    { name: 'ESP32 DevKit 1', description: 'Bộ điều khiển chính', borderColor: '#3b82f6' },
    { name: 'LM393 LDR', description: 'Cảm biến ánh sáng', borderColor: '#eab308' },
    { name: 'INA219 DC', description: 'Đo dòng & điện áp', borderColor: '#f97316' },
    { name: 'OLED I2C 128x64', description: 'Màn hình hiển thị', borderColor: '#a855f7' },
    { name: 'AHT20 + BMP280', description: 'Nhiệt độ, độ ẩm, áp suất', borderColor: '#ec4899' },
    { name: 'CN3791 Solar Charger', description: 'Sạc pin từ solar', borderColor: '#10b981' },
    { name: 'x4 TOUCH Sensors', description: 'Cảm biến chạm', borderColor: '#8b5cf6' },
    { name: 'DC-DC XL4005E1', description: 'Bộ hạ áp 5V', borderColor: '#ec4899' },
    { name: 'x3 LED + Servo', description: 'Đèn & động cơ servo', borderColor: '#06b6d4' },
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Phần cứng hệ thống</h2>
        <p className="text-sm text-gray-500 mt-1">Danh sách các linh kiện trong mô hình Smart Home</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {hardware.map((item, index) => (
          <div 
            key={index} 
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${item.borderColor}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.borderColor }}></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{item.name}</h3>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
