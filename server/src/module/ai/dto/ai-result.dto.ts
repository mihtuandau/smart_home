import type { LedDayEntry } from '../ai-led-stats.service';
export type { LedDayEntry };

export interface AiResultDto {
  time: string;

  analysis: string;

  anomaly: string | null;

  summary: string;

  advice: string[];

  billing: BillingForecastDto | null;

  dailyLed: LedDayEntry;

  powerW: number;

  led1: boolean;

  led2: boolean;
  type: 'status' | 'alert';
}

export interface BillingForecastDto {
  month: string;
  kwhSoFar: number;
  projectedKwh: number;
  projectedCostVnd: number;
  ciLow: number;
  ciHigh: number;
  priceVndPerKwh: number;
  dataStartIso?: string | null;
  dataCoverageLabel?: string;
  estimatedFromMonthStart?: boolean;
  estimatedMissingDays?: number;
}

export interface BaselineSlot {
  count: number;
  sum: number;
  sumSq?: number;
  mean: number | null;
  stdDev?: number | null;
}

export type LedState = 'none' | 'led1' | 'led2' | 'both';

export type BaselineProfile = {
  [weekday: string]: {
    [hour: string]: {
      [key in LedState]?: BaselineSlot;
    };
  };
};
