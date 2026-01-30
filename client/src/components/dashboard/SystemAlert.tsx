'use client';

import { useDeviceStatus } from '@/hooks/useDevices';

export default function SystemAlert() {
  const { data: response, isLoading } = useDeviceStatus(30000);
  const status = (response as any)?.mqtt === 'connected' ? 'connected' : 'disconnected';

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-900 text-sm mb-1">Mất kết nối MQTT</h3>
            <p className="text-sm text-red-700">Hệ thống không thể kết nối với MQTT broker. Kiểm tra lại kết nối.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-green-900 text-sm mb-1">Hệ thống hoạt động tốt</h3>
          <p className="text-sm text-green-700">Tất cả cảm biến và thiết bị đang hoạt động bình thường. MQTT đang kết nối.</p>
        </div>
      </div>
    </div>
  );
}
