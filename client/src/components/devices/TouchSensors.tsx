'use client';

import { useLatestDeviceData } from '@/hooks/useDevices';

export default function TouchSensors() {
  const { data: response, isLoading } = useLatestDeviceData(3000);
  const data = (response as any)?.data || response;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const sensors = [
    { id: 1, name: 'Touch 1', status: data?.touch1 ? 'Đang chạm' : 'Không chạm', active: data?.touch1 },
    { id: 2, name: 'Touch 2', status: data?.touch2 ? 'Đang chạm' : 'Không chạm', active: data?.touch2 },
    { id: 3, name: 'Touch 3', status: data?.touch3 ? 'Đang chạm' : 'Không chạm', active: data?.touch3 },
    { id: 4, name: 'Touch 4', status: data?.touch4 ? 'Đang chạm' : 'Không chạm', active: data?.touch4 },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900">Cảm biến chạm (x4 TOUCH)</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">Trạng thái cảm biến chạm capacitive</p>
      
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {sensors.map((sensor) => (
          <div 
            key={sensor.id} 
            className={`rounded-lg p-4 sm:p-6 text-center border-2 transition-all ${
              sensor.active 
                ? 'bg-blue-50 border-blue-500' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ${
              sensor.active ? 'bg-blue-100' : 'bg-gray-200'
            }`}>
              <svg className={`w-8 h-8 ${sensor.active ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">{sensor.name}</p>
            <p className={`text-sm font-medium ${sensor.active ? 'text-blue-600' : 'text-gray-500'}`}>
              {sensor.status}
            </p>
          </div>
        ))}
      </div>
      
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-700">
          Cảm biến chạm được kết nối với ESP32 để điều khiển thiết bị thông qua chạm
        </p>
      </div>
    </div>
  );
}
