import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaService) {}

  async getLatest(limit: number = 1) {
    return this.prisma.sensorData.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getHistory(
    hours: number = 24,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const where = { timestamp: { gte: since } };

    const [data, total] = await Promise.all([
      this.prisma.sensorData.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sensorData.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await this.prisma.sensorData.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (data.length === 0) {
      return {
        temperature: { avg: 0, min: 0, max: 0 },
        humidity: { avg: 0, min: 0, max: 0 },
        pressure: { avg: 0, min: 0, max: 0 },
        lightLevel: { avg: 0, min: 0, max: 0 },
        count: 0,
        period: `${hours}h`,
      };
    }

    const temps = data.map((d) => d.temperature);
    const humidities = data.map((d) => d.humidity);
    const pressures = data.map((d) => d.pressure);
    const lightLevels = data.map((d) => d.lightLevel);

    return {
      temperature: {
        avg: this.average(temps),
        min: Math.min(...temps),
        max: Math.max(...temps),
      },
      humidity: {
        avg: this.average(humidities),
        min: Math.min(...humidities),
        max: Math.max(...humidities),
      },
      pressure: {
        avg: this.average(pressures),
        min: Math.min(...pressures),
        max: Math.max(...pressures),
      },
      lightLevel: {
        avg: this.average(lightLevels),
        min: Math.min(...lightLevels),
        max: Math.max(...lightLevels),
      },
      count: data.length,
      period: `${hours}h`,
    };
  }

  async getChartData(
    type: 'temperature' | 'humidity' | 'pressure' | 'light',
    hours: number = 24,
  ) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await this.prisma.sensorData.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const fieldMap = {
      temperature: 'temperature',
      humidity: 'humidity',
      pressure: 'pressure',
      light: 'lightLevel',
    };

    return data.map((d) => ({
      timestamp: d.timestamp,
      value: d[fieldMap[type]],
    }));
  }

  async getCurrentConditions() {
    const latest = await this.prisma.sensorData.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) {
      return null;
    }

    return {
      temperature: latest.temperature,
      humidity: latest.humidity,
      pressure: latest.pressure,
      lightLevel: latest.lightLevel,
      isDark: latest.isDark,
      isRaining: latest.isRaining,
      timestamp: latest.timestamp,
      comfort: this.calculateComfortIndex(latest.temperature, latest.humidity),
    };
  }

  private average(values: number[]): number {
    return (
      Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
      100
    );
  }

  private calculateComfortIndex(temp: number, humidity: number): string {
    const heatIndex = temp + 0.5555 * (0.06 * humidity * (temp - 14.5));

    if (heatIndex < 21) return 'cool';
    if (heatIndex < 24) return 'comfortable';
    if (heatIndex < 27) return 'warm';
    return 'hot';
  }
}
