'use client';

export default function OledDisplay() {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4 text-blue-400">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"/>
        </svg>
        <div>
          <h2 className="text-lg font-bold">OLED Display I2C 128x64</h2>
          <p className="text-sm text-gray-400">Mô phỏng màn hình OLED hiển thị</p>
        </div>
      </div>

      {/* OLED Screen Simulation */}
      <div className="bg-black rounded-lg p-6 font-mono text-green-400 border-2 border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="border-2 border-green-400 px-4 py-1">
            <span className="animate-pulse">│ SMART HOME AI │</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Temp: 26.6°C</span>
            <span>Pres: 1013hPa</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Humi: 64%</span>
            <span>Light: 780lx</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400">✱ DAYTIME</span>
          </div>
          <div className="text-xs text-green-400 mt-2">01:17:04 27/1/2026</div>
        </div>
      </div>
    </div>
  );
}
