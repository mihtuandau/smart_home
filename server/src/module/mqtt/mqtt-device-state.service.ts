import { Injectable, Logger } from '@nestjs/common';
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
export class MqttDeviceStateService {
  private readonly logger = new Logger(MqttDeviceStateService.name);
  private lastLedState: { led1?: boolean; led2?: boolean } = {};

  constructor(private prisma: PrismaService) {}

  async updateDeviceStatesIfChanged(data: SensorPayload): Promise<void> {
    try {
      if (this.lastLedState.led1 !== data.led1) {
        await this.updateLedDevice('LED1', data.led1);
        this.lastLedState.led1 = data.led1;
      }

      if (this.lastLedState.led2 !== data.led2) {
        await this.updateLedDevice('LED2', data.led2);
        this.lastLedState.led2 = data.led2;
      }
    } catch (error) {
      this.logger.error(`Failed to update device states: ${error.message}`);
    }
  }

  private async updateLedDevice(
    ledName: string,
    state: boolean,
  ): Promise<void> {
    const led = await this.prisma.device.findFirst({
      where: { name: ledName },
    });

    if (led) {
      await this.prisma.device.update({
        where: { id: led.id },
        data: {
          status: state ? 'ON' : 'OFF',
          value: state ? 100 : 0,
          lastActive: new Date(),
        },
      });
      this.logger.debug(`Updated ${ledName} to ${state ? 'ON' : 'OFF'}`);
    }
  }

  getLastLedState(): { led1?: boolean; led2?: boolean } {
    return this.lastLedState;
  }
}
