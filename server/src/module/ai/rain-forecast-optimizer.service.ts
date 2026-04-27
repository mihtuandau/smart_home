import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SensorPayload } from '../mqtt/mqtt.service';

/**
 * Dữ liệu dự báo từ OpenWeather API
 */
export interface ForecastHourly {
  dt: number;
  temp: number;
  humidity: number;
  pressure: number;
  pop: number; // Probability of precipitation
  clouds: number;
  wind_speed: number;
  wind_deg?: number;
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
 * Dữ liệu ghép giữa forecast và sensor
 */
export interface AlignedForecastData {
  forecast: ForecastHourly;
  actual: NormalizedSensorRecord;
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
}

/**
 * Cache forecast API
 */
interface ForecastCache {
  timestamp: number;
  forecast: {
    hourly: ForecastHourly[];
  };
}

@Injectable()
export class RainForecastOptimizerService {
  private readonly logger = new Logger(RainForecastOptimizerService.name);
  private readonly API_URL = 'https://api.openweathermap.org/data/3.0/onecall';
  private readonly DEFAULT_LAT = 10.9509538;
  private readonly DEFAULT_LON = 106.8226134;
  private readonly DEFAULT_UNITS = 'metric';
  private readonly DEFAULT_LANG = 'vi';
  private readonly CACHE_TTL_SECONDS = 2 * 60; // 2 minutes (720 calls/day)
  private readonly MQTT_CACHE_TTL_SECONDS = 30; // 30 seconds (match refetch interval for real-time sensor data)
  private readonly API_KEY: string;
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private readonly mqttCacheFile: string;

  // Sensorhistory buffer
  private sensorHistory: NormalizedSensorRecord[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  // Request deduplication - prevent multiple simultaneous API calls
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.API_KEY =
      process.env.OPENWEATHER_API_KEY ||
      '8422bfa505cc5e2a183da771f3571304';
    this.cacheDir = process.env.CACHE_DIR || './cache';
    this.cacheFile = path.join(this.cacheDir, 'forecast_cache.json');
    this.mqttCacheFile = path.join(this.cacheDir, 'mqtt_sensor_cache.json');
    this.ensureCacheDir();
  }

  /**
   * Đảm bảo thư mục cache tồn tại
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      this.logger.warn(`Failed to create cache directory: ${error}`);
    }
  }

  /**
   * Giới hạn giá trị trong khoảng [min_value, max_value]
   */
  private clamp(
    value: number,
    min_value: number = 0.0,
    max_value: number = 1.0,
  ): number {
    return Math.max(min_value, Math.min(max_value, value));
  }

  /**
   * Chuyển đổi Unix timestamp thành ISO 8601
   */
  private timestampToIso(dt: number): string {
    return new Date(dt * 1000).toISOString();
  }

  /**
   * Xây dựng URL cho OpenWeather API
   */
  private buildApiUrl(
    lat: number,
    lon: number,
  ): string {
    const query = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      units: this.DEFAULT_UNITS,
      lang: this.DEFAULT_LANG,
      appid: this.API_KEY,
    });
    return `${this.API_URL}?${query}`;
  }

  /**
   * Lấy dữ liệu forecast từ OpenWeather API (with request deduplication)
   */
  private async fetchOpenWeatherData(
    lat: number,
    lon: number,
  ): Promise<{ hourly: ForecastHourly[] }> {
    // Request deduplication key
    const key = `${lat},${lon}`;
    
    // If there's already a pending request, return it instead of making a new one
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = this.performFetch(lat, lon);
    this.pendingRequests.set(key, promise);
    
    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Thực hiện fetch dữ liệu từ OpenWeather API
   */
  private async performFetch(
    lat: number,
    lon: number,
  ): Promise<{ hourly: ForecastHourly[] }> {
    const url = this.buildApiUrl(lat, lon);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          hourly: data.hourly || [],
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      this.logger.error(`OpenWeather API error: ${error}`);
      throw new Error(
        `Failed to fetch OpenWeather data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async loadCachedForecast(): Promise<{
    hourly: ForecastHourly[];
  } | null> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const stored = JSON.parse(data) as ForecastCache;
      const age = Math.floor(Date.now() / 1000) - stored.timestamp;
      if (age < this.CACHE_TTL_SECONDS) {
        this.logger.debug(`Using cached forecast (age: ${age}s)`);
        return stored.forecast;
      }
    } catch (error) {
      // Cache doesn't exist or is invalid
    }
    return null;
  }

  /**
   * Lưu forecast vào cache
   */
  private async saveForecastCache(
    forecast: { hourly: ForecastHourly[] },
  ): Promise<void> {
    try {
      const cache: ForecastCache = {
        timestamp: Math.floor(Date.now() / 1000),
        forecast,
      };
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify(cache, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.warn(`Failed to save forecast cache: ${error}`);
    }
  }

  /**
   * Lưu cache dữ liệu MQTT sensor
   */
  private async saveMqttCache(
    sensorData: NormalizedSensorRecord,
  ): Promise<void> {
    try {
      const cache = {
        timestamp: Math.floor(Date.now() / 1000),
        sensor_data: sensorData,
      };
      await fs.writeFile(
        this.mqttCacheFile,
        JSON.stringify(cache, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.warn(`Failed to save MQTT cache: ${error}`);
    }
  }

  /**
   * Tải cache dữ liệu MQTT sensor nếu còn hợp lệ
   */
  private async loadMqttCache(): Promise<NormalizedSensorRecord | null> {
    try {
      const data = await fs.readFile(this.mqttCacheFile, 'utf-8');
      const stored = JSON.parse(data);
      const age = Math.floor(Date.now() / 1000) - stored.timestamp;
      if (age < this.MQTT_CACHE_TTL_SECONDS) {
        this.logger.debug(
          `Using cached MQTT sensor data (age: ${age}s)`,
        );
        return stored.sensor_data;
      }
    } catch (error) {
      // Cache doesn't exist
    }
    return null;
  }

  /**
   * Chuẩn hóa dữ liệu cảm biến dari SensorPayload
   */
  private normalizeSensorRecord(
    data: SensorPayload,
    dt?: number,
  ): NormalizedSensorRecord {
    const normalized: NormalizedSensorRecord = {
      dt: dt || Math.floor(Date.now() / 1000),
      temp: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
    };

    // Thêm dữ liệu mưa nếu có
    if (data.rain !== undefined) {
      normalized.rain_mm = data.rain ? 0.1 : 0.0;
    }

    return normalized;
  }

  /**
   * Thêm bản ghi cảm biến vào history và cache
   */
  async addSensorReading(data: SensorPayload): Promise<void> {
    const normalized = this.normalizeSensorRecord(data);
    this.sensorHistory.push(normalized);

    // Giới hạn kích thước history
    if (this.sensorHistory.length > this.MAX_HISTORY_SIZE) {
      this.sensorHistory.shift();
    }

    // Lưu vào cache MQTT
    await this.saveMqttCache(normalized);
  }

  /**
   * Tìm bản ghi cảm biến gần nhất với timestamp forecast
   */
  private matchSensorRecord(
    dt: number,
    sensorRecords: NormalizedSensorRecord[],
    maxSeconds: number = 1800, // 30 minutes
  ): NormalizedSensorRecord | null {
    let closest: NormalizedSensorRecord | null = null;
    let bestDelta = maxSeconds + 1;

    for (const record of sensorRecords) {
      const delta = Math.abs(record.dt - dt);
      if (delta < bestDelta) {
        bestDelta = delta;
        closest = record;
      }
    }

    return bestDelta <= maxSeconds ? closest : null;
  }

  /**
   * Ghép dữ liệu forecast và sensor theo cùng giờ
   */
  private alignForecastWithSensors(
    hourlyForecast: ForecastHourly[],
    sensorRecords: NormalizedSensorRecord[],
  ): AlignedForecastData[] {
    const aligned: AlignedForecastData[] = [];
    for (const forecast of hourlyForecast) {
      const actual = this.matchSensorRecord(forecast.dt, sensorRecords);
      if (actual) {
        aligned.push({ forecast, actual });
      }
    }
    return aligned;
  }

  /**
   * Tính xác suất mưa hiệu chỉnh dựa trên bias cảm biến
   *
   * Công thức:
   * - Humidity: 60% coefficient
   * - Pressure: 28% coefficient
   * - Temperature: 12% coefficient
   * - Rain flag: +20% adjustment if actual rain detected
   */
  private computeAdjustedPop(
    forecast: ForecastHourly,
    actual: NormalizedSensorRecord,
  ): number {
    // 1. RULE #1: If physical rain sensor is wet, it IS raining (100% probability)
    if (actual.rain_mm !== undefined && actual.rain_mm >= 0.1) {
      return 1.0;
    }

    // 2. Scientific Logic based on Atmospheric Physics
    // Credits: Based on simplified Zambretti Algorithm and psychrometric principles
    
    const basePop = forecast.pop || 0.0;
    const humidity = actual.humidity;
    const pressure = actual.pressure;
    const temp = actual.temp;

    // A. Humidity Factor: Rain requires high relative humidity
    // Threshold usually starts at 70%, critical at 90%
    let humidityScore = 0;
    if (humidity > 90) humidityScore = 0.4;
    else if (humidity > 80) humidityScore = 0.2;
    else if (humidity < 60) humidityScore = -0.2;

    // B. Pressure Factor: Low pressure systems bring rain
    // Standard atmosphere is 1013.25 hPa
    let pressureScore = 0;
    if (pressure < 1000) pressureScore = 0.3; // Low pressure
    else if (pressure < 1008) pressureScore = 0.15;
    else if (pressure > 1020) pressureScore = -0.2; // High pressure (Sunny)

    // C. Pressure Trend (if we had history, but we can compare with forecast)
    // If local pressure is lower than forecast pressure, it indicates a falling trend/local low
    const pressureDelta = forecast.pressure - actual.pressure;
    let trendScore = 0;
    if (pressureDelta > 2) trendScore = 0.15; // Falling fast
    else if (pressureDelta < -2) trendScore = -0.15; // Rising fast

    // D. Temperature/Dew Point Gap (Simplified)
    // Small gap between temp and dew point increases rain chance.
    // High humidity already covers this mostly.

    // E. OpenWeather External Factors (Wind, Clouds)
    const cloudsScore = (forecast.clouds || 0) / 100 * 0.1;
    const windScore = (forecast.wind_speed || 0) > 8 ? 0.05 : 0;

    let finalPop = basePop + humidityScore + pressureScore + trendScore + cloudsScore + windScore;

    // High humidity + Falling pressure is a very strong indicator
    if (humidity > 85 && pressureDelta > 1) {
      finalPop = Math.max(finalPop, 0.75);
    }

    // Cap values
    return this.clamp(finalPop, 0.0, 0.95); // 0.95 to keep some uncertainty unless physical sensor says so
  }

  /**
   * Tính tổng hợp bias giữa forecast và sensor
   */
  private summarizeBias(
    aligned: AlignedForecastData[],
  ): BiasSummary {
    const humidityDeltas: number[] = [];
    const pressureDeltas: number[] = [];
    const tempDeltas: number[] = [];
    const popDeltas: number[] = [];

    for (const item of aligned) {
      const f = item.forecast;
      const a = item.actual;

      humidityDeltas.push(a.humidity - f.humidity);
      pressureDeltas.push(f.pressure - a.pressure);
      tempDeltas.push(a.temp - f.temp);

      if (a.rain_mm !== undefined) {
        const actualRain = a.rain_mm >= 0.1 ? 1.0 : 0.0;
        popDeltas.push(actualRain - f.pop);
      }
    }

    const mean = (values: number[]) =>
      values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;

    return {
      mean_humidity_delta: mean(humidityDeltas),
      mean_pressure_delta: mean(pressureDeltas),
      mean_temp_delta: mean(tempDeltas),
      mean_pop_error: popDeltas.length > 0 ? mean(popDeltas) : null,
      aligned_points: aligned.length,
    };
  }

  /**
   * Chạy một lần tối ưu hóa forecast
   */
  async runOnce(
    lat: number = this.DEFAULT_LAT,
    lon: number = this.DEFAULT_LON,
    forceRefresh: boolean = false,
  ): Promise<RainForecastReport> {
    // Tải forecast từ cache hoặc API
    let forecast = !forceRefresh ? await this.loadCachedForecast() : null;
    if (!forecast) {
      forecast = await this.fetchOpenWeatherData(lat, lon);
      await this.saveForecastCache(forecast);
    }

    // Lấy 48 giờ dự báo đầu tiên
    const hourly = forecast.hourly.slice(0, 48);

    // Lấy dữ liệu cảm biến từ history hoặc cache
    let sensorRecords = this.sensorHistory;
    if (sensorRecords.length === 0) {
      const cached = await this.loadMqttCache();
      if (cached) {
        sensorRecords = [cached];
      }
    }

    // Ghép dữ liệu forecast và sensor
    const aligned = this.alignForecastWithSensors(hourly, sensorRecords);

    // Tính xác suất mưa hiệu chỉnh cho từng giờ
    const adjusted: AdjustedForecastItem[] = [];
    
    // Get latest sensor data (real-time) for hour 0 if available
    const latestSensorData = sensorRecords.length > 0 
      ? sensorRecords[sensorRecords.length - 1] 
      : null;

    for (let idx = 0; idx < hourly.length; idx++) {
      const forecastItem = hourly[idx];
      
      // For hour 0 (next hour), use real-time sensor data if available
      // For other hours, use aligned sensor data if matched
      let actualItem: NormalizedSensorRecord | null = null;
      if (idx === 0 && latestSensorData) {
        actualItem = latestSensorData;
      } else {
        const alignedItem = aligned.find(a => a.forecast.dt === forecastItem.dt);
        if (alignedItem) {
          actualItem = alignedItem.actual;
        }
      }

      if (actualItem) {
        adjusted.push({
          dt: forecastItem.dt,
          time_utc: this.timestampToIso(forecastItem.dt),
          forecast_pop: forecastItem.pop || 0.0,
          forecast_temp: forecastItem.temp,
          forecast_humidity: forecastItem.humidity,
          forecast_pressure: forecastItem.pressure,
          forecast_clouds: forecastItem.clouds,
          forecast_wind_speed: forecastItem.wind_speed,
          sensor_temp: actualItem.temp,
          sensor_humidity: actualItem.humidity,
          sensor_pressure: actualItem.pressure,
          sensor_rain_mm: actualItem.rain_mm,
          adjusted_pop: this.computeAdjustedPop(forecastItem, actualItem),
        });
      }
    }

    // Tạo báo cáo kết quả
    const report: RainForecastReport = {
      generated_at: this.timestampToIso(Math.floor(Date.now() / 1000)),
      location: { lat, lon },
      forecast_span_hours: hourly.length,
      aligned_records: adjusted.length,
      bias_summary: this.summarizeBias(aligned),
      adjusted_hourly: adjusted,
    };

    return report;
  }

  /**
   * Lấy dự báo mưa hiệu chỉnh hiện tại
   */
  async getCurrentForecast(
    lat: number = this.DEFAULT_LAT,
    lon: number = this.DEFAULT_LON,
    forceRefresh: boolean = false,
  ): Promise<RainForecastReport> {
    try {
      return await this.runOnce(lat, lon, forceRefresh);
    } catch (error) {
      this.logger.error(`Failed to get current forecast: ${error}`);
      throw error;
    }
  }

  /**
   * Lấy adjusted_pop cho bản ghi gần nhất
   */
  async getLatestAdjustedPop(
    lat: number = this.DEFAULT_LAT,
    lon: number = this.DEFAULT_LON,
    forceRefresh: boolean = false,
  ): Promise<number | null> {
    try {
      const report = await this.runOnce(lat, lon, forceRefresh);
      if (report.adjusted_hourly.length > 0) {
        return report.adjusted_hourly[0].adjusted_pop;
      }
    } catch (error) {
      this.logger.warn(`Failed to get latest adjusted pop: ${error}`);
    }
    return null;
  }

  /**
   * Lấy sensor history
   */
  getSensorHistory(): NormalizedSensorRecord[] {
    return [...this.sensorHistory];
  }

  /**
   * Xóa sensor history
   */
  clearSensorHistory(): void {
    this.sensorHistory = [];
  }

  /**
   * Xóa cache files để buộc refetch từ API
   */
  async clearCache(): Promise<void> {
    try {
      await fs.unlink(this.cacheFile).catch(() => {
        // File doesn't exist, that's OK
      });
      await fs.unlink(this.mqttCacheFile).catch(() => {
        // File doesn't exist, that's OK
      });
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error}`);
      throw error;
    }
  }
}
