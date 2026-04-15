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
import { NotificationEmailService } from '../settings/notification-email.service';
import { SettingsService } from '../settings/settings.service';

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

type DeviceStateKey = 'led1' | 'led2' | 'device1' | 'device2';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private mqttClient: mqtt.MqttClient;
  private latestData: SensorPayload | null = null;
  private rawDeviceData: Record<string, any> = {}; // Store raw device objects from MQTT
  private commandService: MqttCommandService;
  private mqttDisconnectedNotified = false;
  private lastRealtimeMessageAt: number = Date.now();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private readonly staleDataAlertMs =
    Number(process.env.MQTT_STALE_ALERT_SECONDS || 90) * 1000;
  private readonly energyAlertDeltaW = Number(process.env.ENERGY_ALERT_DELTA_W || 0);
  private readonly deviceStateChangeEmailEnabled =
    process.env.DEVICE_STATE_CHANGE_EMAIL_ENABLED === 'true';

  constructor(
    private persistenceService: MqttPersistenceService,
    private deviceStateService: MqttDeviceStateService,
    private aiService: AiService,
    private notificationEmailService: NotificationEmailService,
    private settingsService: SettingsService,
  ) {}

  private async checkRealtimeEnergyAlert(data: SensorPayload) {
    const currentPowerW = Number((data.power_mW || 0) / 1000);
    if (currentPowerW <= 0) {
      return;
    }

    // Default threshold since SystemSettings no longer has maxPowerConsumption
    const triggerThreshold = 100 + this.energyAlertDeltaW; 

    if (currentPowerW <= triggerThreshold) {
      return;
    }

    const result = await this.notificationEmailService.sendEnergyThresholdAlert({
      currentPower: currentPowerW,
      thresholdPower: triggerThreshold,
      measuredAt: new Date(),
    });

    if (result.sent > 0) {
      this.logger.warn(
        `Realtime energy threshold exceeded (${currentPowerW.toFixed(2)}W > ${triggerThreshold.toFixed(2)}W). Sent ${result.sent} alert email(s).`,
      );
    }
  }

  private normalizeIncomingPayload(raw: Record<string, unknown>): SensorPayload {
    // Maps ESP32 keys (temp, humi, pres, voltage, current, power, rain) to our interface
    const temp = Number(raw.temp ?? raw.temperature ?? 0);
    const humi = Number(raw.humi ?? raw.humidity ?? 0);
    const pres = Number(raw.pres ?? raw.pressure ?? 0);
    const volt = Number(raw.voltage ?? 0);
    const current_mA = Number(raw.current ?? raw.current_mA ?? 0);
    const power_mW = Number(raw.power ?? raw.power_mW ?? 0);
    const rain = Boolean(raw.rain ?? raw.isRaining ?? false);

    // Handle device1/device2 if they are objects
    const device1State = typeof raw.device1 === 'object' && raw.device1 !== null && 'state' in raw.device1 
      ? (raw.device1 as any).state : raw.device1;
    const device2State = typeof raw.device2 === 'object' && raw.device2 !== null && 'state' in raw.device2 
      ? (raw.device2 as any).state : raw.device2;

    return {
      temperature: temp,
      humidity: humi,
      pressure: pres,
      voltage: volt,
      current_mA,
      power_mW,
      rain,
      led1: Boolean(raw.led1),
      led2: Boolean(raw.led2),
      device1: typeof device1State === 'boolean' ? device1State : undefined,
      device2: typeof device2State === 'boolean' ? device2State : undefined,
    };
  }

  private async sendImmediateMqttDisconnectAlert(reason: string) {
    if (this.mqttDisconnectedNotified) {
      return;
    }

    this.mqttDisconnectedNotified = true;

    try {
      const systemResult = await this.notificationEmailService.sendSystemAnomalyAlert({
        issues: [`MQTT broker disconnected (${reason}). Realtime data stream is interrupted.`],
        detectedAt: new Date(),
      });

      const deviceResult = await this.notificationEmailService.sendDeviceOfflineAlert({
        deviceNames: ['MQTT-controlled devices'],
        offlineMinutes: 0,
        detectedAt: new Date(),
      });

      if (systemResult.sent > 0 || deviceResult.sent > 0) {
        this.logger.warn(
          `Sent immediate MQTT disconnect alerts: system=${systemResult.sent}, device=${deviceResult.sent}.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send MQTT disconnect alert email: ${error.message}`,
      );
    }
  }

  async onModuleInit() {
    this.connectMqtt();
    this.startRealtimeHealthCheck();
  }

  async onModuleDestroy() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.mqttClient) {
      this.mqttClient.end();
      this.logger.log('MQTT client disconnected');
    }
  }

  private startRealtimeHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      const now = Date.now();
      const staleMs = now - this.lastRealtimeMessageAt;

      if (!this.isConnected()) {
        return;
      }

      if (staleMs < this.staleDataAlertMs) {
        return;
      }

      void this.sendImmediateMqttDisconnectAlert(
        `no realtime data for ${(staleMs / 1000).toFixed(0)}s`,
      );
    }, 15 * 1000);
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

      if (this.mqttDisconnectedNotified) {
        void this.notificationEmailService
          .sendSystemRecoveryAlert({
            message: 'Broker MQTT đã hoạt động trở lại sau khi gián đoạn.',
            recoveredAt: new Date(),
          })
          .then((result) => {
            if (result.sent > 0) {
              this.logger.warn(
                `Sent ${result.sent} MQTT recovery alert email(s).`,
              );
            }
          })
          .catch((error) => {
            this.logger.error(
              `Failed to send MQTT recovery alert email: ${error.message}`,
            );
          });
      }

      this.mqttDisconnectedNotified = false;
      this.lastRealtimeMessageAt = Date.now();
      this.subscribeToTopics();
    });

    this.mqttClient.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.mqttClient.on('error', (error) => {
      this.logger.error(`MQTT Error: ${error.message}`);
      void this.sendImmediateMqttDisconnectAlert(`error: ${error.message}`);
    });

    this.mqttClient.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.mqttClient.on('offline', () => {
      this.logger.warn('MQTT client offline');
      void this.sendImmediateMqttDisconnectAlert('offline event');
    });

    this.mqttClient.on('close', () => {
      this.logger.warn('MQTT connection closed');
      void this.sendImmediateMqttDisconnectAlert('connection closed');
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
        const rawData = JSON.parse(message) as Record<string, unknown>;
        const data = this.normalizeIncomingPayload(rawData);
        const prev = this.latestData ?? ({} as SensorPayload);
        const mergedData: SensorPayload = {
          ...prev,
          ...data,
        };
        if (!('device1' in rawData)) delete (mergedData as any).device1;
        if (!('device2' in rawData)) delete (mergedData as any).device2;
        
        // Store raw device objects
        if ('device1' in rawData && typeof rawData.device1 === 'object') {
          this.rawDeviceData.device1 = rawData.device1;
        } else {
          delete this.rawDeviceData.device1;
        }
        if ('device2' in rawData && typeof rawData.device2 === 'object') {
          this.rawDeviceData.device2 = rawData.device2;
        } else {
          delete this.rawDeviceData.device2;
        }
        
        this.latestData = mergedData;
        this.lastRealtimeMessageAt = Date.now();
        this.mqttDisconnectedNotified = false;

        const changedStates: string[] = [];
        const stateKeys: DeviceStateKey[] = ['led1', 'led2', 'device1', 'device2'];
        for (const key of stateKeys) {
          const prevValue = prev[key];
          const nextValue = mergedData[key];

          if (
            typeof prevValue === 'boolean' &&
            typeof nextValue === 'boolean' &&
            prevValue !== nextValue
          ) {
            changedStates.push(`${key.toUpperCase()}: ${prevValue ? 'ON' : 'OFF'} -> ${nextValue ? 'ON' : 'OFF'}`);
          }
        }

        if (this.deviceStateChangeEmailEnabled && changedStates.length > 0) {
          const result =
            await this.notificationEmailService.sendDeviceStateChangeAlert({
              changes: changedStates,
              detectedAt: new Date(),
            });

          if (result.sent > 0) {
            this.logger.warn(
              `Sent ${result.sent} device state-change alert email(s).`,
            );
          }
        }

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
    try {
      await this.persistenceService.saveSensorData(data);
      await this.persistenceService.savePowerData(data);
      this.logger.log(' Data saved to database successfully');
    } catch (error) {
      this.logger.error(`Failed to persist data: ${error.message}`);
    }

    await this.deviceStateService.updateDeviceStatesIfChanged(data);

    await this.checkRealtimeEnergyAlert(data);

    try {
      await this.aiService.analyze(data);
    } catch (aiErr) {
      this.logger.debug(`AI analysis error: ${aiErr.message}`);
    }
  }

  getLatestData(): SensorPayload | null {
    return this.latestData;
  }

  getRawDeviceData(): Record<string, any> {
    return this.rawDeviceData;
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
