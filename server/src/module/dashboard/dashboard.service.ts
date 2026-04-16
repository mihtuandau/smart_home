import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
  ) {}

  async getOverview() {
    const [deviceStats, sensorData, powerData, activityLogs] =
      await Promise.all([
        this.getDeviceStats(),
        this.getLatestSensorData(),
        this.getLatestPowerData(),
        this.getRecentActivities(5),
      ]);

    return {
      devices: deviceStats,
      environment: sensorData,
      power: powerData,
      recentActivities: activityLogs,
      timestamp: new Date(),
    };
  }

  async getDeviceStats() {
    const dbTotal = await this.prisma.device.count();
    const byStatus = await this.prisma.device.groupBy({
      by: ['status'],
      _count: true,
    });

    const ledsTotal = 2; // Hardcoded LEDs in ESP32
    let ledsOnCount = 0;

    const latestMqttData = this.mqttService.getLatestData();
    if (latestMqttData) {
      if (latestMqttData.led1 === true) ledsOnCount++;
      if (latestMqttData.led2 === true) ledsOnCount++;
    }

    const dbOnCount = byStatus.find((s) => s.status === 'ON')?._count || 0;
    
    // We treat everything as generic devices now
    const total = dbTotal + ledsTotal;
    const online = dbOnCount + ledsOnCount;
    const offline = total - online;

    return {
      total,
      online,
      offline,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getLatestSensorData() {
    const latest = await this.prisma.sensorData.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) return null;

    return {
      temperature: latest.temperature,
      humidity: latest.humidity,
      pressure: latest.pressure,
      isRaining: latest.isRaining,
      timestamp: latest.timestamp,
    };
  }

  async getLatestPowerData() {
    const latest = await this.prisma.powerData.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) return null;

    return {
      voltage: latest.voltage,
      current: latest.current, // mA
      power: latest.power, // mW
      timestamp: latest.timestamp,
    };
  }

  async getRecentActivities(limit: number = 10) {
    return this.prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        device: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async getEnergyStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await this.prisma.powerData.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (data.length === 0) {
      return {
        totalEnergyWh: 0,
        avgPowerMw: 0,
        avgVoltageV: 0,
        avgCurrentMa: 0,
        count: 0,
        period: `${hours}h`,
      };
    }

    // Calculate energy Wh dynamically from power mW data points
    const totalEnergyWh = data.reduce((sum, d, i) => {
      if (i === 0) return sum;
      const timeDiffHours = (d.timestamp.getTime() - data[i - 1].timestamp.getTime()) / 3600000;
      return sum + (d.power / 1000) * timeDiffHours;
    }, 0);

    const avgPower = data.reduce((sum, d) => sum + d.power, 0) / data.length;
    const avgVoltage = data.reduce((sum, d) => sum + d.voltage, 0) / data.length;
    const avgCurrent = data.reduce((sum, d) => sum + d.current, 0) / data.length;

    return {
      totalEnergyWh: Math.round(totalEnergyWh * 100) / 100,
      avgPowerMw: Math.round(avgPower * 100) / 100,
      avgVoltageV: Math.round(avgVoltage * 100) / 100,
      avgCurrentMa: Math.round(avgCurrent * 100) / 100,
      count: data.length,
      period: `${hours}h`,
    };
  }

  async getSystemHealth() {
    const [
      deviceCount,
      sensorCount,
      powerCount,
      lastSensorUpdate,
      lastPowerUpdate,
    ] = await Promise.all([
      this.prisma.device.count(),
      this.prisma.sensorData.count(),
      this.prisma.powerData.count(),
      this.prisma.sensorData.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),
      this.prisma.powerData.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),
    ]);

    const now = Date.now();
    const sensorAge = lastSensorUpdate
      ? now - lastSensorUpdate.timestamp.getTime()
      : null;
    const powerAge = lastPowerUpdate
      ? now - lastPowerUpdate.timestamp.getTime()
      : null;

    return {
      devices: {
        total: deviceCount,
        healthy: true,
      },
      sensors: {
        totalReadings: sensorCount,
        lastUpdate: lastSensorUpdate?.timestamp,
        healthy: sensorAge ? sensorAge < 60000 : false,
      },
      power: {
        totalReadings: powerCount,
        lastUpdate: lastPowerUpdate?.timestamp,
        healthy: powerAge ? powerAge < 60000 : false,
      },
      overall: {
        status:
          sensorAge && powerAge && sensorAge < 60000 && powerAge < 60000
            ? 'healthy'
            : 'degraded',
      },
    };
  }
}
