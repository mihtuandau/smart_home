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
    const byType = await this.prisma.device.groupBy({
      by: ['type'],
      _count: true,
    });

    const ledsTotal = 2;
    let ledsOnCount = 0;

    const latestMqttData = this.mqttService.getLatestData();
    if (latestMqttData) {
      if (latestMqttData.led1 === true) ledsOnCount++;
      if (latestMqttData.led2 === true) ledsOnCount++;
    }

    let customDevicesTotal = 0;
    let customDevicesOnCount = 0;
    if (latestMqttData) {
      if (latestMqttData.device1 !== undefined) {
        customDevicesTotal++;
        if (latestMqttData.device1) customDevicesOnCount++;
      }
      if (latestMqttData.device2 !== undefined) {
        customDevicesTotal++;
        if (latestMqttData.device2) customDevicesOnCount++;
      }
    }

    const dbOnCount = byStatus.find((s) => s.status === 'ON')?._count || 0;
    const total = dbTotal + ledsTotal + customDevicesTotal;
    const online = dbOnCount + ledsOnCount + customDevicesOnCount;
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
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
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
      lightLevel: latest.lightLevel,
      isDark: latest.isDark,
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
      current: latest.current,
      power: latest.power,
      energy: latest.energy,
      source: latest.source,
      batteryLevel: latest.batteryLevel,
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
            type: true,
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
        totalEnergy: 0,
        avgPower: 0,
        avgVoltage: 0,
        avgCurrent: 0,
        count: 0,
        period: `${hours}h`,
      };
    }

    const totalEnergy = data.reduce((sum, d) => sum + (d.energy || 0), 0);
    const avgPower = data.reduce((sum, d) => sum + d.power, 0) / data.length;
    const avgVoltage =
      data.reduce((sum, d) => sum + d.voltage, 0) / data.length;
    const avgCurrent =
      data.reduce((sum, d) => sum + d.current, 0) / data.length;

    return {
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      avgPower: Math.round(avgPower * 100) / 100,
      avgVoltage: Math.round(avgVoltage * 100) / 100,
      avgCurrent: Math.round(avgCurrent * 100) / 100,
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
        healthy: deviceCount > 0,
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
