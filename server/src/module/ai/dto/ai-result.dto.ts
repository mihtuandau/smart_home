import type { LedDayEntry } from '../ai-led-stats.service';
export type { LedDayEntry };

/** Shape of the AI analysis result emitted after each MQTT message. */
export interface AiResultDto {
  /** ISO timestamp of the analysis */
  time: string;
  /** Realtime status string, e.g. "✅ AI: Mức tiêu thụ điện ổn định" */
  analysis: string;
  /** Non-null when an anomaly is detected */
  anomaly: string | null;
  /** Daily average power summary */
  summary: string;
  /** Energy-saving advice list */
  advice: string[];
  /** Monthly billing forecast (included periodically) */
  billing: BillingForecastDto | null;
  /** LED daily consumption stats (today) */
  dailyLed: LedDayEntry;
}

export interface BillingForecastDto {
  month: string;           // "YYYY-MM"
  kwhSoFar: number;
  projectedKwh: number;
  projectedCostVnd: number;
  ciLow: number;
  ciHigh: number;
  priceVndPerKwh: number;
}

/** Per-(weekday, hour) slot for the baseline profile. */
export interface BaselineSlot {
  count: number;
  sum: number;
  mean: number | null;
}

/**
 * LED state key for baseline profile.
 * none   = cả hai đèn tắt
 * led1   = chỉ đèn 1 bật
 * led2   = chỉ đèn 2 bật
 * both   = cả hai đèn bật
 */
export type LedState = 'none' | 'led1' | 'led2' | 'both';

/**
 * Full baseline profile: weekday × hour × ledState → stats.
 * Mỗi tổ hợp trạng thái đèn được học riêng để so sánh đúng.
 */
export type BaselineProfile = {
  [weekday: string]: {
    [hour: string]: {
      [key in LedState]?: BaselineSlot;
    };
  };
};
