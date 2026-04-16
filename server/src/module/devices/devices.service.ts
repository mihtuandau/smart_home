import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { DeviceStatus } from '@prisma/client';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
  ) {}

  async findAll() {
    return this.prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        activityLogs: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    return this.prisma.device.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async toggle(id: string) {
    const device = await this.findOne(id);

    const newStatus =
      device.status === DeviceStatus.ON ? DeviceStatus.OFF : DeviceStatus.ON;

    return this.prisma.device.update({
      where: { id },
      data: {
        status: newStatus,
        lastActive: new Date(),
      },
    });
  }

  async getHistory(id: string, hours: number = 24) {
    await this.findOne(id);

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.activityLog.findMany({
      where: {
        deviceId: id,
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getStats() {
    const dbTotal = await this.prisma.device.count();
    const dbByStatus = await this.prisma.device.groupBy({
      by: ['status'],
      _count: true,
    });

    const latestMqttData = this.mqttService.getLatestData();
    let ledsOnCount = 0;
    const ledsTotal = 2;

    if (latestMqttData) {
      if (latestMqttData.led1 === true) ledsOnCount++;
      if (latestMqttData.led2 === true) ledsOnCount++;
    }

    const total = dbTotal + ledsTotal;
    const dbOnCount = dbByStatus.find((s) => s.status === 'ON')?._count || 0;
    const online = dbOnCount + ledsOnCount;
    const offline = total - online;

    const dbStatusMap = dbByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      online,
      offline,
      byStatus: dbStatusMap,
      breakdown: {
        database: {
          total: dbTotal,
          online: dbOnCount,
          offline: dbTotal - dbOnCount,
        },
        leds: {
          total: ledsTotal,
          online: ledsOnCount,
          offline: ledsTotal - ledsOnCount,
        },
      },
    };
  }
}
