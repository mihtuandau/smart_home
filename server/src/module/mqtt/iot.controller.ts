import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../../common/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('iot')
export class IotController {
  private readonly customDeviceBasePin = 13;

  constructor(
    private mqttService: MqttService,
    private prisma: PrismaService,
  ) {}

  private getSlotPin(index: number): number {
    return this.customDeviceBasePin + index;
  }

  private async getCustomDevicesOrdered() {
    return this.prisma.device.findMany({
      orderBy: {
        pin: 'asc',
      },
    });
  }

  @Get('status')
  getStatus() {
    return {
      mqtt: this.mqttService.isConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('data/latest')
  async getLatestData() {
    const latestData = this.mqttService.getLatestData() || ({} as any);
    const rawDevices = this.mqttService.getRawDeviceData() || {};
    const devices = await this.prisma.device.findMany({
      orderBy: { pin: 'asc' },
    });

    // Combine database devices with raw MQTT device data
    const allDevices: any[] = [];
    for (const d of devices) {
      const mqttState = d.pin === 13 ? latestData.device1 : undefined;
      const state = typeof mqttState === 'boolean' ? mqttState : d.status === 'ON';

      allDevices.push({
        id: d.id,
        name: d.name,
        power: d.powerConsumption,
        state,
        pin: d.pin,
      });
    }

    // Add raw MQTT devices that aren't in database (fallback)
    if (rawDevices.device1 && devices.length === 0) {
      allDevices.push({
        id: 'mqtt-device1',
        name: rawDevices.device1.name || 'Device 1',
        power: rawDevices.device1.power || 0,
        state: rawDevices.device1.state || false,
        pin: rawDevices.device1.pin || 13,
      });
    }

    const data = {
      ...latestData,
      devices: allDevices,
      device1: allDevices[0] || undefined,
    };

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('sensors')
  async getSensorData() {
    const data = await this.prisma.sensorData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return { success: true, count: data.length, data };
  }

  @Get('power')
  async getPowerData() {
    const data = await this.prisma.powerData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return { success: true, count: data.length, data };
  }

  @Get('devices')
  async getDevices() {
    const devices = await this.prisma.device.findMany();
    return { success: true, count: devices.length, data: devices };
  }

  @UseGuards(JwtAuthGuard)
  @Post('control/led')
  async controlLed(@Body() dto: { led1?: boolean; led2?: boolean }) {
    try {
      if (dto.led1 !== undefined && dto.led2 !== undefined) {
        await this.mqttService.controlBothLeds(dto.led1, dto.led2);
      } else if (dto.led1 !== undefined) {
        await this.mqttService.controlLed('led1', dto.led1);
      } else if (dto.led2 !== undefined) {
        await this.mqttService.controlLed('led2', dto.led2);
      }
      return { success: true, message: 'LED control sent' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /*
  @UseGuards(JwtAuthGuard)
  @Post('control/servo')
  async controlServo(@Body() dto: { angle: number }) {
    try {
      await this.mqttService.controlServo(dto.angle);
      return { success: true, message: `Servo moved to ${dto.angle}` };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  */

  @UseGuards(JwtAuthGuard)
  @Post('device/add')
  async addIoTDevice(
    @Request() req,
    @Body() dto: { name: string; power_consumption: number },
  ) {
    const currentDevices = await this.prisma.device.count();
    if (currentDevices >= 1) {
      throw new HttpException('Maximum 1 device supported', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.mqttService.addIoTDevice(dto.name, dto.power_consumption);
      
      await this.prisma.device.create({
        data: {
          name: dto.name,
          pin: 13,
          status: DeviceStatus.OFF,
          powerConsumption: dto.power_consumption,
          userId: req?.user?.id || null,
        },
      });

      return { success: true, message: 'Device added' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('device/control')
  async controlIoTDevice(
    @Body() dto: { device1?: boolean; device2?: boolean },
  ) {
    try {
      await this.mqttService.controlIoTDevice(dto.device1, dto.device2);
      
      const devices = await this.getCustomDevicesOrdered();
      if (dto.device1 !== undefined && devices[0]) {
        await this.prisma.device.update({
          where: { id: devices[0].id },
          data: { status: dto.device1 ? DeviceStatus.ON : DeviceStatus.OFF },
        });
      }
      if (dto.device2 !== undefined && devices[1]) {
        await this.prisma.device.update({
          where: { id: devices[1].id },
          data: { status: dto.device2 ? DeviceStatus.ON : DeviceStatus.OFF },
        });
      }

      return { success: true, message: 'Control command sent' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('device/delete/:index')
  async deleteIoTDevice(@Param('index') index: string) {
    const idx = parseInt(index, 10);
    try {
      const devices = await this.getCustomDevicesOrdered();
      const rawDevices = this.mqttService.getRawDeviceData() || {};
      const target = devices[idx];
      
      // Check if device exists in database
      if (!target) {
        // Try to find in MQTT raw devices
        const deviceKey = idx === 0 ? 'device1' : idx === 1 ? 'device2' : null;
        if (!deviceKey || !rawDevices[deviceKey]) {
          throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
        }
        // Device exists only in MQTT, just send delete command
        await this.mqttService.deleteIoTDevice(idx);
        return { success: true, message: 'MQTT device deleted' };
      }

      // Device exists in database
      await this.mqttService.deleteIoTDevice(idx);
      await this.prisma.device.delete({ where: { id: target.id } });

      return { success: true, message: 'Device deleted' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('device/update/:index')
  async updateIoTDevice(
    @Param('index') index: string,
    @Body() dto: { name?: string; power_consumption?: number },
  ) {
    const idx = parseInt(index, 10);
    try {
      const devices = await this.getCustomDevicesOrdered();
      const target = devices[idx];

      if (target) {
        await this.prisma.device.update({
          where: { id: target.id },
          data: {
            name: dto.name,
            powerConsumption: dto.power_consumption,
          },
        });
      }

      await this.mqttService.updateIoTDevice(
        idx,
        dto.name,
        dto.power_consumption,
      );

      return { success: true, message: 'Device updated' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('logs')
  async getActivityLogs() {
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return { success: true, count: logs.length, data: logs };
  }
}
