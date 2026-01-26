'use client';

export default function BatteryStatus() {
  const batteryLevel = 75;
  const voltage = '3.65V';
  const status = 'Đang sạc';
  const capacity = '3000mAh';

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h6v10H5V5z" clipRule="evenodd"/>
            <path d="M13 7h2v6h-2V7z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Trạng thái Pin</h2>
          <p className="text-sm text-gray-500">Pin Cell qua CN3791 Solar Charger Module</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Mức pin</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{batteryLevel}%</span>
              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
                ⚡ {status}
              </span>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full transition-all duration-500"
              style={{ width: `${batteryLevel}%` }}
            ></div>
          </div>
        </div>

        {/* Battery Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Điện áp</p>
            <p className="text-lg font-bold text-gray-900">{voltage}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
            <p className="text-lg font-bold text-gray-900">{status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Dung lượng</p>
            <p className="text-lg font-bold text-gray-900">{capacity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
