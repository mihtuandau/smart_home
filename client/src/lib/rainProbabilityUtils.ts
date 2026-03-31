
export interface RainAnalysis {
  probability: number;
  pressureFactor: number;
  humidityFactor: number;
  temperatureFactor: number;
  trendFactor: number;
  dewPointC: number;
  pressureHpa: number;
  conclusion: {
    title: string;
    description: string;
  };
}

type RainLanguage = 'vi' | 'en' | 'zh';

const normalizePressureHpa = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 1013.25;
  // Support both Pa (~100000) and hPa (~1000) payloads.
  return value > 2000 ? value / 100 : value;
};

export function estimatePressureTrend(
  entries: { pressure?: number | null; timestamp?: string | number | Date | null }[],
  maxPoints: number = 6,
): number | undefined {
  if (!entries || entries.length < 2) return undefined;

  const window = entries.slice(0, Math.min(maxPoints, entries.length));

  const dataPoints = window
    .map((entry, index) => {
      const pressure = entry.pressure != null ? normalizePressureHpa(entry.pressure) : null;
      const tsRaw = entry.timestamp;
      const timestamp = tsRaw instanceof Date
        ? tsRaw.getTime()
        : typeof tsRaw === 'number'
          ? tsRaw
          : tsRaw
            ? new Date(tsRaw).getTime()
            : null;

      return { index, pressure, timestamp };
    })
    .filter((p): p is { index: number; pressure: number; timestamp: number } => p.pressure != null && p.timestamp != null);

  if (dataPoints.length < 2) return undefined;

  const n = dataPoints.length;
  let sumT = 0, sumP = 0, sumT2 = 0, sumTP = 0;

  const newestTs = dataPoints[0].timestamp;
  const oldestTs = dataPoints[n - 1].timestamp;
  const deltaMs = newestTs - oldestTs;
  if (deltaMs <= 0) return undefined;

  const deltaHours = deltaMs / (1000 * 60 * 60);
  if (deltaHours <= 0) return undefined;

  // Normalize time to hours from the newest point for numerical stability
  dataPoints.forEach((point) => {
    const t = (newestTs - point.timestamp) / (1000 * 60 * 60);
    const p = point.pressure;
    sumT += t;
    sumP += p;
    sumT2 += t * t;
    sumTP += t * p;
  });

  const denom = n * sumT2 - sumT * sumT;
  if (Math.abs(denom) < 1e-6) return undefined;

  // slope is in hPa per hour (negative = falling, positive = rising)
  const slope = (n * sumTP - sumT * sumP) / denom;

  // Convert to hPa per 3 hours for consistency with downstream code
  return slope * 3;
}

function getLocalizedConclusion(
  probability: number,
  isRaining: boolean,
  language: RainLanguage
): { title: string; description: string } {
  if (isRaining) {
    if (language === 'en') {
      return {
        title: '️ It is raining now',
        description: 'The sensor has detected rain at the moment.',
      };
    }
    if (language === 'zh') {
      return {
        title: '️ 当前正在下雨',
        description: '传感器已检测到当前正在降雨。',
      };
    }
    return {
      title: '️ Đang có mưa',
      description: 'Cảm biến đã phát hiện mưa hiện tại.',
    };
  }

  if (probability >= 80) {
    if (language === 'en') {
      return {
        title: '️ High probability',
        description: 'Rain is likely in 1-2 hours. Prepare cover or find shelter.',
      };
    }
    if (language === 'zh') {
      return {
        title: '️ 高概率',
        description: '预计 1-2 小时内可能下雨。请提前准备遮挡或避雨。',
      };
    }
    return {
      title: '️ Xác suất cao',
      description: 'Mưa sắp tới trong 1-2 giờ. Chuẩn bị che chắn hoặc tìm nơi tránh.',
    };
  }

  if (probability >= 60) {
    if (language === 'en') {
      return {
        title: ' Medium probability',
        description: 'Rain may occur in 2-4 hours. Watch for weather changes.',
      };
    }
    if (language === 'zh') {
      return {
        title: ' 中等概率',
        description: '未来 2-4 小时可能下雨。请留意天气变化迹象。',
      };
    }
    return {
      title: ' Xác suất trung',
      description: 'Có khả năng mưa trong 2-4 giờ. Để ý dấu hiệu thay đổi thời tiết.',
    };
  }

  if (probability >= 40) {
    if (language === 'en') {
      return {
        title: '️ Low-medium probability',
        description: 'There may be rain in the late afternoon or evening. Keep monitoring updates.',
      };
    }
    if (language === 'zh') {
      return {
        title: '️ 低至中等概率',
        description: '下午或傍晚可能有雨，请持续关注天气更新。',
      };
    }
    return {
      title: '️ Xác suất thấp-trung',
      description: 'Có thể có mưa vào chiều tối. Theo dõi cập nhật thời tiết.',
    };
  }

  if (language === 'en') {
    return {
      title: '️ Low probability',
      description: 'Weather is stable, rain is unlikely today.',
    };
  }
  if (language === 'zh') {
    return {
      title: '️ 低概率',
      description: '天气稳定，今天降雨可能性较低。',
    };
  }
  return {
    title: '️ Xác suất thấp',
    description: 'Thời tiết ổn định, ít khả năng mưa hôm nay.',
  };
}

export function calculateRainProbability(
  temperature: number,
  humidity: number,
  pressureInput: number,
  isRaining: boolean,
  pressureTrendHpaPer3h?: number,
  language: RainLanguage = 'vi'
): RainAnalysis {
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const pressure = normalizePressureHpa(pressureInput);
  const safeHumidity = clamp(humidity, 0, 100);

  const dewPoint = (() => {
    const a = 17.62;
    const b = 243.12;
    const rh = clamp(safeHumidity, 1, 100) / 100;
    const gamma = Math.log(rh) + (a * temperature) / (b + temperature);
    return (b * gamma) / (a - gamma);
  })();

  const dewSpread = temperature - dewPoint;

  if (isRaining) {
    return {
      probability: 100,
      pressureFactor: 100,
      humidityFactor: 100,
      temperatureFactor: 100,
      trendFactor: 100,
      dewPointC: Math.round(dewPoint * 10) / 10,
      pressureHpa: Math.round(pressure * 10) / 10,
      conclusion: getLocalizedConclusion(100, true, language),
    };
  }

  // Use a monotonic humidity response: rain chance rises as RH increases,
  // while moderate humidity still contributes a meaningful signal.
  // RH baseline threshold lowered from 35% to 30% for better 40-70% range contribution.
  // Exponent reduced from 1.15 to 1.0 (linear) for more consistent response.
  // Result: RH=50% → ~28%, RH=60% → ~43%, RH=70% → ~57% (instead of 18%, 34%, 47%)
  const humidityNormalized = clamp((safeHumidity - 30) / 70, 0, 1);
  const humidityFactor = clamp(Math.pow(humidityNormalized, 1.0) * 100, 0, 100);

  const pressureBase = clamp(((1018 - pressure) / 18) * 100, 0, 100);
  const pressureBonus = pressure < 1005 ? clamp((1005 - pressure) * 3, 0, 20) : 0;
  const pressureFactor = clamp(pressureBase + pressureBonus, 0, 100);

  const dewPointFactor = clamp(((4 - dewSpread) / 6) * 100, 0, 100);

  const tempIdealCenter = 22;
  const tempIdealHalfRange = 11;
  const temperatureFactor = clamp(
    (1 - Math.abs(temperature - tempIdealCenter) / tempIdealHalfRange) * 100,
    0,
    100,
  );

  const trendFactor = pressureTrendHpaPer3h == null
    ? 50
    : pressureTrendHpaPer3h < 0
      ? clamp((-pressureTrendHpaPer3h / 6) * 100, 0, 100)
      : clamp(50 - (pressureTrendHpaPer3h / 8) * 50, 0, 50);

  // WEIGHT ADJUSTMENTS (March 31, 2026):
  // Reduced humidity from 0.32 → 0.20 (avoid double-counting with dew point)
  // Increased trend from 0.08 → 0.20 (supports smoothing via linear regression)
  // Rationale: humidity already factored into dew point via Magnus formula;
  // improved trend calculation deserves higher weight
  const probability = Math.min(
    100,
    Math.max(
      0,
      pressureFactor * 0.28 +
        humidityFactor * 0.20 +      // was 0.32
        dewPointFactor * 0.22 +
        temperatureFactor * 0.10 +
        trendFactor * 0.20            // was 0.08
    )
  );

  const roundedProbability = Math.round(probability);
  const conclusion = getLocalizedConclusion(roundedProbability, false, language);

  return {
    probability: roundedProbability,
    pressureFactor: Math.round(pressureFactor),
    humidityFactor: Math.round(humidityFactor),
    temperatureFactor: Math.round(temperatureFactor),
    trendFactor: Math.round(trendFactor),
    dewPointC: Math.round(dewPoint * 10) / 10,
    pressureHpa: Math.round(pressure * 10) / 10,
    conclusion,
  };
}

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
