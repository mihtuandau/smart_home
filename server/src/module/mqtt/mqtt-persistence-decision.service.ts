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

@Injectable()
export class MqttPersistenceDecisionService {
  private lastPersisted: { timestamp: number; data: SensorPayload } | null =
    null;

  private static readonly HEARTBEAT_MS = 10 * 60 * 1000;
  private static readonly THRESHOLDS = {
    temperature: 0.5,
    humidity: 5.0,
    pressure: 10,
    voltage: 0.1,
    current: 0.05,
    power: 0.2,
  };

  shouldPersist(data: SensorPayload): boolean {
    if (!this.lastPersisted) {
      this.recordPersistance(data);
      return true;
    }

    const now = Date.now();

    if (
      now - this.lastPersisted.timestamp >=
      MqttPersistenceDecisionService.HEARTBEAT_MS
    ) {
      this.recordPersistance(data);
      return true;
    }

    if (this.hasSignificantChange(data, this.lastPersisted.data)) {
      this.recordPersistance(data);
      return true;
    }

    return false;
  }

  private hasSignificantChange(
    current: SensorPayload,
    previous: SensorPayload,
  ): boolean {
    if (
      Math.abs(current.temperature - previous.temperature) >=
      MqttPersistenceDecisionService.THRESHOLDS.temperature
    ) {
      return true;
    }
    if (
      Math.abs(current.humidity - previous.humidity) >=
      MqttPersistenceDecisionService.THRESHOLDS.humidity
    ) {
      return true;
    }
    if (
      Math.abs(current.pressure - previous.pressure) >=
      MqttPersistenceDecisionService.THRESHOLDS.pressure
    ) {
      return true;
    }

    if (
      Math.abs(current.voltage - previous.voltage) >=
      MqttPersistenceDecisionService.THRESHOLDS.voltage
    ) {
      return true;
    }

    const currentA = current.current_mA / 1000;
    const previousA = previous.current_mA / 1000;
    if (
      Math.abs(currentA - previousA) >=
      MqttPersistenceDecisionService.THRESHOLDS.current
    ) {
      return true;
    }

    const currentW = current.power_mW / 1000;
    const previousW = previous.power_mW / 1000;
    if (
      Math.abs(currentW - previousW) >=
      MqttPersistenceDecisionService.THRESHOLDS.power
    ) {
      return true;
    }

    if (current.rain !== previous.rain) {
      return true;
    }

    return false;
  }

  private recordPersistance(data: SensorPayload): void {
    this.lastPersisted = {
      timestamp: Date.now(),
      data: { ...data },
    };
  }

  reset(): void {
    this.lastPersisted = null;
  }

  getThresholds() {
    return { ...MqttPersistenceDecisionService.THRESHOLDS };
  }

  getHeartbeatMs(): number {
    return MqttPersistenceDecisionService.HEARTBEAT_MS;
  }
}
