'use client';

import { useState } from 'react';
import { useLatestDeviceData, useControlServo } from '@/hooks/useDevices';
import { useSensors } from '@/hooks/useSensors';
import Toast from '@/components/ui/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ServoMotorControl() {
  const { data: iotResponse, isLoading: iotLoading } = useLatestDeviceData(3000);
  const { data: sensorsResponse, isLoading: sensorsLoading } = useSensors(1, 3000);
  const controlServoMutation = useControlServo();
  const [toast, setToast] = useState<ToastState | null>(null);
  
  const data = (iotResponse as any)?.data || iotResponse;
  const sensorData = (sensorsResponse as any)?.data?.[0];
  const loading = iotLoading || sensorsLoading;

  const servoAngle = data?.servo_angle ?? 180;
  const position: 'close' | 'middle' | 'open' = 
    servoAngle === 0 ? 'close' : 
    servoAngle === 90 ? 'middle' : 'open';
  
  const getAngle = () => String(servoAngle);

  const controlServo = async (angle: 0 | 90 | 180) => {    
    try {
      await controlServoMutation.mutateAsync(angle);
      
      const positionName = angle === 0 ? 'đóng' : angle === 90 ? 'giữa' : 'mở';
      setToast({
        message: `Mái che đã chuyển về vị trí ${positionName}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to control servo:', error);
      setToast({
        message: 'Không thể điều khiển mái che',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-40 bg-gray-200 rounded mb-6"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const isDark = sensorData?.isDark ?? false;
  const isRaining = sensorData?.isRaining ?? false;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="font-semibold text-gray-900">Điều khiển Servo Motor</h3>
        </div>
        
        <span className="px-3 py-1 bg-black text-white rounded-lg text-sm font-medium">
          Tự động
        </span>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">Điều khiển mái che tự động (Awning)</p>
      
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-600 text-center mb-2">Vị trí mái che</p>
        <p className="text-4xl font-bold text-gray-900 text-center mb-2">{getAngle()}°</p>
        <p className={`text-sm text-center font-medium ${
          controlServoMutation.isPending ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {controlServoMutation.isPending ? '⏳ Đang chuyển...' : `● ${position === 'close' ? 'Đóng' : position === 'middle' ? 'Giữa' : 'Mở'}`}
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => controlServo(0)}
            disabled={controlServoMutation.isPending}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-colors ${
              position === 'close' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${controlServoMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm font-medium">Đóng</span>
          </button>
          
          <button
            onClick={() => controlServo(90)}
            disabled={controlServoMutation.isPending}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-colors ${
              position === 'middle' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${controlServoMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Giữa</span>
          </button>
          
          <button
            onClick={() => controlServo(180)}
            disabled={controlServoMutation.isPending}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-colors ${
              position === 'open' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${controlServoMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-sm font-medium">Mở</span>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h4 className="font-medium text-gray-900">Chế độ tự động</h4>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Cảm biến mưa:</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRaining ? 'bg-red-500' : 'bg-green-500'}`}></span>
              <span className="text-gray-900">{isRaining ? 'Có mưa → Đóng' : 'Không mưa'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Ánh sáng:</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
              <span className="text-gray-900">{isDark ? 'Ban đêm → Đóng' : 'Ban ngày → Mở'}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700">
            Mái che sẽ tự động đóng khi trời mưa hoặc ban đêm để đỡ phơi
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
      
