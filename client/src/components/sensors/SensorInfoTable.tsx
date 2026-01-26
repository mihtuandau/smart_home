'use client';

interface SensorInfo {
  name: string;
  status: string;
  statusColor: string;
  automation: string;
  detail: string;
  detailColor?: string;
}

export default function SensorInfoTable() {
  const sensors: SensorInfo[] = [
    {
      name: 'AHT20 (Temp & Humidity)',
      status: 'Hoạt động',
      statusColor: 'text-green-700',
      automation: 'Điều khiển đèn LED',
      detail: 'Theo ánh sáng',
      detailColor: 'text-gray-900'
    },
    {
      name: 'BMP280 (Pressure)',
      status: 'Hoạt động',
      statusColor: 'text-green-700',
      automation: 'Servo mái che',
      detail: 'Theo mưa & ánh sáng',
      detailColor: 'text-gray-900'
    },
    {
      name: 'LM393 LDR (Light)',
      status: 'Hoạt động',
      statusColor: 'text-green-700',
      automation: 'Màn hình OLED',
      detail: 'Cập nhật 3s',
      detailColor: 'text-gray-900'
    },
    {
      name: 'Rain Sensor',
      status: 'Hoạt động',
      statusColor: 'text-green-700',
      automation: 'ESP32 DevKit',
      detail: 'Online',
      detailColor: 'text-green-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Thông tin cảm biến</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cảm biến môi trường</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tự động hóa</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">{sensor.name}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${sensor.statusColor}`}>
                      {sensor.status}
                    </span>
                    <span className="text-sm text-gray-600">{sensor.automation}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`text-sm font-bold ${sensor.detailColor || 'text-gray-900'}`}>
                    {sensor.detail}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
