import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { DeviceStatus, DeviceType } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.device.findMany({
      include: {
        led: true,
        servo: true,
        touch: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        led: true,
        servo: true,
        touch: true,
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
    const device = await this.findOne(id);

    return this.prisma.device.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        led: true,
        servo: true,
        touch: true,
      },
    });
  }

  async toggle(id: string) {
    const device = await this.findOne(id);

    const newStatus =
      device.status === DeviceStatus.ON
        ? DeviceStatus.OFF
        : DeviceStatus.ON;

    return this.prisma.device.update({
      where: { id },
      data: {
        status: newStatus,
        value: newStatus === DeviceStatus.ON ? 100 : 0,
        lastActive: new Date(),
      },
      include: {
        led: true,
        servo: true,
        touch: true,
      },
    });
  }

  async getHistory(id: string, hours: number = 24) {
    await this.findOne(id); // Verify device exists

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

  async getByType(type: DeviceType) {
    return this.prisma.device.findMany({
      where: { type },
      include: {
        led: true,
        servo: true,
        touch: true,
      },
    });
  }

  async getStats() {
    const total = await this.prisma.device.count();
    const byStatus = await this.prisma.device.groupBy({
      by: ['status'],
      _count: true,
    });

    const byType = await this.prisma.device.groupBy({
      by: ['type'],
      _count: true,
    });

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      online: statusMap['ON'] || 0,
      offline: statusMap['OFF'] || 0,
      byStatus: statusMap,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
    };
  }
}
