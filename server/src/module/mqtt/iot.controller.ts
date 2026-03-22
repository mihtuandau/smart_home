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
} from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../../common/prisma.service';
import { ControlLedDto } from './dto/control-led.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('iot')
export class IotController {
  constructor(
    private mqttService: MqttService,
    private prisma: PrismaService,
  ) {}

  @Get('status')
  getStatus() {
    return {
      mqtt: this.mqttService.isConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('data/latest')
  getLatestData() {
    const data = this.mqttService.getLatestData();
    if (!data) {
      throw new HttpException('No data available yet', HttpStatus.NOT_FOUND);
    }
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
        return { success: true, message: 'Both LEDs controlled successfully', data: dto };
      } else if (dto.led1 !== undefined) {
        await this.mqttService.controlLed('led1', dto.led1);
        return { success: true, message: 'LED1 controlled successfully', data: { led1: dto.led1 } };
      } else if (dto.led2 !== undefined) {
        await this.mqttService.controlLed('led2', dto.led2);
        return { success: true, message: 'LED2 controlled successfully', data: { led2: dto.led2 } };
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
        throw new HttpException('Angle must be 0, 90, or 180', HttpStatus.BAD_REQUEST);
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

  // ─── IoT Device CRUD qua MQTT ───────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('device/add')
  async addIoTDevice(@Body() dto: { name: string; power_consumption: number }) {
    if (!dto.name || dto.power_consumption <= 0) {
      throw new HttpException(
        'name và power_consumption > 0 là bắt buộc',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await this.mqttService.addIoTDevice(dto.name, dto.power_consumption);
      return { success: true, message: `Đã gửi lệnh thêm thiết bị "${dto.name}"` };
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
      return { success: true, message: 'Đã gửi lệnh điều khiển thiết bị', data: dto };
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
      await this.mqttService.updateIoTDevice(idx, dto.name, dto.power_consumption);
      return { success: true, message: `Đã gửi lệnh cập nhật thiết bị index ${idx}` };
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
      await this.mqttService.deleteIoTDevice(idx);
      return { success: true, message: `Đã gửi lệnh xóa thiết bị index ${idx}` };
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
