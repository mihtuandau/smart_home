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
import { DeviceStatus, DeviceType } from '@prisma/client';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../../common/prisma.service';
import { ControlLedDto } from './dto/control-led.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('iot')
export class IotController {
  private readonly customDeviceBasePin = 9001;

  constructor(
    private mqttService: MqttService,
    private prisma: PrismaService,
  ) {}

  private getSlotPin(index: number): number {
    return this.customDeviceBasePin + index;
  }

  private getCustomDevicePins(): number[] {
    return [this.getSlotPin(0), this.getSlotPin(1)];
  }

  private async getCustomDevicesBySlot() {
    const devices = await this.prisma.device.findMany({
      where: {
        pin: {
          in: this.getCustomDevicePins(),
        },
      },
      orderBy: {
        pin: 'asc',
      },
    });

    const bySlot: Array<(typeof devices)[number] | null> = [null, null];
    for (const device of devices) {
      const slot = device.pin - this.customDeviceBasePin;
      if (slot === 0 || slot === 1) {
        bySlot[slot] = device;
      }
    }

    return bySlot;
  }

  private async getCustomDevicesOrdered() {
    return this.prisma.device.findMany({
      where: {
        pin: {
          in: this.getCustomDevicePins(),
        },
      },
      orderBy: {
        createdAt: 'asc',
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
    const latestData = this.mqttService.getLatestData() || ({} as Record<string, unknown>);
    const orderedDevices = await this.getCustomDevicesOrdered();

    const slot1State =
      typeof latestData.device1 === 'boolean'
        ? latestData.device1
        : orderedDevices[0]?.status === 'ON';
    const slot2State =
      typeof latestData.device2 === 'boolean'
        ? latestData.device2
        : orderedDevices[1]?.status === 'ON';

    const data = {
      ...latestData,
      device1: orderedDevices[0]
        ? {
            id: orderedDevices[0].id,
            name: orderedDevices[0].name,
            power: Number(orderedDevices[0].powerConsumption || 0),
            state: Boolean(slot1State),
            pin: orderedDevices[0].pin,
          }
        : undefined,
      device2: orderedDevices[1]
        ? {
            id: orderedDevices[1].id,
            name: orderedDevices[1].name,
            power: Number(orderedDevices[1].powerConsumption || 0),
            state: Boolean(slot2State),
            pin: orderedDevices[1].pin,
          }
        : undefined,
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
    const devices = await this.prisma.device.findMany({
      include: { led: true },
    });
    return { success: true, count: devices.length, data: devices };
  }

  @UseGuards(JwtAuthGuard)
  @Post('control/led')
  async controlLed(@Body() dto: ControlLedDto) {
    try {
      if (dto.led1 !== undefined && dto.led2 !== undefined) {
        await this.mqttService.controlBothLeds(dto.led1, dto.led2);
        return {
          success: true,
          message: 'Both LEDs controlled successfully',
          data: dto,
        };
      } else if (dto.led1 !== undefined) {
        await this.mqttService.controlLed('led1', dto.led1);
        return {
          success: true,
          message: 'LED1 controlled successfully',
          data: { led1: dto.led1 },
        };
      } else if (dto.led2 !== undefined) {
        await this.mqttService.controlLed('led2', dto.led2);
        return {
          success: true,
          message: 'LED2 controlled successfully',
          data: { led2: dto.led2 },
        };
      } else {
        throw new HttpException(
          'At least one LED control must be specified',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        `Failed to control LED: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('control/servo')
  async controlServo(@Body() dto: { angle: number }) {
    try {
      if (![0, 90, 180].includes(dto.angle)) {
        throw new HttpException(
          'Angle must be 0, 90, or 180',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.mqttService.controlServo(dto.angle);
      return {
        success: true,
        message: `Servo moved to ${dto.angle} degrees`,
        data: { angle: dto.angle },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to control servo: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('device/add')
  async addIoTDevice(
    @Request() req,
    @Body() dto: { name: string; power_consumption: number },
  ) {
    if (!dto.name || dto.power_consumption <= 0) {
      throw new HttpException(
        'name và power_consumption > 0 là bắt buộc',
        HttpStatus.BAD_REQUEST,
      );
    }

    const slots = await this.getCustomDevicesBySlot();
    const emptyIndex = slots.findIndex((slot) => !slot);
    if (emptyIndex === -1) {
      throw new HttpException(
        'Đã đủ 2 thiết bị IoT tùy chỉnh. Hãy xóa 1 thiết bị trước khi thêm mới.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.mqttService.addIoTDevice(dto.name, dto.power_consumption);

      const pin = this.getSlotPin(emptyIndex);
      const userId = req?.user?.id;
      const existingByPin = await this.prisma.device.findFirst({
        where: { pin },
      });

      if (existingByPin) {
        await this.prisma.device.update({
          where: { id: existingByPin.id },
          data: {
            name: dto.name,
            status: DeviceStatus.OFF,
            powerConsumption: dto.power_consumption,
            manualMode: true,
            userId: userId || null,
            value: 0,
            lastActive: new Date(),
          },
        });
      } else {
        await this.prisma.device.create({
          data: {
            name: dto.name,
            type: DeviceType.TOUCH,
            status: DeviceStatus.OFF,
            pin,
            value: 0,
            manualMode: true,
            powerConsumption: dto.power_consumption,
            userId: userId || null,
            lastActive: new Date(),
          },
        });
      }

      return {
        success: true,
        message: `Đã gửi lệnh thêm thiết bị "${dto.name}"`,
        data: {
          index: emptyIndex,
          name: dto.name,
          power: dto.power_consumption,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi thêm thiết bị: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('device/control')
  async controlIoTDevice(
    @Body() dto: { device1?: boolean; device2?: boolean },
  ) {
    if (dto.device1 === undefined && dto.device2 === undefined) {
      throw new HttpException(
        'Phải chỉ định ít nhất device1 hoặc device2',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.mqttService.controlIoTDevice(dto.device1, dto.device2);

      const updates: Promise<unknown>[] = [];
      const orderedDevices = await this.getCustomDevicesOrdered();

      if (dto.device1 !== undefined) {
        const first = orderedDevices[0];
        if (first) {
          updates.push(
          this.prisma.device.updateMany({
            where: { id: first.id },
            data: {
              status: dto.device1 ? DeviceStatus.ON : DeviceStatus.OFF,
              lastActive: new Date(),
            },
          }),
          );
        }
      }

      if (dto.device2 !== undefined) {
        const second = orderedDevices[1];
        if (second) {
          updates.push(
          this.prisma.device.updateMany({
            where: { id: second.id },
            data: {
              status: dto.device2 ? DeviceStatus.ON : DeviceStatus.OFF,
              lastActive: new Date(),
            },
          }),
          );
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      return {
        success: true,
        message: 'Đã gửi lệnh điều khiển thiết bị',
        data: dto,
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi điều khiển: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('device/update/:index')
  async updateIoTDevice(
    @Param('index') index: string,
    @Body() dto: { name?: string; power_consumption?: number },
  ) {
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx > 1) {
      throw new HttpException('index phải là 0 hoặc 1', HttpStatus.BAD_REQUEST);
    }
    try {
      const orderedDevices = await this.getCustomDevicesOrdered();
      const target = orderedDevices[idx];
      if (!target) {
        throw new HttpException(
          `Không tìm thấy thiết bị ở vị trí ${idx}`,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.mqttService.updateIoTDevice(
        idx,
        dto.name,
        dto.power_consumption,
      );

      await this.prisma.device.update({
        where: { id: target.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.power_consumption !== undefined
            ? { powerConsumption: dto.power_consumption }
            : {}),
          lastActive: new Date(),
        },
      });

      return {
        success: true,
        message: `Đã gửi lệnh cập nhật thiết bị index ${idx}`,
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi cập nhật: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('device/delete/:index')
  async deleteIoTDevice(@Param('index') index: string) {
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx > 1) {
      throw new HttpException('index phải là 0 hoặc 1', HttpStatus.BAD_REQUEST);
    }
    try {
      const orderedDevices = await this.getCustomDevicesOrdered();
      const target = orderedDevices[idx];
      if (!target) {
        throw new HttpException(
          `Không tìm thấy thiết bị ở vị trí ${idx}`,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.mqttService.deleteIoTDevice(idx);

      await this.prisma.device.delete({
        where: {
          id: target.id,
        },
      });

      return {
        success: true,
        message: `Đã gửi lệnh xóa thiết bị index ${idx}`,
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi xóa thiết bị: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
