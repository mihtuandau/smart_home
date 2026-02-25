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

/** Full baseline profile structure (7 weekdays × 24 hours). */
export type BaselineProfile = {
  [weekday: string]: {
    [hour: string]: BaselineSlot;
  };
};
