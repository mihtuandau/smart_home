import { Controller, Get, Patch, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSystemSettingsDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Patch()
  async updateSettings(@Body() dto: UpdateSystemSettingsDto) {
    const settings = await this.settingsService.updateSettings(dto);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    };
  }

  @Post('reset')
  async resetToDefaults() {
    const settings = await this.settingsService.resetToDefaults();
    return {
      success: true,
      message: 'Settings reset to defaults',
      data: settings,
    };
  }

  @Post('toggle/auto-light')
  async toggleAutoLight() {
    const settings = await this.settingsService.toggleAutoLight();
    return {
      success: true,
      message: `Auto light ${settings.autoLightEnabled ? 'enabled' : 'disabled'}`,
      data: settings,
    };
  }

  @Post('toggle/rain-protection')
  async toggleRainProtection() {
    const settings = await this.settingsService.toggleRainProtection();
    return {
      success: true,
      message: `Rain protection ${settings.autoRainProtection ? 'enabled' : 'disabled'}`,
      data: settings,
    };
  }

  @Post('toggle/power-save')
  async togglePowerSave() {
    const settings = await this.settingsService.togglePowerSave();
    return {
      success: true,
      message: `Power save mode ${settings.powerSaveMode ? 'enabled' : 'disabled'}`,
      data: settings,
    };
  }

  @Post('toggle/ai-learning')
  async toggleAiLearning() {
    const settings = await this.settingsService.toggleAiLearning();
    return {
      success: true,
      message: `AI learning ${settings.aiLearningEnabled ? 'enabled' : 'disabled'}`,
      data: settings,
    };
  }
}
