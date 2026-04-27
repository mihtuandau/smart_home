import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const RAW_RETENTION_DAYS = Number(process.env.RAW_RETENTION_DAYS || 7);
const RAW_RETENTION_HOURS = RAW_RETENTION_DAYS * 24;
type EnergyMode = 'auto' | 'raw' | 'avg';

@Injectable()
export class EnergyService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Check if we have any power data. If not, seed some initial data for a better UI experience.
    const count = await this.prisma.powerData.count();
    if (count === 0) {
      console.log('No energy data found. Seeding initial test data...');
      await this.seedTestPowerData();
    }
  }

  async getEnergyStats(hours: number = 24, mode: EnergyMode = 'auto') {
    const allData = await this.fetchAllEnergyData(hours, mode);
    return allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getEnergyStatsPaginated(
    hours: number = 24,
    page: number = 1,
    pageSize: number = 500,
    mode: EnergyMode = 'auto',
  ) {
    const allData = await this.fetchAllEnergyData(hours, mode);
    const sorted = allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = sorted.slice(start, end);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private async fetchAllEnergyData(hours: number = 24, mode: EnergyMode = 'auto') {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const shouldUseAverage =
      mode === 'avg' || (mode === 'auto' && hours > RAW_RETENTION_HOURS);

    if (shouldUseAverage) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: {
          bucketStart: {
            gte: startTime,
            lte: now,
          },
        },
        orderBy: { bucketStart: 'asc' },
      });

      return aggRows.map((row) => ({
        timestamp: row.bucketStart,
        power: row.powerAvg, // mW
        energy: (row.powerAvg / 1000) * (row.bucketMinutes / 60), // Wh calculated from mW
        voltage: row.voltageAvg,
        current: row.currentAvg, // mA
        source: 'AGGREGATED',
        samples: row.samples,
      }));
    }

    // Use combined approach: PowerAgg for old data + PowerData for recent data
    // This matches the calculation in AI billing service for consistency
    const rawCutoff = new Date(now.getTime() - RAW_RETENTION_DAYS * 24 * 3_600_000);
    // Explicitly type the array to avoid TS 'never' errors
    const allDataPoints: Array<{
      timestamp: Date;
      power: number;
      energy: number;
      voltage: number;
      current: number;
      source: 'AGGREGATED' | 'CORE';
      samples?: number;
    }> = [];

    // Part 1: Get aggregated data for records older than 7 days
    if (startTime < rawCutoff) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: {
          bucketStart: { gte: startTime, lt: rawCutoff },
        },
        orderBy: { bucketStart: 'asc' },
      });

      const aggDataPoints = aggRows.map((row) => ({
        timestamp: row.bucketStart,
        power: row.powerAvg, // mW
        energy: (row.powerAvg / 1000) * (row.bucketMinutes / 60), // Wh calculated from mW
        voltage: row.voltageAvg,
        current: row.currentAvg, // mA
        source: 'AGGREGATED' as const,
        samples: row.samples,
      }));
      allDataPoints.push(...aggDataPoints);
    }

    // Part 2: Get raw data for recent records (≤ 7 days)
    const effectiveRawStart = startTime > rawCutoff ? startTime : rawCutoff;
    const powerData = await this.prisma.powerData.findMany({
      where: {
        timestamp: { gte: effectiveRawStart, lte: now },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (powerData.length > 0) {
      const energyData = powerData.map((data, index) => {
        let energy = 0;
        if (index > 0) {
          const prev = powerData[index - 1];
          const timeDiffHours =
            (data.timestamp.getTime() - prev.timestamp.getTime()) / 3_600_000;

          // Use Trapezoidal rule: (P_prev + P_curr) / 2 for better accuracy
          // data.power is mW, energy is Wh -> (mW / 1000) * hours
          if (timeDiffHours < 2) {
            const avgPowerMw = (data.power + prev.power) / 2;
            energy = (avgPowerMw / 1000) * timeDiffHours;
          }
        }

        return {
          timestamp: data.timestamp,
          power: data.power,
          energy: energy,
          voltage: data.voltage,
          current: data.current,
          source: 'CORE' as const,
        };
      });
      allDataPoints.push(...energyData);
    }

    // Sort by timestamp to ensure correct order
    return allDataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getLatestStatus() {
    const latest = await this.prisma.powerData.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) {
      return {
        voltage: 0,
        current: 0,
        power: 0,
        status: 'OFFLINE',
        lastUpdate: null,
      };
    }

    let status = 'IDLE';
    if (latest.current > 5) {
      status = 'ACTIVE';
    } else if (latest.current < -5) {
      status = 'CONSUMING';
    }

    return {
      voltage: latest.voltage,
      current: latest.current,
      power: latest.power,
      status,
      lastUpdate: latest.timestamp,
    };
  }

  async getEfficiencyMetrics(hours: number = 24) {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const [powerData, sensorData] = await Promise.all([
      this.prisma.powerData.findMany({
        where: {
          timestamp: {
            gte: startTime,
            lte: now,
          },
        },
      }),
      this.prisma.sensorData.findMany({
        where: {
          timestamp: {
            gte: startTime,
            lte: now,
          },
        },
      }),
    ]);

    const totalPowerMw = powerData.reduce((sum, d) => sum + (d.power || 0), 0);
    const avgPowerMw =
      powerData.length > 0 ? totalPowerMw / powerData.length : 0;
    const avgTemperature =
      sensorData.length > 0
        ? sensorData.reduce((sum, d) => sum + (d.temperature || 0), 0) /
          sensorData.length
        : 0;

    return {
      totalConsumptionMw: totalPowerMw,
      averagePowerMw: avgPowerMw,
      peakPowerMw: Math.max(...powerData.map((d) => d.power), 0),
      avgTemperature: avgTemperature,
      efficiency: avgPowerMw > 0 ? ((100 - avgTemperature) / 100) * 100 : 0,
      period: `${hours}h`,
      timestamp: new Date(),
    };
  }

  async seedTestPowerData() {
    const now = new Date();
    const testData: any[] = [];

    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      let powerMw = 0;
      if (hour >= 6 && hour <= 18) {
        const peakHour = 12;
        const hoursFromPeak = Math.abs(hour - peakHour);
        powerMw = Math.max(0, 5000 - hoursFromPeak * 400 + Math.random() * 500); // 5000mW = 5W
      }

      testData.push({
        voltage: 12 + Math.random() * 1,
        current: powerMw / 12, // mA
        power: powerMw,
        timestamp,
      });
    }

    await this.prisma.powerData.deleteMany({
      where: {
        timestamp: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const data of testData) {
      await this.prisma.powerData.create({ data });
    }

    return {
      success: true,
      message: `Seeded ${testData.length} power data records for testing`,
      count: testData.length,
    };
  }

  async cleanupOldData() {
    const deleted = await this.prisma.powerData.deleteMany({
      where: {
        timestamp: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return `Deleted ${deleted.count} old power records older than 30 days`;
  }

  async getEnergySummary() {
    // 1. Calculate Today (from 00:00 today LOCAL time)
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfTodayUtc = new Date(startOfToday.getTime());

    // Get all points since midnight
    const points = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: startOfTodayUtc } },
      orderBy: { timestamp: 'asc' },
    });

    let todayWh = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const hours =
        (curr.timestamp.getTime() - prev.timestamp.getTime()) / 3600000;
      if (hours < 2) {
        const avgPowerW = (curr.power + prev.power) / 2000; // mW to W
        todayWh += avgPowerW * hours;
      }
    }

    // 2. Calculate Month (from 1st of current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Use Aggregated data for days before today
    const monthlyAgg = await this.prisma.powerAgg.aggregate({
      where: {
        bucketStart: {
          gte: startOfMonth,
          lt: startOfTodayUtc,
        },
      },
      _sum: {
        powerAvg: true,
      },
      _count: true,
    });

    // Simple estimation for aggregated month energy: (sum of avgPower / count) * hours
    // More accurately: Sum of (avgPowerW * bucketHours)
    const aggRows = await this.prisma.powerAgg.findMany({
      where: {
        bucketStart: { gte: startOfMonth, lt: startOfTodayUtc },
      },
    });

    let historicalMonthWh = 0;
    aggRows.forEach((row) => {
      historicalMonthWh += (row.powerAvg / 1000) * (row.bucketMinutes / 60);
    });

    return {
      todayWh,
      monthWh: historicalMonthWh + todayWh,
    };
  }
}
