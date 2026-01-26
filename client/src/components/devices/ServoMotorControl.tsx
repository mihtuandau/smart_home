'use client';

import { useState } from 'react';

export default function ServoMotorControl() {
  const [position, setPosition] = useState<'close' | 'middle' | 'open'>('open');
  const [autoMode, setAutoMode] = useState(true);
  
  const getAngle = () => {
    switch (position) {
      case 'close': return '0';
      case 'middle': return '90';
      case 'open': return '180';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="font-semibold text-gray-900">Điều khiển Servo Motor</h3>
        </div>
        
        <span className="px-3 py-1 bg-black text-white rounded-lg text-sm font-medium">
          {autoMode ? 'Tự động' : 'Thủ công'}
        </span>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">Điều khiển mái che tự động (Awning)</p>
      
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-600 text-center mb-2">Vị trí mái che</p>
        <p className="text-4xl font-bold text-gray-900 text-center mb-6">{getAngle()}°</p>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPosition('close')}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-colors ${
              position === 'close' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm font-medium">Đóng</span>
          </button>
          
          <button
            onClick={() => setPosition('middle')}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-colors ${
              position === 'middle' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Giữa</span>
          </button>
          
          <button
            onClick={() => setPosition('open')}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg transition-colors ${
              position === 'open' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
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
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-gray-900">Không mưa</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Ánh sáng:</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-gray-900">Ban ngày → Mở</span>
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
  );
}
