import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MQTT_CONFIG, MQTT_TOPICS } from '../../config/mqtt.config';
import { AiService } from '../ai/ai.service';
import { MqttPersistenceService } from './mqtt-persistence.service';
import { MqttDeviceStateService } from './mqtt-device-state.service';
import { MqttCommandService } from './mqtt-command.service';
import { MqttPersistenceDecisionService } from './mqtt-persistence-decision.service';

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
 * Main MQTT service responsible for:
 * - Connecting to MQTT broker
 * - Receiving sensor data
 * - Orchestrating persistence, device state updates, and commands
 * - Providing access to latest sensor data
 */
@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private mqttClient: mqtt.MqttClient;
  private latestData: SensorPayload | null = null;
  private commandService: MqttCommandService;

  constructor(
    private persistenceService: MqttPersistenceService,
    private deviceStateService: MqttDeviceStateService,
    private persistenceDecision: MqttPersistenceDecisionService,
    private aiService: AiService,
  ) {}

  async onModuleInit() {
    this.connectMqtt();
  }

  async onModuleDestroy() {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.logger.log('MQTT client disconnected');
    }
  }

  private connectMqtt() {
    const url = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;

    this.logger.log('🔄 Connecting to MQTT broker...');
    this.logger.log(`📍 URL: ${url}`);
    this.logger.log(`👤 Username: ${MQTT_CONFIG.username}`);
    this.logger.log(`🆔 Client ID: ${MQTT_CONFIG.clientId}`);

    this.mqttClient = mqtt.connect(url, {
      clientId: MQTT_CONFIG.clientId,
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      clean: MQTT_CONFIG.clean,
      reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
      connectTimeout: MQTT_CONFIG.connectTimeout,
      rejectUnauthorized: MQTT_CONFIG.rejectUnauthorized,
    });

    // Initialize command service after client is created
    this.commandService = new MqttCommandService(this.mqttClient);

    this.mqttClient.on('connect', () => {
      this.logger.log('✅ Connected to EMQX broker successfully!');
      this.logger.log(
        `📊 Connection status: ${this.mqttClient.connected ? 'CONNECTED' : 'DISCONNECTED'}`,
      );
      this.subscribeToTopics();
    });

    this.mqttClient.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.mqttClient.on('error', (error) => {
      this.logger.error(`MQTT Error: ${error.message}`);
    });

    this.mqttClient.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.mqttClient.on('offline', () => {
      this.logger.warn('MQTT client offline');
    });
  }

  private subscribeToTopics() {
    this.mqttClient.subscribe(MQTT_TOPICS.DATA_TOPIC, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${MQTT_TOPICS.DATA_TOPIC}`);
      } else {
        this.logger.log(`📡 Subscribed to ${MQTT_TOPICS.DATA_TOPIC}`);
      }
    });
  }

  private async handleMessage(topic: string, payload: Buffer) {
    try {
      const message = payload.toString();
      this.logger.log(`📨 Received message from ${topic}`);
      this.logger.debug(`Data: ${message}`);

      if (topic === MQTT_TOPICS.DATA_TOPIC) {
        const data: SensorPayload = JSON.parse(message);
        this.latestData = data;

        this.logger.log(
          `🌡️  Temp: ${data.temperature}°C | 💧 Humidity: ${data.humidity}% | 🔋 Voltage: ${data.voltage}V`,
        );
        this.logger.log(
          `💡 LED1: ${data.led1 ? 'ON' : 'OFF'} | LED2: ${data.led2 ? 'ON' : 'OFF'}`,
        );

        // Process sensor data
        await this.processSensorData(data);
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
    }
  }

  /**
   * Main orchestration method for sensor data processing
   */
  private async processSensorData(data: SensorPayload) {
    // Determine if we should persist
    if (this.persistenceDecision.shouldPersist(data)) {
      try {
        await this.persistenceService.saveSensorData(data);
        await this.persistenceService.savePowerData(data);
        this.logger.log('💾 Data saved to database successfully');
      } catch (error) {
        this.logger.error(`Failed to persist data: ${error.message}`);
      }
    }

    // Update device states based on sensor data
    await this.deviceStateService.updateDeviceStatesIfChanged(data);

    // Trigger AI analysis
    try {
      await this.aiService.analyze(data);
    } catch (aiErr) {
      this.logger.debug(`AI analysis error: ${aiErr.message}`);
    }
  }

  // ─ Public API Methods ─

  /**
   * Get latest sensor data from broker
   */
  getLatestData(): SensorPayload | null {
    return this.latestData;
  }

  /**
   * Control single LED
   */
  async controlLed(led: 'led1' | 'led2', state: boolean): Promise<void> {
    await this.commandService.controlLed(led, state);
    // Log activity after successful command
    await this.persistenceService.logActivity(led, state);
  }

  /**
   * Control both LEDs simultaneously
   */
  async controlBothLeds(led1State: boolean, led2State: boolean): Promise<void> {
    await this.commandService.controlBothLeds(led1State, led2State);
  }

  /**
   * Control servo motor angle
   */
  async controlServo(angle: number): Promise<void> {
    await this.commandService.controlServo(angle);
  }

  /**
   * Add new custom IoT device
   */
  async addIoTDevice(name: string, powerConsumption: number): Promise<void> {
    await this.commandService.addIoTDevice(name, powerConsumption);
  }

  /**
   * Control custom IoT devices (device1/device2)
   */
  async controlIoTDevice(device1?: boolean, device2?: boolean): Promise<void> {
    await this.commandService.controlIoTDevice(device1, device2);
  }

  /**
   * Update custom IoT device properties
   */
  async updateIoTDevice(
    deviceIndex: number,
    name?: string,
    powerConsumption?: number
  ): Promise<void> {
    await this.commandService.updateIoTDevice(deviceIndex, name, powerConsumption);
  }

  /**
   * Delete custom IoT device
   */
  async deleteIoTDevice(deviceIndex: number): Promise<void> {
    await this.commandService.deleteIoTDevice(deviceIndex);
  }

  /**
   * Check if MQTT client is connected
   */
  isConnected(): boolean {
    return this.mqttClient?.connected ?? false;
  }
}
