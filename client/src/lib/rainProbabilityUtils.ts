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

type RainLanguage = 'vi' | 'en' | 'zh';

function getLocalizedConclusion(
  probability: number,
  isRaining: boolean,
  language: RainLanguage
): { title: string; description: string } {
  if (isRaining) {
    if (language === 'en') {
      return {
        title: '🌧️ It is raining now',
        description: 'The sensor has detected rain at the moment.',
      };
    }
    if (language === 'zh') {
      return {
        title: '🌧️ 当前正在下雨',
        description: '传感器已检测到当前正在降雨。',
      };
    }
    return {
      title: '🌧️ Đang có mưa',
      description: 'Cảm biến đã phát hiện mưa hiện tại.',
    };
  }

  if (probability >= 80) {
    if (language === 'en') {
      return {
        title: '⚠️ High probability',
        description: 'Rain is likely in 1-2 hours. Prepare cover or find shelter.',
      };
    }
    if (language === 'zh') {
      return {
        title: '⚠️ 高概率',
        description: '预计 1-2 小时内可能下雨。请提前准备遮挡或避雨。',
      };
    }
    return {
      title: '⚠️ Xác suất cao',
      description: 'Mưa sắp tới trong 1-2 giờ. Chuẩn bị che chắn hoặc tìm nơi tránh.',
    };
  }

  if (probability >= 60) {
    if (language === 'en') {
      return {
        title: '⚡ Medium probability',
        description: 'Rain may occur in 2-4 hours. Watch for weather changes.',
      };
    }
    if (language === 'zh') {
      return {
        title: '⚡ 中等概率',
        description: '未来 2-4 小时可能下雨。请留意天气变化迹象。',
      };
    }
    return {
      title: '⚡ Xác suất trung',
      description: 'Có khả năng mưa trong 2-4 giờ. Để ý dấu hiệu thay đổi thời tiết.',
    };
  }

  if (probability >= 40) {
    if (language === 'en') {
      return {
        title: '☁️ Low-medium probability',
        description: 'There may be rain in the late afternoon or evening. Keep monitoring updates.',
      };
    }
    if (language === 'zh') {
      return {
        title: '☁️ 低至中等概率',
        description: '下午或傍晚可能有雨，请持续关注天气更新。',
      };
    }
    return {
      title: '☁️ Xác suất thấp-trung',
      description: 'Có thể có mưa vào chiều tối. Theo dõi cập nhật thời tiết.',
    };
  }

  if (language === 'en') {
    return {
      title: '☀️ Low probability',
      description: 'Weather is stable, rain is unlikely today.',
    };
  }
  if (language === 'zh') {
    return {
      title: '☀️ 低概率',
      description: '天气稳定，今天降雨可能性较低。',
    };
  }
  return {
    title: '☀️ Xác suất thấp',
    description: 'Thời tiết ổn định, ít khả năng mưa hôm nay.',
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
  isRaining: boolean,
  language: RainLanguage = 'vi'
): RainAnalysis {
  // Chuyển từ Pa sang hPa
  const pressure = pressurePa / 100;

  if (isRaining) {
    return {
      probability: 100,
      pressureFactor: 100,
      humidityFactor: 100,
      temperatureFactor: 100,
      conclusion: getLocalizedConclusion(100, true, language),
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

  const roundedProbability = Math.round(probability);
  const conclusion = getLocalizedConclusion(roundedProbability, false, language);

  return {
    probability: roundedProbability,
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
    return { bg: 'bg-red-50 dark:bg-red-950/30', border: '#dc2626', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-600 text-white' };
  }
  if (probability >= 60) {
    return { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: '#f59e0b', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' };
  }
  if (probability >= 40) {
    return { bg: 'bg-blue-50 dark:bg-blue-950/30', border: '#3b82f6', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
  }
  return { bg: 'bg-green-50 dark:bg-green-950/30', border: '#10b981', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' };
}
