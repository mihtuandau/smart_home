import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../../common/prisma.service';
import { ControlLedDto } from './dto/control-led.dto';

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
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sensors')
  async getSensorData() {
    const data = await this.prisma.sensorData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('power')
  async getPowerData() {
    const data = await this.prisma.powerData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('devices')
  async getDevices() {
    const devices = await this.prisma.device.findMany({
      include: {
        led: true,
      },
    });

    return {
      success: true,
      count: devices.length,
      data: devices,
    };
  }

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
        `Failed to control LED: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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
        `Failed to control servo: ${error.message}`,
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

    return {
      success: true,
      count: logs.length,
      data: logs,
    };
  }
}
