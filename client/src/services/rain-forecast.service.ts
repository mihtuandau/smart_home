import { API_CONFIG } from '@/config';
import type { RainForecastReport, AdjustedForecastItem } from '@/types';

class RainForecastService {
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use the configured API URL
      return API_CONFIG.BASE_URL || `${window.location.origin.replace(':3000', ':3100').replace(':5173', ':3100')}`;
    }
    // Server-side: fallback
    return 'http://localhost:3100';
  }

  /**
   * Lấy dự báo mưa tối ưu hóa 48 giờ
   */
  async getRainForecast(lat?: number, lon?: number, forceRefresh: boolean = false): Promise<RainForecastReport> {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lon !== undefined) params.append('lon', lon.toString());
    if (forceRefresh) params.append('refresh', 'true');

    const query = params.toString();
    const url = `${this.getBaseUrl()}/ai/rain-forecast${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rain forecast: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Lấy xác suất mưa hiệu chỉnh gần nhất
   */
  async getLatestRainProbability(
    lat?: number,
    lon?: number,
    forceRefresh: boolean = false,
  ): Promise<{ adjusted_probability: number | null; unit: string }> {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lon !== undefined) params.append('lon', lon.toString());
    if (forceRefresh) params.append('refresh', 'true');

    const query = params.toString();
    const url = `${this.getBaseUrl()}/ai/rain-forecast/latest-prob${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rain probability: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Lấy dự báo mưa cho giờ tiếp theo
   */
  async getNextHourForecast(lat?: number, lon?: number): Promise<AdjustedForecastItem | null> {
    try {
      const report = await this.getRainForecast(lat, lon);
      return report.adjusted_hourly.length > 0 ? report.adjusted_hourly[0] : null;
    } catch (error) {
      console.error('Error fetching next hour forecast:', error);
      return null;
    }
  }
}

export const rainForecastService = new RainForecastService();
