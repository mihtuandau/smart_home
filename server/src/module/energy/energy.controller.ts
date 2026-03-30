import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { EnergyService } from './energy.service';

@Controller('energy')
export class EnergyController {
  constructor(private energyService: EnergyService) {}

  @Get('stats')
  async getEnergyStats(
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24,
  ) {
    const data = await this.energyService.getEnergyStats(hours);
    return {
      success: true,
      period: `${hours}h`,
      count: data.length,
      data,
    };
  }

  @Get('battery')
  async getBatteryStatus() {
    const data = await this.energyService.getBatteryStatus();
    return {
      success: true,
      data,
    };
  }

  @Get('solar')
  async getSolarStats(
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24,
  ) {
    const data = await this.energyService.getSolarStats(hours);
    return {
      success: true,
      period: `${hours}h`,
      data,
    };
  }

  @Get('sources')
  async getPowerSources(
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24,
  ) {
    const data = await this.energyService.getPowerSourceStats(hours);
    return {
      success: true,
      period: `${hours}h`,
      data,
    };
  }

  @Get('efficiency')
  async getEfficiency(
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24,
  ) {
    const data = await this.energyService.getEfficiencyMetrics(hours);
    return {
      success: true,
      data,
    };
  }
}
