import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MQTT_CONFIG, MQTT_TOPICS } from '../../config/mqtt.config';
import { PrismaService } from '../../common/prisma.service';

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
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private mqttClient: mqtt.MqttClient;
  private latestData: SensorPayload | null = null;

  constructor(private prisma: PrismaService) {}

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

    this.mqttClient.on('connect', () => {
      this.logger.log('✅ Connected to EMQX broker successfully!');
      this.logger.log(`📊 Connection status: ${this.mqttClient.connected ? 'CONNECTED' : 'DISCONNECTED'}`);
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
        
        this.logger.log(`🌡️  Temp: ${data.temperature}°C | 💧 Humidity: ${data.humidity}% | 🔋 Voltage: ${data.voltage}V`);
        this.logger.log(`💡 LED1: ${data.led1 ? 'ON' : 'OFF'} | LED2: ${data.led2 ? 'ON' : 'OFF'}`);

        // Save to database
        await this.saveSensorData(data);
        await this.savePowerData(data);
        await this.updateDeviceStates(data);
        
        this.logger.log('💾 Data saved to database successfully');
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
    }
  }

  private async saveSensorData(data: SensorPayload) {
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
    }
  }

  private async savePowerData(data: SensorPayload) {
    try {
      await this.prisma.powerData.create({
        data: {
          voltage: data.voltage,
          current: data.current_mA / 1000, // Convert mA to A
          power: data.power_mW / 1000, // Convert mW to W
          energy: 0, // Calculate separately if needed
          source: 'BATTERY',
          batteryLevel: null,
        },
      });
      this.logger.debug('Power data saved to database');
    } catch (error) {
      this.logger.error(`Failed to save power data: ${error.message}`);
    }
  }

  private async updateDeviceStates(data: SensorPayload) {
    try {
      // Update LED1
      const led1 = await this.prisma.device.findFirst({
        where: { name: 'LED1' },
      });
      if (led1) {
        await this.prisma.device.update({
          where: { id: led1.id },
          data: {
            status: data.led1 ? 'ON' : 'OFF',
            value: data.led1 ? 100 : 0,
            lastActive: new Date(),
          },
        });
      }

      // Update LED2
      const led2 = await this.prisma.device.findFirst({
        where: { name: 'LED2' },
      });
      if (led2) {
        await this.prisma.device.update({
          where: { id: led2.id },
          data: {
            status: data.led2 ? 'ON' : 'OFF',
            value: data.led2 ? 100 : 0,
            lastActive: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to update device states: ${error.message}`);
    }
  }

  // Public methods for API
  getLatestData(): SensorPayload | null {
    return this.latestData;
  }

  async controlLed(led: 'led1' | 'led2', state: boolean): Promise<void> {
    const command = {
      [led]: state,
    };

    return new Promise((resolve, reject) => {
      this.mqttClient.publish(
        MQTT_TOPICS.CMD_TOPIC,
        JSON.stringify(command),
        { qos: 1 },
        (error) => {
          if (error) {
            this.logger.error(`Failed to publish command: ${error.message}`);
            reject(error);
          } else {
            this.logger.log(`Command sent: ${led} = ${state}`);

            // Log activity
            this.logActivity(led, state);
            resolve();
          }
        },
      );
    });
  }

  async controlBothLeds(led1State: boolean, led2State: boolean): Promise<void> {
    const command = {
      led1: led1State,
      led2: led2State,
    };

    return new Promise((resolve, reject) => {
      this.mqttClient.publish(
        MQTT_TOPICS.CMD_TOPIC,
        JSON.stringify(command),
        { qos: 1 },
        (error) => {
          if (error) {
            this.logger.error(`Failed to publish command: ${error.message}`);
            reject(error);
          } else {
            this.logger.log(`Commands sent: LED1=${led1State}, LED2=${led2State}`);
            resolve();
          }
        },
      );
    });
  }

  private async logActivity(device: string, state: boolean) {
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

  async controlServo(angle: number): Promise<void> {
    const command = {
      servo: angle,
    };

    return new Promise((resolve, reject) => {
      this.mqttClient.publish(
        MQTT_TOPICS.CMD_TOPIC,
        JSON.stringify(command),
        { qos: 1 },
        (error) => {
          if (error) {
            this.logger.error(`Failed to publish servo command: ${error.message}`);
            reject(error);
          } else {
            this.logger.log(`Servo command sent: angle = ${angle}`);
            resolve();
          }
        },
      );
    });
  }

  isConnected(): boolean {
    return this.mqttClient?.connected || false;
  }
}
