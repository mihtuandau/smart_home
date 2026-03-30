import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { DeviceStatus, DeviceType } from '@prisma/client';
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
      device.status === DeviceStatus.ON ? DeviceStatus.OFF : DeviceStatus.ON;

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

      this.logger.log(
        ` MQTT Data: LED1=${latestMqttData.led1}, LED2=${latestMqttData.led2}, ledsOnCount=${ledsOnCount}`,
      );
    } else {
      this.logger.warn(` MQTT Data not available yet`);
    }

    let customDevicesTotal = 0;
    let customDevicesOnCount = 0;

    if (latestMqttData) {
      if ((latestMqttData as any).device1 !== undefined) {
        customDevicesTotal++;
        if ((latestMqttData as any).device1 === true) customDevicesOnCount++;
      }
      if ((latestMqttData as any).device2 !== undefined) {
        customDevicesTotal++;
        if ((latestMqttData as any).device2 === true) customDevicesOnCount++;
      }

      if (customDevicesTotal > 0) {
        this.logger.log(
          ` Custom Devices: Total=${customDevicesTotal}, Online=${customDevicesOnCount}`,
        );
      }
    }

    const total = dbTotal + ledsTotal + customDevicesTotal;

    const dbOnCount = dbByStatus.find((s) => s.status === 'ON')?._count || 0;
    const online = dbOnCount + ledsOnCount + customDevicesOnCount;
    const offline = total - online;

    this.logger.log(
      ` Device Stats - DB: ${dbTotal}/${dbOnCount}ON, LEDs: ${ledsTotal}/${ledsOnCount}ON, Custom: ${customDevicesTotal}/${customDevicesOnCount}ON, Total: ${total}/${online}ON`,
    );

    const dbStatusMap = dbByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dbByType = await this.prisma.device.groupBy({
      by: ['type'],
      _count: true,
    });

    return {
      total,
      online,
      offline,
      byStatus: dbStatusMap,
      byType: dbByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
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
        customDevices: {
          total: customDevicesTotal,
          online: customDevicesOnCount,
          offline: customDevicesTotal - customDevicesOnCount,
        },
      },
    };
  }
}
