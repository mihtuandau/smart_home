import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PowerSource } from '@prisma/client';

export interface SensorPayload {
  temperature: number;
  humidity: number;
  pressure: number;
  voltage: number;
  current_mA: number;
  power_mW: number;
  rain: boolean;
  led1: boolean;
  led2: boolean;
}

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
          lightLevel: 0,
          isDark: false,
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
      const now = Date.now();
      const elapsedHours = this.lastPowerSavedAt
        ? Math.min((now - this.lastPowerSavedAt) / 3_600_000, 1)
        : 10 / 60;

      const energyWh = (data.power_mW / 1000) * elapsedHours;
      this.lastPowerSavedAt = now;

      await this.prisma.powerData.create({
        data: {
          voltage: data.voltage,
          current: data.current_mA / 1000,
          power: data.power_mW / 1000,
          energy: parseFloat(energyWh.toFixed(2)),
          source: PowerSource.SOLAR,
          batteryLevel: null,
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
