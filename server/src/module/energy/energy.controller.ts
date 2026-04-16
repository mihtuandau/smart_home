import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { EnergyService } from './energy.service';

@Controller('energy')
export class EnergyController {
  constructor(private energyService: EnergyService) {}

  @Get('stats')
  async getEnergyStats(
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24,
    @Query('mode') mode?: 'auto' | 'raw' | 'avg',
  ) {
    const data = await this.energyService.getEnergyStats(hours, mode);
    return {
      success: true,
      period: `${hours}h`,
      count: data.length,
      data,
    };
  }

  @Get('stats-paginated')
  async getEnergyStatsPaginated(
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize: number = 500,
    @Query('mode') mode?: 'auto' | 'raw' | 'avg',
  ) {
    const result = await this.energyService.getEnergyStatsPaginated(hours, page, pageSize, mode);
    return {
      success: true,
      period: `${hours}h`,
      ...result,
    };
  }

  @Get('latest')
  async getLatestStatus() {
    const data = await this.energyService.getLatestStatus();
    return {
      success: true,
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

  @Get("summary")
  async getEnergySummary() {
    const data = await this.energyService.getEnergySummary();
    return {
      success: true,
      data,
    };
  }
}
