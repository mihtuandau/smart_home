import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateSystemSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private readonly DEFAULT_SETTINGS_ID = 'default';

  async getSettings() {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: this.DEFAULT_SETTINGS_ID },
    });

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: this.DEFAULT_SETTINGS_ID,
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSystemSettingsDto) {
    await this.getSettings();

    return this.prisma.systemSettings.update({
      where: { id: this.DEFAULT_SETTINGS_ID },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async resetToDefaults() {
    return this.prisma.systemSettings.update({
      where: { id: this.DEFAULT_SETTINGS_ID },
      data: {
        autoLightEnabled: true,
        lightOnTime: '18:00',
        lightOffTime: '06:00',
        lightThreshold: 30,
        autoRainProtection: true,
        rainHumidityThreshold: 80,
        powerSaveMode: false,
        maxPowerConsumption: 100,
        aiLearningEnabled: true,
        predictionHorizon: 24,
        updatedAt: new Date(),
      },
    });
  }

  async toggleAutoLight() {
    const settings = await this.getSettings();
    return this.updateSettings({
      autoLightEnabled: !settings.autoLightEnabled,
    });
  }

  async toggleRainProtection() {
    const settings = await this.getSettings();
    return this.updateSettings({
      autoRainProtection: !settings.autoRainProtection,
    });
  }

  async togglePowerSave() {
    const settings = await this.getSettings();
    return this.updateSettings({
      powerSaveMode: !settings.powerSaveMode,
    });
  }

  async toggleAiLearning() {
    const settings = await this.getSettings();
    return this.updateSettings({
      aiLearningEnabled: !settings.aiLearningEnabled,
    });
  }
}
