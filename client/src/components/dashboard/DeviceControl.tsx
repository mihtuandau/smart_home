'use client';

interface Device {
  name: string;
  status: string;
  statusColor: string;
  icon: string;
}

export default function DeviceControl() {
  const devices: Device[] = [
    { name: 'LED đang bật', status: '2/3', statusColor: 'bg-black text-white', icon: '💡' },
    { name: 'Servo Motor', status: 'Auto', statusColor: 'bg-black text-white', icon: '🔄' },
    { name: 'ESP32 DevKit', status: 'Online', statusColor: 'bg-green-100 text-green-700', icon: '⚡' },
    { name: 'CN3791 Charger', status: 'Charging', statusColor: 'bg-green-100 text-green-700', icon: '🔋' },
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Thiết bị điều khiển</h2>
        <p className="text-sm text-gray-500 mt-1">Trạng thái các thiết bị</p>
      </div>
      <div className="space-y-3">
        {devices.map((device, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-lg">{device.icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{device.name}</span>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${device.statusColor}`}>
              {device.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
