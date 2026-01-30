import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EnergyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get energy consumption stats for a time period
   */
  async getEnergyStats(hours: number = 24) {
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

    if (powerData.length === 0) {
      return [];
    }

    // Calculate energy consumption (Wh) from power (W)
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

  /**
   * Get battery status and health
   */
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

    // Determine battery status based on voltage and current
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

  /**
   * Get solar power generation stats
   */
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

    // Approximate energy (Wh) from average power
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

  /**
   * Get power source stats (Solar, Battery, Grid)
   */
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

  /**
   * Get energy efficiency metrics
   */
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
    const avgPower =
      powerData.length > 0 ? totalPower / powerData.length : 0;
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
}
