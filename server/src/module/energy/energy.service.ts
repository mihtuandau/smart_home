import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PowerSource } from '@prisma/client';

@Injectable()
export class EnergyService {
  constructor(private prisma: PrismaService) {}

  async getEnergyStats(hours: number = 24) {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const powerData = await this.prisma.powerData.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: now,
        },
        source: 'SOLAR',
      },
      orderBy: { timestamp: 'asc' },
    });

    if (powerData.length === 0) {
      return [];
    }

    const energyData = powerData.map((data, index) => {
      let energy = 0;
      if (index > 0) {
        const timeDiffMs =
          data.timestamp.getTime() - powerData[index - 1].timestamp.getTime();
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
        energy = (data.power || 0) * timeDiffHours;
      }

      return {
        timestamp: data.timestamp,
        power: data.power || 0,
        energy: energy,
        voltage: data.voltage || 0,
        current: data.current || 0,
        source: data.source,
      };
    });

    return energyData;
  }

  async getBatteryStatus() {
    const latest = await this.prisma.powerData.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) {
      return {
        level: 0,
        voltage: 0,
        current: 0,
        status: 'UNKNOWN',
        lastUpdate: null,
      };
    }

    let status = 'UNKNOWN';
    if (latest.current > 0) {
      status = 'CHARGING';
    } else if (latest.current < 0) {
      status = 'DISCHARGING';
    } else {
      status = 'IDLE';
    }

    return {
      level: latest.batteryLevel || 0,
      voltage: latest.voltage || 0,
      current: latest.current || 0,
      status,
      lastUpdate: latest.timestamp,
    };
  }

  async getSolarStats(hours: number = 24) {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const solarData = await this.prisma.powerData.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: now,
        },
        source: 'SOLAR',
      },
      orderBy: { timestamp: 'asc' },
    });

    if (solarData.length === 0) {
      return {
        totalGenerated: 0,
        peakPower: 0,
        averagePower: 0,
        data: [],
      };
    }

    const powers = solarData.map((d) => d.power || 0);
    const totalPower = powers.reduce((a, b) => a + b, 0);
    const avgPower = totalPower / powers.length;
    const peakPower = Math.max(...powers);

    const totalEnergy = avgPower * hours;

    return {
      totalGenerated: totalEnergy,
      peakPower,
      averagePower: avgPower,
      data: solarData.map((d) => ({
        timestamp: d.timestamp,
        power: d.power || 0,
      })),
    };
  }

  async getPowerSourceStats(hours: number = 24) {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const powerData = await this.prisma.powerData.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: now,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const sources: Record<string, number[]> = {
      SOLAR: [],
      BATTERY: [],
      GRID: [],
    };

    powerData.forEach((data) => {
      const source = data.source || 'GRID';
      if (!sources[source]) {
        sources[source] = [];
      }
      sources[source].push(data.power || 0);
    });

    const stats: Record<string, any> = {};
    Object.entries(sources).forEach(([source, powers]) => {
      if (powers.length === 0) {
        stats[source] = {
          count: 0,
          total: 0,
          average: 0,
          peak: 0,
        };
      } else {
        const total = powers.reduce((a, b) => a + b, 0);
        stats[source] = {
          count: powers.length,
          total: total,
          average: total / powers.length,
          peak: Math.max(...powers),
        };
      }
    });

    return stats;
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

    const totalPower = powerData.reduce((sum, d) => sum + (d.power || 0), 0);
    const avgPower = powerData.length > 0 ? totalPower / powerData.length : 0;
    const avgTemperature =
      sensorData.length > 0
        ? sensorData.reduce((sum, d) => sum + (d.temperature || 0), 0) /
          sensorData.length
        : 0;

    return {
      totalConsumption: totalPower,
      averagePower: avgPower,
      peakPower: Math.max(...powerData.map((d) => d.power || 0), 0),
      avgTemperature: avgTemperature,
      efficiency: avgPower > 0 ? ((100 - avgTemperature) / 100) * 100 : 0,
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

      let power = 0;
      if (hour >= 6 && hour <= 18) {
        const peakHour = 12;
        const hoursFromPeak = Math.abs(hour - peakHour);
        power = Math.max(0, 100 - hoursFromPeak * 10 + Math.random() * 20);
      }

      testData.push({
        voltage: 18 + Math.random() * 2,
        current: power / 20,
        power: power,
        energy: (power * 1) / 60,
        source: PowerSource.SOLAR,
        batteryLevel: null,
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
      await (this.prisma.powerData.create as any)({ data });
    }

    return {
      success: true,
      message: `Seeded ${testData.length} power data records for testing`,
      count: testData.length,
    };
  }

  async cleanupZeroEnergyData() {
    const deleted = await this.prisma.powerData.deleteMany({
      where: {
        energy: 0,
        source: PowerSource.SOLAR,
      },
    });

    return `Deleted ${deleted.count} old SOLAR records with energy = 0`;
  }

  async deleteOldSolarData() {
    const cutoffTime = new Date('2026-02-04T16:55:00Z');

    const deleted = await this.prisma.powerData.deleteMany({
      where: {
        source: PowerSource.SOLAR,
        timestamp: {
          lt: cutoffTime,
        },
      },
    });

    return `Deleted ${deleted.count} SOLAR records before ${cutoffTime.toISOString()}`;
  }
}
