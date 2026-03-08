/**
 * Utility functions for rain probability prediction
 * Used by both Dashboard and Sensors page
 */

export interface RainAnalysis {
  probability: number;
  pressureFactor: number;
  humidityFactor: number;
  temperatureFactor: number;
  conclusion: {
    title: string;
    description: string;
  };
}

/**
 * Calculate rain probability using weighted formula
 * - Pressure: 50% weight
 * - Humidity: 35% weight
 * - Temperature: 15% weight
 */
export function calculateRainProbability(
  temperature: number,
  humidity: number,
  pressurePa: number,
  isRaining: boolean
): RainAnalysis {
  // Chuyển từ Pa sang hPa
  const pressure = pressurePa / 100;

  if (isRaining) {
    return {
      probability: 100,
      pressureFactor: 100,
      humidityFactor: 100,
      temperatureFactor: 100,
      conclusion: {
        title: '🌧️ Đang có mưa',
        description: 'Cảm biến đã phát hiện mưa hiện tại.',
      },
    };
  }

  // 1️⃣ Yếu tố áp suất (50% trọng số)
  let pressureFactor = 0;

  if (pressure < 1000) {
    pressureFactor = Math.min(100, 80 + (1000 - pressure) * 2);
  } else if (pressure < 1013) {
    const range = 1013 - 1000;
    const current = pressure - 1000;
    pressureFactor = 40 + (current / range) * 40;
  } else if (pressure < 1030) {
    const range = 1030 - 1013;
    const current = pressure - 1013;
    pressureFactor = Math.max(5, 40 - (current / range) * 35);
  } else {
    pressureFactor = 5;
  }

  // 2️⃣ Yếu tố độ ẩm (35% trọng số)
  let humidityFactor = 0;

  if (humidity < 30) {
    humidityFactor = 5;
  } else if (humidity < 50) {
    humidityFactor = 20;
  } else if (humidity < 70) {
    humidityFactor = 35;
  } else if (humidity < 85) {
    humidityFactor = 65;
  } else {
    humidityFactor = 90;
  }

  // 3️⃣ Yếu tố nhiệt độ (15% trọng số)
  let temperatureFactor = 25;

  if (temperature < 10) {
    temperatureFactor = 15;
  } else if (temperature < 20) {
    temperatureFactor = 20;
  } else if (temperature < 28) {
    temperatureFactor = 25;
  } else {
    temperatureFactor = 35;
  }

  // ⚖️ Tính trung bình có trọng số (0-100%)
  const probability = Math.min(
    100,
    Math.max(
      0,
      pressureFactor * 0.5 + humidityFactor * 0.35 + temperatureFactor * 0.15
    )
  );

  // Kết luận
  let conclusion = {
    title: '☀️ Xác suất thấp',
    description: 'Thời tiết ổn định, ít khả năng mưa hôm nay.',
  };

  if (probability >= 80) {
    conclusion = {
      title: '⚠️ Xác suất cao',
      description: 'Mưa sắp tới trong 1-2 giờ. Chuẩn bị che chắn hoặc tìm nơi tránh.',
    };
  } else if (probability >= 60) {
    conclusion = {
      title: '⚡ Xác suất trung',
      description: 'Có khả năng mưa trong 2-4 giờ. Để ý dấu hiệu thay đổi thời tiết.',
    };
  } else if (probability >= 40) {
    conclusion = {
      title: '☁️ Xác suất thấp-trung',
      description: 'Có thể có mưa vào chiều tối. Theo dõi cập nhật thời tiết.',
    };
  }

  return {
    probability: Math.round(probability),
    pressureFactor: Math.round(pressureFactor),
    humidityFactor: Math.round(humidityFactor),
    temperatureFactor: Math.round(temperatureFactor),
    conclusion,
  };
}

/**
 * Determine color scheme based on probability
 */
export function getColorScheme(probability: number) {
  if (probability >= 80) {
    return { bg: 'bg-red-50', border: '#dc2626', text: 'text-red-700', badge: 'bg-red-600 text-white' };
  }
  if (probability >= 60) {
    return { bg: 'bg-yellow-50', border: '#f59e0b', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
  }
  if (probability >= 40) {
    return { bg: 'bg-blue-50', border: '#3b82f6', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
  }
  return { bg: 'bg-green-50', border: '#10b981', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
}
