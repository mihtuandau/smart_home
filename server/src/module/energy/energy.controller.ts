import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { EnergyService } from './energy.service';

@Controller('energy')
export class EnergyController {
  constructor(private energyService: EnergyService) {}

  /**
   * Get energy consumption data
   */
  @Get('stats')
  async getEnergyStats(@Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24) {
    const data = await this.energyService.getEnergyStats(hours);
    return {
      success: true,
      period: `${hours}h`,
      count: data.length,
      data,
    };
  }

  /**
   * Get battery status
   */
  @Get('battery')
  async getBatteryStatus() {
    const data = await this.energyService.getBatteryStatus();
    return {
      success: true,
      data,
    };
  }

  /**
   * Get solar power generation stats
   */
  @Get('solar')
  async getSolarStats(@Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24) {
    const data = await this.energyService.getSolarStats(hours);
    return {
      success: true,
      period: `${hours}h`,
      data,
    };
  }

  /**
   * Get power source breakdown
   */
  @Get('sources')
  async getPowerSources(@Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24) {
    const data = await this.energyService.getPowerSourceStats(hours);
    return {
      success: true,
      period: `${hours}h`,
      data,
    };
  }

  /**
   * Get efficiency metrics
   */
  @Get('efficiency')
  async getEfficiency(@Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24) {
    const data = await this.energyService.getEfficiencyMetrics(hours);
    return {
      success: true,
      data,
    };
  }

  /**
   * Test endpoint: Seed sample power data
   */
  @Get('test/seed')
  async seedTestData() {
    return this.energyService.seedTestPowerData();
  }

  /**
   * Test endpoint: Clean old power data with energy = 0
   */
  @Get('test/cleanup')
  async cleanupOldData() {
    const result = await this.energyService.cleanupZeroEnergyData();
    return {
      success: true,
      message: result,
    };
  }

  /**
   * Test endpoint: Delete all old SOLAR data before fix
   */
  @Get('test/delete-old')
  async deleteOldSolar() {
    const result = await this.energyService.deleteOldSolarData();
    return {
      success: true,
      message: result,
    };
  }
}
