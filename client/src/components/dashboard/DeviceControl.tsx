'use client';

import { useLatestDeviceData } from '@/hooks/useDevices';

interface DeviceData {
  led1: boolean;
  led2: boolean;
  temperature: number;
  voltage: number;
}

interface Device {
  name: string;
  status: string;
  statusColor: string;
  icon: string;
}

export default function DeviceControl() {
  const { data: response, isLoading } = useLatestDeviceData(3000); 
  const data = (response as any)?.data || response;

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const ledCount = (data.led1 ? 1 : 0) + (data.led2 ? 1 : 0);

  const devices: Device[] = [
    { 
      name: 'LED đang bật', 
      status: `${ledCount}/2`, 
      statusColor: ledCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700', 
      icon: '💡' 
    },
    { 
      name: 'Servo Motor', 
      status: 'Auto', 
      statusColor: 'bg-blue-100 text-blue-700', 
      icon: '🔄' 
    },
    { 
      name: 'ESP32 DevKit', 
      status: 'Online', 
      statusColor: 'bg-green-100 text-green-700', 
      icon: '⚡' 
    },
    { 
      name: 'CN3791 Charger', 
      status: `${data.voltage.toFixed(2)}V`, 
      statusColor: data.voltage > 3.5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700', 
      icon: '🔋' 
    },
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
