import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
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
  device1?: boolean;
  device2?: boolean;
}

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

    this.logger.log(' Connecting to MQTT broker...');
    this.logger.log(` URL: ${url}`);
    this.logger.log(` Username: ${MQTT_CONFIG.username}`);
    this.logger.log(` Client ID: ${MQTT_CONFIG.clientId}`);

    this.mqttClient = mqtt.connect(url, {
      clientId: MQTT_CONFIG.clientId,
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      clean: MQTT_CONFIG.clean,
      reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
      connectTimeout: MQTT_CONFIG.connectTimeout,
      rejectUnauthorized: MQTT_CONFIG.rejectUnauthorized,
    });

    this.commandService = new MqttCommandService(this.mqttClient);

    this.mqttClient.on('connect', () => {
      this.logger.log(' Connected to EMQX broker successfully!');
      this.logger.log(
        ` Connection status: ${this.mqttClient.connected ? 'CONNECTED' : 'DISCONNECTED'}`,
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
        this.logger.log(` Subscribed to ${MQTT_TOPICS.DATA_TOPIC}`);
      }
    });
  }

  private async handleMessage(topic: string, payload: Buffer) {
    try {
      const message = payload.toString();
      this.logger.log(` Received message from ${topic}`);
      this.logger.debug(`Data: ${message}`);

      if (topic === MQTT_TOPICS.DATA_TOPIC) {
        const data: SensorPayload = JSON.parse(message);
        const prev = this.latestData ?? ({} as SensorPayload);
        const mergedData: SensorPayload = {
          ...prev,
          ...data,
        };
        if (!('device1' in data)) delete (mergedData as any).device1;
        if (!('device2' in data)) delete (mergedData as any).device2;
        this.latestData = mergedData;

        this.logger.log(
          `️  Temp: ${mergedData.temperature}°C |  Humidity: ${mergedData.humidity}% |  Voltage: ${mergedData.voltage}V`,
        );
        this.logger.log(
          ` LED1: ${mergedData.led1 ? 'ON' : 'OFF'} | LED2: ${mergedData.led2 ? 'ON' : 'OFF'}`,
        );

        await this.processSensorData(mergedData);
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
    }
  }

  private async processSensorData(data: SensorPayload) {
    if (this.persistenceDecision.shouldPersist(data)) {
      try {
        await this.persistenceService.saveSensorData(data);
        await this.persistenceService.savePowerData(data);
        this.logger.log(' Data saved to database successfully');
      } catch (error) {
        this.logger.error(`Failed to persist data: ${error.message}`);
      }
    }

    await this.deviceStateService.updateDeviceStatesIfChanged(data);

    try {
      await this.aiService.analyze(data);
    } catch (aiErr) {
      this.logger.debug(`AI analysis error: ${aiErr.message}`);
    }
  }

  getLatestData(): SensorPayload | null {
    return this.latestData;
  }

  async controlLed(led: 'led1' | 'led2', state: boolean): Promise<void> {
    await this.commandService.controlLed(led, state);
    await this.persistenceService.logActivity(led, state);
  }

  async controlBothLeds(led1State: boolean, led2State: boolean): Promise<void> {
    await this.commandService.controlBothLeds(led1State, led2State);
  }

  async controlServo(angle: number): Promise<void> {
    await this.commandService.controlServo(angle);
  }

  async addIoTDevice(name: string, powerConsumption: number): Promise<void> {
    await this.commandService.addIoTDevice(name, powerConsumption);
  }

  async controlIoTDevice(device1?: boolean, device2?: boolean): Promise<void> {
    await this.commandService.controlIoTDevice(device1, device2);
  }

  async updateIoTDevice(
    deviceIndex: number,
    name?: string,
    powerConsumption?: number,
  ): Promise<void> {
    await this.commandService.updateIoTDevice(
      deviceIndex,
      name,
      powerConsumption,
    );
  }

  async deleteIoTDevice(deviceIndex: number): Promise<void> {
    await this.commandService.deleteIoTDevice(deviceIndex);
  }

  isConnected(): boolean {
    return this.mqttClient?.connected ?? false;
  }
}
