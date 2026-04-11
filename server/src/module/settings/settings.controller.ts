import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  UpdateNotificationSettingsDto,
  UpdateSystemSettingsDto,
} from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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

  @Get('notifications')
  async getNotificationSettings(@Request() req) {
    const settings = await this.settingsService.getNotificationSettings(
      req.user.id,
    );

    return {
      success: true,
      data: settings,
    };
  }

  @Patch('notifications')
  async updateNotificationSettings(
    @Request() req,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    const settings = await this.settingsService.updateNotificationSettings(
      req.user.id,
      dto,
    );

    return {
      success: true,
      message: 'Notification settings updated successfully',
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

  @Post('toggle/rain-protection')
  async toggleRainProtection() {
    const settings = await this.settingsService.toggleRainProtection();
    return {
      success: true,
      message: `Rain protection ${settings.autoRainProtection ? 'enabled' : 'disabled'}`,
      data: settings,
    };
  }
}
