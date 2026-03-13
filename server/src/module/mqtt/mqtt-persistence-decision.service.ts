import { Injectable } from '@nestjs/common';

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
 * Determines when sensor data should be persisted to the database.
 * Implements threshold-based decision logic to avoid unnecessary database writes.
 *
 * Uses two strategies:
 * 1. Heartbeat: Always save every HEARTBEAT_MS regardless of changes (failsafe)
 * 2. Change Detection: Save when any value changes beyond threshold (responsive)
 *
 * This prevents database spam while ensuring periodic updates and capturing significant changes.
 */
@Injectable()
export class MqttPersistenceDecisionService {
  private lastPersisted: { timestamp: number; data: SensorPayload } | null = null;

  private static readonly HEARTBEAT_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly THRESHOLDS = {
    temperature: 0.5,   // 0.5°C
    humidity: 5.0,      // 5%
    pressure: 10,       // 10 Pa (hPa × 100)
    voltage: 0.1,       // 0.1V
    current: 0.05,      // 0.05A (50mA)
    power: 0.2,         // 0.2W
  };

  /**
   * Decides whether to persist the given sensor data based on thresholds
   */
  shouldPersist(data: SensorPayload): boolean {
    // First read: always persist
    if (!this.lastPersisted) {
      this.recordPersistance(data);
      return true;
    }

    const now = Date.now();

    // Heartbeat: persist every N minutes regardless of changes
    if (now - this.lastPersisted.timestamp >= MqttPersistenceDecisionService.HEARTBEAT_MS) {
      this.recordPersistance(data);
      return true;
    }

    // Check if any sensor changed significantly
    if (this.hasSignificantChange(data, this.lastPersisted.data)) {
      this.recordPersistance(data);
      return true;
    }

    return false;
  }

  /**
   * Checks if any sensor reading has changed beyond its threshold
   */
  private hasSignificantChange(current: SensorPayload, previous: SensorPayload): boolean {
    // Environmental sensors
    if (Math.abs(current.temperature - previous.temperature) >= MqttPersistenceDecisionService.THRESHOLDS.temperature) {
      return true;
    }
    if (Math.abs(current.humidity - previous.humidity) >= MqttPersistenceDecisionService.THRESHOLDS.humidity) {
      return true;
    }
    if (Math.abs(current.pressure - previous.pressure) >= MqttPersistenceDecisionService.THRESHOLDS.pressure) {
      return true;
    }

    // Electrical measurements
    if (Math.abs(current.voltage - previous.voltage) >= MqttPersistenceDecisionService.THRESHOLDS.voltage) {
      return true;
    }

    const currentA = current.current_mA / 1000;
    const previousA = previous.current_mA / 1000;
    if (Math.abs(currentA - previousA) >= MqttPersistenceDecisionService.THRESHOLDS.current) {
      return true;
    }

    const currentW = current.power_mW / 1000;
    const previousW = previous.power_mW / 1000;
    if (Math.abs(currentW - previousW) >= MqttPersistenceDecisionService.THRESHOLDS.power) {
      return true;
    }

    // Digital state changes
    if (current.rain !== previous.rain) {
      return true;
    }

    return false;
  }

  /**
   * Record the last persisted data and timestamp
   */
  private recordPersistance(data: SensorPayload): void {
    this.lastPersisted = {
      timestamp: Date.now(),
      data: { ...data },
    };
  }

  /**
   * Reset persistence tracking (useful for testing)
   */
  reset(): void {
    this.lastPersisted = null;
  }

  /**
   * Get threshold configuration (for monitoring/debugging)
   */
  getThresholds() {
    return { ...MqttPersistenceDecisionService.THRESHOLDS };
  }

  /**
   * Get heartbeat interval (for monitoring/debugging)
   */
  getHeartbeatMs(): number {
    return MqttPersistenceDecisionService.HEARTBEAT_MS;
  }
}
