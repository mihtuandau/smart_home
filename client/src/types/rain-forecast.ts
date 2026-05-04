/**
 * Dữ liệu dự báo từ OpenWeather API
 */
export interface ForecastHourly {
  dt: number;
  temp: number;
  humidity: number;
  pressure: number;
  pop: number; // Probability of precipitation (0-1)
  clouds: number;
  wind_speed: number;
  visibility: number;
}

/**
 * Dữ liệu cảm biến đã chuẩn hóa
 */
export interface NormalizedSensorRecord {
  dt: number;
  temp: number;
  humidity: number;
  pressure: number;
  rain_mm?: number;
}

/**
 * Bias summary giữa forecast và sensor
 */
export interface BiasSummary {
  mean_humidity_delta: number;
  mean_pressure_delta: number;
  mean_temp_delta: number;
  mean_pop_error: number | null;
  aligned_points: number;
}

/**
 * Dữ liệu forecast đã hiệu chỉnh
 */
export interface AdjustedForecastItem {
  dt: number;
  time_utc: string;
  forecast_pop: number;
  forecast_temp: number;
  forecast_humidity: number;
  forecast_pressure: number;
  forecast_clouds?: number;
  forecast_wind_speed?: number;
  sensor_temp?: number;
  sensor_humidity?: number;
  sensor_pressure?: number;
  sensor_rain_mm?: number;
  adjusted_pop: number;
}

/**
 * Báo cáo tổng hợp tối ưu hóa
 */
export interface RainForecastReport {
  generated_at: string;
  location: {
    lat: number;
    lon: number;
  };
  forecast_span_hours: number;
  aligned_records: number;
  bias_summary: BiasSummary;
  adjusted_hourly: AdjustedForecastItem[];
  prediction_source?: string;
}
