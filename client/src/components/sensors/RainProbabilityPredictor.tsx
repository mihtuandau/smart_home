'use client';

import { useSensors } from '@/hooks/useSensors';
import { calculateRainProbability, getColorScheme } from '@/lib/rainProbabilityUtils';
import { ChartColumn, CircleHelp, Lightbulb, Search, ShieldCheck, Sparkles, TriangleAlert, Zap } from 'lucide-react';

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

  const toSafeNumber = (value: unknown, fallback = 0) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  // Helper function để tạo factor analysis array
  const getFactorAnalysis = (): FactorAnalysis[] => {
    if (!data) return [];

    const pressure = toSafeNumber(data.pressure);
    const humidity = toSafeNumber(data.humidity);
    const temperature = toSafeNumber(data.temperature);
    const { pressureFactor, humidityFactor, temperatureFactor } = calculateRainProbability(
      temperature,
      humidity,
      pressure,
      Boolean(data.isRaining)
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
    if (humidity < 30) {
      humidityColor = 'text-green-600';
      humidityBgColor = '#16a34a';
      humidityInterpretation = 'Rất khô';
    } else if (humidity < 50) {
      humidityColor = 'text-green-600';
      humidityBgColor = '#16a34a';
      humidityInterpretation = 'Khô';
    } else if (humidity < 70) {
      humidityColor = 'text-blue-600';
      humidityBgColor = '#2563eb';
      humidityInterpretation = 'Vừa phải';
    } else if (humidity < 85) {
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
    if (temperature < 10) {
      tempColor = 'text-blue-600';
      tempBgColor = '#2563eb';
      tempInterpretation = 'Lạnh - Giảm khả năng mưa';
    } else if (temperature < 20) {
      tempColor = 'text-green-600';
      tempBgColor = '#16a34a';
      tempInterpretation = 'Mát - Bình thường';
    } else if (temperature < 28) {
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
        name: `Độ ẩm: ${humidity.toFixed(1)}%`,
        value: humidity,
        percentage: humidityFactor,
        color: humidityColor,
        bgColor: humidityBgColor,
        interpretation: humidityInterpretation,
      },
      {
        name: `Nhiệt độ: ${temperature.toFixed(1)}°C`,
        value: temperature,
        percentage: temperatureFactor,
        color: tempColor,
        bgColor: tempBgColor,
        interpretation: tempInterpretation,
      },
    ];
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const temperature = toSafeNumber(data.temperature);
  const humidity = toSafeNumber(data.humidity);
  const pressure = toSafeNumber(data.pressure);
  const analysis = calculateRainProbability(temperature, humidity, pressure, Boolean(data.isRaining));
  const probability = analysis.probability;
  const colorScheme = getColorScheme(probability);
  const factors = getFactorAnalysis();

  return (
    <div className={`rounded-xl p-4 sm:p-5 border ${colorScheme.bg} shadow-sm`} style={{ borderColor: colorScheme.border }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-sm sm:text-base font-semibold ${colorScheme.text} inline-flex items-center gap-1.5`}><Sparkles className="w-4 h-4" />Liệu hôm nay có mưa không?</h2>
        </div>
        <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-white/80 border border-gray-200 text-gray-600">Cập nhật realtime</span>
      </div>

      <div className="mb-4 bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <p className="text-xs text-gray-600">Khả năng mưa</p>
            <span className={`inline-block text-4xl sm:text-5xl leading-none font-extrabold tracking-tight ${colorScheme.text} drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]`}>
              {probability}%
            </span>
          </div>
          <span className={`min-w-[96px] text-center text-xs px-2.5 py-1 rounded-full font-semibold ${probability >= 80 ? 'bg-red-100 text-red-700' : probability >= 60 ? 'bg-yellow-100 text-yellow-700' : probability >= 40 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {probability >= 80 ? 'Cao' : probability >= 60 ? 'Trung bình' : probability >= 40 ? 'Theo dõi' : 'Thấp'}
          </span>
        </div>

        <div className="bg-gray-200 rounded-full h-3.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${probability}%`,
              backgroundColor: colorScheme.border,
            }}
          />
        </div>
      </div>

      <div className="bg-white/80 rounded-lg p-3 sm:p-4 border-l-4 mb-4" style={{ borderColor: colorScheme.border }}>
        <p className={`font-semibold text-sm mb-1 ${colorScheme.text}`}>{analysis.conclusion.title}</p>
        <p className="text-xs text-gray-700 leading-relaxed">{analysis.conclusion.description}</p>
      </div>

      <div className="mb-5">
        <p className="font-semibold text-gray-900 text-xs inline-flex items-center gap-1.5 mb-2.5"><ChartColumn className="w-4 h-4" />Điều kiện thời tiết</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {factors.map((factor, idx) => (
            <div key={idx} className="bg-white/80 rounded-lg p-3 border border-gray-200 h-full flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-gray-800 leading-snug">{factor.name}</span>
                <span
                  className={`shrink-0 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-md leading-none ${factor.color === 'text-red-600' ? 'bg-red-600 text-white' : factor.color === 'text-yellow-600' ? 'bg-yellow-600 text-white' : factor.color === 'text-blue-600' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}
                >
                  {factor.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-auto">
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${factor.percentage}%`,
                      backgroundColor: factor.bgColor,
                    }}
                  />
                </div>
                <p className={`text-[10px] leading-relaxed ${factor.color}`}>{factor.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-lg p-3 sm:p-4 mb-3 border-l-4 ${probability >= 80 ? 'bg-red-50 border-l-red-600' : probability >= 60 ? 'bg-yellow-50 border-l-yellow-600' : probability >= 40 ? 'bg-blue-50 border-l-blue-600' : 'bg-green-50 border-l-green-600'}`}>
        <p className={`text-xs font-semibold mb-1.5 inline-flex items-center gap-1.5 ${probability >= 80 ? 'text-red-700' : probability >= 60 ? 'text-yellow-700' : probability >= 40 ? 'text-blue-700' : 'text-green-700'}`}>
          <Lightbulb className="w-4 h-4" />
          {probability >= 80 ? (<><TriangleAlert className="w-4 h-4" />Chuẩn bị ngay</>) : probability >= 60 ? (<><Zap className="w-4 h-4" />Để ý</>) : probability >= 40 ? (<><Search className="w-4 h-4" />Theo dõi</>) : (<><ShieldCheck className="w-4 h-4" />An tâm</>)}
        </p>
        <p className="text-[11px] text-gray-700 leading-relaxed">
          {probability >= 80 ? 'Mưa sắp tới. Có thể mưa bất kỳ lúc nào trong hôm nay.'
          : probability >= 60 ? 'Có khả năng mưa vào chiều hoặc tối nay.'
          : probability >= 40 ? 'Thời tiết có thể thay đổi. Theo dõi cập nhật trong vài giờ tới.'
          : 'Thời tiết ổn định. Không lo về mưa hôm nay.'}
        </p>
      </div>

      <div className="mt-3 text-[11px] text-gray-500 bg-white/70 rounded-lg p-2.5 sm:p-3 border border-gray-200">
        <span className="inline-flex items-center gap-1.5"><CircleHelp className="w-3.5 h-3.5" /><strong>Lưu ý:</strong> Đây là dự báo sơ bộ. Để chính xác hơn, hãy kiểm tra thêm từ nguồn thời tiết chính thức.</span>
      </div>
    </div>
  );
}
