'use client';

import { useSensors } from '@/hooks/sensors';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateRainProbability, estimatePressureTrend, getColorScheme } from '@/lib/rainProbabilityUtils';
import { ChartColumn, CircleHelp, Lightbulb, Search, ShieldCheck, Sparkles, TriangleAlert, Zap } from 'lucide-react';

interface FactorAnalysis {
  name: string;
  value: number;
  percentage: number;
  color: string;
  bgColor: string;
  interpretation: string;
}

interface PredictorSensorData {
  pressure?: number;
  humidity?: number;
  temperature?: number;
  isRaining?: boolean;
  timestamp?: string;
}

interface SensorListResponse {
  data?: PredictorSensorData[];
}

export default function RainProbabilityPredictor() {
  const { data: response, isLoading } = useSensors(12, 3000);
  const records = (response as SensorListResponse | undefined)?.data ?? [];
  const data = records[0] || null;
  const { t, language } = useLanguage();

  const toSafeNumber = (value: unknown, fallback = 0) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getFactorAnalysis = (): FactorAnalysis[] => {
    if (!data) return [];

    const pressure = toSafeNumber(data.pressure);
    const humidity = toSafeNumber(data.humidity);
    const temperature = toSafeNumber(data.temperature);
    const pressureTrend = estimatePressureTrend(records);
    const { pressureFactor, humidityFactor, temperatureFactor, pressureHpa } = calculateRainProbability(
      temperature,
      humidity,
      pressure,
      Boolean(data.isRaining),
      pressureTrend,
      language
    );

    let pressureColor = 'text-red-600';
    let pressureBgColor = '#dc2626';
    let pressureInterpretation = t('sensors.pressureVeryLow');
    if (pressureHpa < 1000) {
      pressureColor = 'text-red-600';
      pressureBgColor = '#dc2626';
      pressureInterpretation = t('sensors.pressureVeryLow');
    } else if (pressureHpa < 1013) {
      pressureColor = 'text-yellow-600';
      pressureBgColor = '#ca8a04';
      pressureInterpretation = t('sensors.pressureSlightLow');
    } else if (pressureHpa < 1030) {
      pressureColor = 'text-green-600';
      pressureBgColor = '#16a34a';
      pressureInterpretation = t('sensors.pressureNormal');
    } else {
      pressureColor = 'text-green-600';
      pressureBgColor = '#16a34a';
      pressureInterpretation = t('sensors.pressureHigh');
    }

    let humidityColor = 'text-red-600';
    let humidityBgColor = '#dc2626';
    let humidityInterpretation = t('sensors.humidityVeryDry');
    if (humidity < 30) {
      humidityColor = 'text-green-600';
      humidityBgColor = '#16a34a';
      humidityInterpretation = t('sensors.humidityVeryDry');
    } else if (humidity < 50) {
      humidityColor = 'text-green-600';
      humidityBgColor = '#16a34a';
      humidityInterpretation = t('sensors.humidityDry');
    } else if (humidity < 70) {
      humidityColor = 'text-blue-600';
      humidityBgColor = '#2563eb';
      humidityInterpretation = t('sensors.humidityModerate');
    } else if (humidity < 85) {
      humidityColor = 'text-yellow-600';
      humidityBgColor = '#ca8a04';
      humidityInterpretation = t('sensors.humidityHumid');
    } else {
      humidityColor = 'text-red-600';
      humidityBgColor = '#dc2626';
      humidityInterpretation = t('sensors.humidityVeryHumid');
    }

    let tempColor = 'text-green-600';
    let tempBgColor = '#16a34a';
    let tempInterpretation = t('sensors.temperatureNormal');
    if (temperature < 10) {
      tempColor = 'text-blue-600';
      tempBgColor = '#2563eb';
      tempInterpretation = t('sensors.temperatureCold');
    } else if (temperature < 20) {
      tempColor = 'text-green-600';
      tempBgColor = '#16a34a';
      tempInterpretation = t('sensors.temperatureCool');
    } else if (temperature < 28) {
      tempColor = 'text-green-600';
      tempBgColor = '#16a34a';
      tempInterpretation = t('sensors.temperatureWarm');
    } else {
      tempColor = 'text-red-600';
      tempBgColor = '#dc2626';
      tempInterpretation = t('sensors.temperatureHot');
    }

    return [
      {
        name: `${t('sensors.pressure')}: ${pressureHpa.toFixed(1)} hPa`,
        value: pressureHpa,
        percentage: pressureFactor,
        color: pressureColor,
        bgColor: pressureBgColor,
        interpretation: pressureInterpretation,
      },
      {
        name: `${t('sensors.humidity')}: ${humidity.toFixed(1)}%`,
        value: humidity,
        percentage: humidityFactor,
        color: humidityColor,
        bgColor: humidityBgColor,
        interpretation: humidityInterpretation,
      },
      {
        name: `${t('sensors.temperature')}: ${temperature.toFixed(1)}°C`,
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
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-muted rounded w-full mb-4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  const temperature = toSafeNumber(data.temperature);
  const humidity = toSafeNumber(data.humidity);
  const pressure = toSafeNumber(data.pressure);
  const pressureTrend = estimatePressureTrend(records);
  const analysis = calculateRainProbability(
    temperature,
    humidity,
    pressure,
    Boolean(data.isRaining),
    pressureTrend,
    language,
  );
  const probability = analysis.probability;
  const colorScheme = getColorScheme(probability);
  const factors = getFactorAnalysis();

  return (
    <div className={`rounded-xl p-4 sm:p-5 border border-border ${colorScheme.bg} shadow-sm`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-sm sm:text-base font-semibold ${colorScheme.text} inline-flex items-center gap-1.5`}><Sparkles className="w-4 h-4" />{t('sensors.rainProbabilityQuestion')}</h2>
        </div>
        <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-card/80 border border-border text-muted-foreground">{t('sensors.updatedRealtime')}</span>
      </div>

      <div className="mb-4 bg-card rounded-xl p-3 sm:p-4 border border-border">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <p className="text-xs text-muted-foreground">{t('sensors.rainProbability')}</p>
            <span className={`inline-block text-4xl sm:text-5xl leading-none font-extrabold tracking-tight ${colorScheme.text} drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]`}>
              {probability}%
            </span>
          </div>
          <span className={`min-w-[96px] text-center text-xs px-2.5 py-1 rounded-full font-semibold ${probability >= 80 ? 'bg-red-200 dark:bg-slate-800 text-red-700 dark:text-red-200' : probability >= 60 ? 'bg-yellow-200 dark:bg-slate-800 text-yellow-700 dark:text-yellow-200' : probability >= 40 ? 'bg-blue-200 dark:bg-slate-800 text-blue-700 dark:text-blue-200' : 'bg-green-200 dark:bg-slate-800 text-green-700 dark:text-green-200'}`}>
            {probability >= 80 ? t('sensors.highChance') : probability >= 60 ? t('sensors.mediumChance') : probability >= 40 ? t('sensors.monitoring') : t('sensors.lowChance')}
          </span>
        </div>

        <div className="bg-muted rounded-full h-3.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${probability}%`,
              backgroundColor: colorScheme.border,
            }}
          />
        </div>
      </div>

      <div className="bg-card/80 rounded-lg p-3 sm:p-4 border-l-4 mb-4" style={{ borderColor: colorScheme.border }}>
        <p className={`font-semibold text-sm mb-1 ${colorScheme.text}`}>{analysis.conclusion.title}</p>
        <p className="text-xs text-foreground/70 leading-relaxed">{analysis.conclusion.description}</p>
      </div>

      <div className="mb-5">
        <p className="font-semibold text-foreground text-xs inline-flex items-center gap-1.5 mb-2.5"><ChartColumn className="w-4 h-4" />{t('sensors.weatherConditions')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {factors.map((factor, idx) => (
            <div key={idx} className="bg-card/80 rounded-lg p-3 border border-border h-full flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-foreground/80 leading-snug">{factor.name}</span>
                <span
                  className={`shrink-0 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-md leading-none ${factor.color === 'text-red-600' ? 'bg-red-600 text-white' : factor.color === 'text-yellow-600' ? 'bg-yellow-600 text-white' : factor.color === 'text-blue-600' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}
                >
                  {factor.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-auto">
                <div className="bg-muted rounded-full h-1.5 overflow-hidden mb-1.5">
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

      <div className={`rounded-lg p-3 sm:p-4 mb-3 border-l-4 ${probability >= 80 ? 'bg-red-100 dark:bg-slate-800/50 border-l-red-600' : probability >= 60 ? 'bg-yellow-100 dark:bg-slate-800/50 border-l-yellow-600' : probability >= 40 ? 'bg-blue-100 dark:bg-slate-800/50 border-l-blue-600' : 'bg-green-100 dark:bg-slate-800/50 border-l-green-600'}`}>
        <p className={`text-xs font-semibold mb-1.5 inline-flex items-center gap-1.5 ${probability >= 80 ? 'text-red-700 dark:text-red-200' : probability >= 60 ? 'text-yellow-700 dark:text-yellow-200' : probability >= 40 ? 'text-blue-700 dark:text-blue-200' : 'text-green-700 dark:text-green-200'}`}>
          <Lightbulb className="w-4 h-4" />
          {probability >= 80 ? (<><TriangleAlert className="w-4 h-4" />{t('sensors.prepareNow')}</>) : probability >= 60 ? (<><Zap className="w-4 h-4" />{t('sensors.monitoring')}</>) : probability >= 40 ? (<><Search className="w-4 h-4" />{t('sensors.monitoring')}</>) : (<><ShieldCheck className="w-4 h-4" />{t('sensors.peaceOfMind')}</>)}
        </p>
        <p className="text-[11px] text-foreground/70 leading-relaxed">
          {probability >= 80 ? t('sensors.rainSoon')
          : probability >= 60 ? t('sensors.rainPossible')
          : probability >= 40 ? t('sensors.weatherMayChange')
          : t('sensors.weatherStable')}
        </p>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground bg-card/70 rounded-lg p-2.5 sm:p-3 border border-border">
        <span className="inline-flex items-center gap-1.5"><CircleHelp className="w-3.5 h-3.5" /><strong>{t('sensors.note')}:</strong> {t('sensors.noteDescription')}</span>
      </div>
    </div>
  );
}
