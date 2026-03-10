'use client';

import { useSensors } from '@/hooks/useSensors';
import { calculateRainProbability, getColorScheme } from '@/lib/rainProbabilityUtils';

interface FactorAnalysis {
  name: string;
  value: number;
  percentage: number;
  color: string;
  bgColor: string;  // Hex color cho progress bar
  interpretation: string;
}

export default function RainProbabilityPredictor() {
  const { data: response, isLoading } = useSensors(1, 3000);
  const data = (response as any)?.data?.[0] || null;

  // Helper function để tạo factor analysis array
  const getFactorAnalysis = (): FactorAnalysis[] => {
    if (!data) return [];

    const pressure = data.pressure;
    const { pressureFactor, humidityFactor, temperatureFactor } = calculateRainProbability(
      data.temperature,
      data.humidity,
      data.pressure,
      data.isRaining
    );

    // Pressure
    let pressureColor = 'text-red-600';
    let pressureBgColor = '#dc2626';
    let pressureInterpretation = 'Rất thấp - Mưa sắp tới';
    if (pressure < 1000) {
      pressureColor = 'text-red-600';
      pressureBgColor = '#dc2626';
      pressureInterpretation = 'Rất thấp - Mưa sắp tới';
    } else if (pressure < 1013) {
      pressureColor = 'text-yellow-600';
      pressureBgColor = '#ca8a04';
      pressureInterpretation = 'Hơi thấp - Có khả năng mưa';
    } else if (pressure < 1030) {
      pressureColor = 'text-green-600';
      pressureBgColor = '#16a34a';
      pressureInterpretation = 'Bình thường - Ít mưa';
    } else {
      pressureColor = 'text-green-600';
      pressureBgColor = '#16a34a';
      pressureInterpretation = 'Cao - Thời tiết ổn định';
    }

    // Humidity
    let humidityColor = 'text-red-600';
    let humidityBgColor = '#dc2626';
    let humidityInterpretation = 'Rất khô';
    if (data.humidity < 30) {
      humidityColor = 'text-green-600';
      humidityBgColor = '#16a34a';
      humidityInterpretation = 'Rất khô';
    } else if (data.humidity < 50) {
      humidityColor = 'text-green-600';
      humidityBgColor = '#16a34a';
      humidityInterpretation = 'Khô';
    } else if (data.humidity < 70) {
      humidityColor = 'text-blue-600';
      humidityBgColor = '#2563eb';
      humidityInterpretation = 'Vừa phải';
    } else if (data.humidity < 85) {
      humidityColor = 'text-yellow-600';
      humidityBgColor = '#ca8a04';
      humidityInterpretation = 'Ẩm - Sắp mưa';
    } else {
      humidityColor = 'text-red-600';
      humidityBgColor = '#dc2626';
      humidityInterpretation = 'Rất ẩm - Mưa gần';
    }

    // Temperature
    let tempColor = 'text-green-600';
    let tempBgColor = '#16a34a';
    let tempInterpretation = 'Bình thường';
    if (data.temperature < 10) {
      tempColor = 'text-blue-600';
      tempBgColor = '#2563eb';
      tempInterpretation = 'Lạnh - Giảm khả năng mưa';
    } else if (data.temperature < 20) {
      tempColor = 'text-green-600';
      tempBgColor = '#16a34a';
      tempInterpretation = 'Mát - Bình thường';
    } else if (data.temperature < 28) {
      tempColor = 'text-green-600';
      tempBgColor = '#16a34a';
      tempInterpretation = 'Ấm - Bình thường';
    } else {
      tempColor = 'text-red-600';
      tempBgColor = '#dc2626';
      tempInterpretation = 'Nóng - Khả năng giông mưa';
    }

    return [
      {
        name: `Áp suất: ${pressure.toFixed(1)} hPa`,
        value: pressure,
        percentage: pressureFactor,
        color: pressureColor,
        bgColor: pressureBgColor,
        interpretation: pressureInterpretation,
      },
      {
        name: `Độ ẩm: ${data.humidity}%`,
        value: data.humidity,
        percentage: humidityFactor,
        color: humidityColor,
        bgColor: humidityBgColor,
        interpretation: humidityInterpretation,
      },
      {
        name: `Nhiệt độ: ${data.temperature}°C`,
        value: data.temperature,
        percentage: temperatureFactor,
        color: tempColor,
        bgColor: tempBgColor,
        interpretation: tempInterpretation,
      },
    ];
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const analysis = calculateRainProbability(data.temperature, data.humidity, data.pressure, data.isRaining);
  const probability = analysis.probability;
  const colorScheme = getColorScheme(probability);
  const factors = getFactorAnalysis();

  return (
    <div className={`rounded-lg p-4 sm:p-6 border-2 ${colorScheme.bg}`} style={{ borderColor: colorScheme.border }}>
      <div className="mb-6">
        <h2 className={`text-lg font-bold ${colorScheme.text} mb-1`}>🔮 Liệu hôm nay có mưa không?</h2>
        <p className="text-sm text-gray-600">Dự báo dựa trên: Áp suất (50%) + Độ ẩm (35%) + Nhiệt độ (15%)</p>
      </div>

      {/* Hiển thị xác suất chính - Lớn và nổi bật */}
      <div className="mb-6 bg-white/80 rounded-lg p-4 border border-gray-200">
        <div className="text-center mb-3">
          <span className={`text-4xl sm:text-5xl font-bold ${colorScheme.text}`}>{probability}%</span>
          <p className="text-sm text-gray-600 mt-1">Khả năng mưa</p>
        </div>
        <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${probability}%`,
              backgroundColor: colorScheme.border,
            }}
          />
        </div>
      </div>

      {/* Kết luận - Đặt trước chi tiết */}
      <div className="bg-white/80 rounded-lg p-4 border-l-4 mb-6" style={{ borderColor: colorScheme.border }}>
        <p className={`font-bold text-base mb-2 ${colorScheme.text}`}>{analysis.conclusion.title}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.conclusion.description}</p>
      </div>

      {/* Chi tiết từng yếu tố */}
      <div className="mb-6 space-y-3">
        <p className="font-semibold text-gray-900 text-sm">📊 Điều kiện thời tiết:</p>
        {factors.map((factor, idx) => (
          <div key={idx} className="bg-white/60 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${factor.color}`}>{factor.name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${factor.color === 'text-red-600' ? 'bg-red-100' : factor.color === 'text-yellow-600' ? 'bg-yellow-100' : factor.color === 'text-blue-600' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {factor.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${factor.percentage}%`,
                  backgroundColor: factor.bgColor,
                }}
              />
            </div>
            <p className={`text-xs leading-relaxed ${factor.color}`}>→ {factor.interpretation}</p>
          </div>
        ))}
      </div>

      {/* Gợi ý hành động */}
      <div className={`rounded-lg p-4 mb-4 border-l-4 ${probability >= 80 ? 'bg-red-50 border-l-red-600' : probability >= 60 ? 'bg-yellow-50 border-l-yellow-600' : probability >= 40 ? 'bg-blue-50 border-l-blue-600' : 'bg-green-50 border-l-green-600'}`}>
        <p className={`text-sm font-bold mb-2 ${probability >= 80 ? 'text-red-700' : probability >= 60 ? 'text-yellow-700' : probability >= 40 ? 'text-blue-700' : 'text-green-700'}`}>
          💡 {probability >= 80 ? '⚠️ Chuẩn bị ngay' : probability >= 60 ? '⚡ Để ý' : probability >= 40 ? '🔍 Theo dõi' : '✅ An tâm'}
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          {probability >= 80 ? 'Mưa sắp tới. Có thể mưa bất kỳ lúc nào trong hôm nay.'
          : probability >= 60 ? 'Có khả năng mưa vào chiều hoặc tối nay.'
          : probability >= 40 ? 'Thời tiết có thể thay đổi. Theo dõi cập nhật trong vài giờ tới.'
          : 'Thời tiết ổn định. Không lo về mưa hôm nay.'}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded p-3 text-center border border-gray-200">
        ℹ️ <strong>Lưu ý:</strong> Đây chỉ là dự báo sơ bộ. Để chính xác 100%, hãy kiểm tra thời tiết từ các nguồn chính thức.
      </div>
    </div>
  );
}
