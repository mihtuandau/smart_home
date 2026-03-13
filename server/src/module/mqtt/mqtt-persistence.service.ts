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

/**
 * Handles persistence of sensor and power data to the database.
 * Separates data storage concerns from MQTT communication.
 */
@Injectable()
export class MqttPersistenceService {
  private readonly logger = new Logger(MqttPersistenceService.name);
  private lastPowerSavedAt: number | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Persists sensor readings (temperature, humidity, pressure, rain status)
   */
  async saveSensorData(data: SensorPayload): Promise<void> {
    try {
      await this.prisma.sensorData.create({
        data: {
          temperature: data.temperature,
          humidity: data.humidity,
          pressure: data.pressure,
          lightLevel: 0, // Not provided by ESP32, default to 0
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

  /**
   * Persists power readings with accurate energy calculation based on elapsed time
   */
  async savePowerData(data: SensorPayload): Promise<void> {
    try {
      // Energy (Wh) = Power (W) × elapsed hours
      const now = Date.now();
      const elapsedHours = this.lastPowerSavedAt
        ? Math.min((now - this.lastPowerSavedAt) / 3_600_000, 1) // Cap at 1h to handle network interruptions
        : 10 / 60; // Fallback: 10 minutes on first save
      
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

  /**
   * Logs device control activity to activity log
   */
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
      // Don't throw - activity logging shouldn't block operations
    }
  }
}
