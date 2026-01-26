'use client';

import { useState } from 'react';

export default function LEDControl() {
  const [brightness, setBrightness] = useState(75);
  const [leds, setLeds] = useState([
    { id: 1, name: 'LED 1 - Phòng khách', description: 'Đèn chính phòng khách', enabled: false },
    { id: 2, name: 'LED 2 - Phòng ngủ', description: 'Đèn phòng ngủ chính', enabled: false },
    { id: 3, name: 'LED 3 - Bếp', description: 'Đèn khu vực nhà bếp', enabled: false },
  ]);

  const toggleLed = (id: number) => {
    setLeds(leds.map(led => led.id === id ? { ...led, enabled: !led.enabled } : led));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-semibold text-gray-900">Điều khiển đèn LED (x3)</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">Mở phòng hệ thống chiếu sáng trong nhà</p>
      
      <div className="space-y-4 mb-6">
        {leds.map((led) => (
          <div key={led.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{led.name}</p>
                <p className="text-sm text-gray-500">{led.description}</p>
              </div>
            </div>
            
            <button
              onClick={() => toggleLed(led.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                led.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  led.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Độ sáng LED</h4>
          <span className="px-3 py-1 bg-black text-white rounded-full text-sm font-medium">
            {brightness}%
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={(e) => setBrightness(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
        />
        
        <p className="text-sm text-gray-600 mt-2">
          Điều chỉnh độ sáng cho tất cả đèn LED (PWM)
        </p>
      </div>
    </div>
  );
}
