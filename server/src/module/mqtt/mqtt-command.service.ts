import { Injectable, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MQTT_TOPICS } from '../../config/mqtt.config';

/**
 * Handles publishing commands to MQTT broker.
 * Manages LED control, servo control, and IoT device commands.
 * Provides Promise-based wrappers around MQTT publish for better async/await support.
 */
@Injectable()
export class MqttCommandService {
  private readonly logger = new Logger(MqttCommandService.name);

  constructor(private mqttClient: mqtt.MqttClient) {}

  /**
   * Send LED on/off command to broker
   */
  async controlLed(led: 'led1' | 'led2', state: boolean): Promise<void> {
    const command = { [led]: state };
    return this.publishCommand(
      MQTT_TOPICS.CMD_TOPIC,
      command,
      `Command sent: ${led} = ${state}`
    );
  }

  /**
   * Send commands for both LEDs simultaneously
   */
  async controlBothLeds(led1State: boolean, led2State: boolean): Promise<void> {
    const command = {
      led1: led1State,
      led2: led2State,
    };
    return this.publishCommand(
      MQTT_TOPICS.CMD_TOPIC,
      command,
      `Commands sent: LED1=${led1State}, LED2=${led2State}`
    );
  }

  /**
   * Send servo angle command to broker
   */
  async controlServo(angle: number): Promise<void> {
    const command = { servo: angle };
    return this.publishCommand(
      MQTT_TOPICS.CMD_TOPIC,
      command,
      `Servo command sent: angle = ${angle}`
    );
  }

  /**
   * Send command to add new IoT device
   */
  async addIoTDevice(name: string, powerConsumption: number): Promise<void> {
    const command = { name, power_consumption: powerConsumption };
    return this.publishCommand(
      MQTT_TOPICS.CMD_DEVICE_ADD,
      command,
      `Add device: ${name}`
    );
  }

  /**
   * Send control commands for custom IoT devices (device1/device2)
   */
  async controlIoTDevice(device1?: boolean, device2?: boolean): Promise<void> {
    const command: Record<string, boolean> = {};
    if (device1 !== undefined) command.device1 = device1;
    if (device2 !== undefined) command.device2 = device2;

    return this.publishCommand(
      MQTT_TOPICS.CMD_DEVICE_CONTROL,
      command,
      device1 !== undefined && device2 !== undefined
        ? `IoT devices: device1=${device1}, device2=${device2}`
        : device1 !== undefined
          ? `IoT device: device1=${device1}`
          : `IoT device: device2=${device2}`
    );
  }

  /**
   * Send command to update IoT device properties
   */
  async updateIoTDevice(
    deviceIndex: number,
    name?: string,
    powerConsumption?: number
  ): Promise<void> {
    const command: Record<string, any> = { device_index: deviceIndex };
    if (name !== undefined) command.name = name;
    if (powerConsumption !== undefined) command.power_consumption = powerConsumption;

    return this.publishCommand(
      MQTT_TOPICS.CMD_DEVICE_UPDATE,
      command,
      `Update device at index ${deviceIndex}: name=${name || 'unchanged'}, power=${powerConsumption || 'unchanged'}`
    );
  }

  /**
   * Send command to delete IoT device
   */
  async deleteIoTDevice(deviceIndex: number): Promise<void> {
    const command = { device_index: deviceIndex };
    return this.publishCommand(
      MQTT_TOPICS.CMD_DEVICE_DELETE,
      command,
      `Delete device at index ${deviceIndex}`
    );
  }

  /**
   * Internal generic publish method with Promise wrapper
   */
  private publishCommand(
    topic: string,
    command: any,
    logMessage: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mqttClient.publish(
        topic,
        JSON.stringify(command),
        { qos: 1 },
        (error) => {
          if (error) {
            this.logger.error(`Failed to publish to ${topic}: ${error.message}`);
            reject(error);
          } else {
            this.logger.log(logMessage);
            resolve();
          }
        }
      );
    });
  }

  /**
   * Set the MQTT client instance (called after connection)
   */
  setMqttClient(client: mqtt.MqttClient): void {
    if (client) {
      // Allow updating the client if needed for reconnection scenarios
      Object.assign(this.mqttClient, client);
    }
  }
}
