import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { DeviceStatus } from '@prisma/client';

import { SensorPayload } from './mqtt.service';

@Injectable()
export class MqttDeviceStateService {
  private readonly logger = new Logger(MqttDeviceStateService.name);
  private lastStates: Record<string, boolean> = {};

  constructor(private prisma: PrismaService) {}

  async updateDeviceStatesIfChanged(data: SensorPayload): Promise<void> {
    try {
      // Check hardcoded LEDs (Realistic names)
      if (this.lastStates.led1 !== data.led1) {
        await this.updateDeviceInDb('Đèn Phòng Khách', data.led1);
        this.lastStates.led1 = data.led1;
      }
      if (this.lastStates.led2 !== data.led2) {
        await this.updateDeviceInDb('Đèn Ban Công', data.led2);
        this.lastStates.led2 = data.led2;
      }

      // Check dynamic device (Slot 1 -> Pin 13)
      if (data.device1 !== undefined && this.lastStates.device1 !== data.device1) {
        await this.updateDeviceBySlot(0, data.device1);
        this.lastStates.device1 = data.device1;
      }
    } catch (error) {
      this.logger.error(`Failed to update device states: ${error.message}`);
    }
  }

  private async updateDeviceInDb(name: string, state: boolean): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: { name },
    });

    if (device) {
      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          status: state ? DeviceStatus.ON : DeviceStatus.OFF,
          lastActive: new Date(),
        },
      });
      this.logger.debug(`Updated ${name} in DB to ${state ? 'ON' : 'OFF'}`);
    }
  }

  private async updateDeviceBySlot(slotIndex: number, state: boolean): Promise<void> {
    // We assume slot 0 is pin 9001, slot 1 is pin 9002
    const pin = 13 + slotIndex;
    const device = await this.prisma.device.findFirst({
      where: { pin },
    });

    if (device) {
      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          status: state ? DeviceStatus.ON : DeviceStatus.OFF,
          lastActive: new Date(),
        },
      });
      this.logger.debug(`Updated dynamic device at slot ${slotIndex} (pin ${pin}) to ${state ? 'ON' : 'OFF'}`);
    }
  }

  getLastState(): Record<string, boolean> {
    return this.lastStates;
  }
}
