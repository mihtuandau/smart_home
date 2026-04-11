import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

import { SensorPayload } from './mqtt.service';

@Injectable()
export class MqttPersistenceService {
  private readonly logger = new Logger(MqttPersistenceService.name);
  private lastPowerSavedAt: number | null = null;

  constructor(private prisma: PrismaService) {}

  async saveSensorData(data: SensorPayload): Promise<void> {
    try {
      await this.prisma.sensorData.create({
        data: {
          temperature: data.temperature,
          humidity: data.humidity,
          pressure: data.pressure,
          isRaining: data.rain,
        },
      });
      this.logger.debug('Sensor data saved to database');
    } catch (error) {
      this.logger.error(`Failed to save sensor data: ${error.message}`);
      throw error;
    }
  }

  async savePowerData(data: SensorPayload): Promise<void> {
    try {
      await this.prisma.powerData.create({
        data: {
          voltage: data.voltage,
          current: data.current_mA,
          power: data.power_mW,
        },
      });
      this.logger.debug('Power data saved to database');
    } catch (error) {
      this.logger.error(`Failed to save power data: ${error.message}`);
      throw error;
    }
  }

  async logActivity(device: string, state: boolean): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          action: `${device.toUpperCase()}_${state ? 'ON' : 'OFF'}`,
          details: {
            device,
            state,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error.message}`);
    }
  }
}
