import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const RAW_RETENTION_DAYS = Number(process.env.RAW_RETENTION_DAYS || 7);
const RAW_RETENTION_HOURS = RAW_RETENTION_DAYS * 24;
type HistoryMode = 'auto' | 'raw' | 'avg';
type StatsMode = 'auto' | 'raw' | 'avg';

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
    mode: HistoryMode = 'auto',
  ) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const shouldUseAverage = mode === 'avg' || (mode === 'auto' && hours > RAW_RETENTION_HOURS);

    if (shouldUseAverage) {
      const where = { bucketStart: { gte: since } };
      const [aggData, total] = await Promise.all([
        this.prisma.sensorAgg.findMany({
          where,
          orderBy: { bucketStart: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.sensorAgg.count({ where }),
      ]);

      const data = aggData.map((row) => ({
        timestamp: row.bucketStart,
        temperature: row.temperatureAvg,
        humidity: row.humidityAvg,
        pressure: row.pressureAvg,
        isRaining: row.rainCount > 0,
        samples: row.samples,
      }));

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

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

  async getStats(hours: number = 24, mode: StatsMode = 'auto') {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const shouldUseAverage =
      mode === 'avg' || (mode === 'auto' && hours > RAW_RETENTION_HOURS);

    if (shouldUseAverage) {
      const aggData = await this.prisma.sensorAgg.findMany({
        where: {
          bucketStart: {
            gte: since,
          },
        },
        orderBy: { bucketStart: 'asc' },
      });

      if (aggData.length === 0) {
        return {
          temperature: { avg: 0, min: 0, max: 0 },
          humidity: { avg: 0, min: 0, max: 0 },
          pressure: { avg: 0, min: 0, max: 0 },
          count: 0,
          period: `${hours}h`,
        };
      }

      const temperatureAvg = this.weightedAverage(
        aggData.map((d) => ({ value: d.temperatureAvg, weight: d.samples })),
      );
      const humidityAvg = this.weightedAverage(
        aggData.map((d) => ({ value: d.humidityAvg, weight: d.samples })),
      );
      const pressureAvg = this.weightedAverage(
        aggData.map((d) => ({ value: d.pressureAvg, weight: d.samples })),
      );
      const totalSamples = aggData.reduce((sum, row) => sum + row.samples, 0);

      return {
        temperature: {
          avg: temperatureAvg,
          min: Math.min(...aggData.map((d) => d.temperatureMin)),
          max: Math.max(...aggData.map((d) => d.temperatureMax)),
        },
        humidity: {
          avg: humidityAvg,
          min: Math.min(...aggData.map((d) => d.humidityMin)),
          max: Math.max(...aggData.map((d) => d.humidityMax)),
        },
        pressure: {
          avg: pressureAvg,
          min: Math.min(...aggData.map((d) => d.pressureMin)),
          max: Math.max(...aggData.map((d) => d.pressureMax)),
        },
        count: totalSamples,
        period: `${hours}h`,
      };
    }

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
        count: 0,
        period: `${hours}h`,
      };
    }

    const temps = data.map((d) => d.temperature);
    const humidities = data.map((d) => d.humidity);
    const pressures = data.map((d) => d.pressure);

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
      count: data.length,
      period: `${hours}h`,
    };
  }

  async getChartData(
    type: 'temperature' | 'humidity' | 'pressure',
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

  private weightedAverage(items: { value: number; weight: number }[]): number {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) {
      return 0;
    }

    const weightedSum = items.reduce(
      (sum, item) => sum + item.value * item.weight,
      0,
    );

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  private calculateComfortIndex(temp: number, humidity: number): string {
    const heatIndex = temp + 0.5555 * (0.06 * humidity * (temp - 14.5));

    if (heatIndex < 21) return 'cool';
    if (heatIndex < 24) return 'comfortable';
    if (heatIndex < 27) return 'warm';
    return 'hot';
  }
}
