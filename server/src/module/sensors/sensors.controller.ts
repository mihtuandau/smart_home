import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { SensorsService } from './sensors.service';

@Controller('sensors')
export class SensorsController {
  constructor(private sensorsService: SensorsService) {}

  @Get('latest')
  async getLatest(@Query('limit', ParseIntPipe) limit: number = 10) {
    const data = await this.sensorsService.getLatest(limit);
    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('current')
  async getCurrentConditions() {
    const data = await this.sensorsService.getCurrentConditions();
    return {
      success: true,
      data,
    };
  }

  @Get('history/:hours')
  async getHistory(
    @Param('hours', ParseIntPipe) hours: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 20,
    @Query('mode') mode?: 'auto' | 'raw' | 'avg',
  ) {
    const result = await this.sensorsService.getHistory(
      hours,
      page,
      pageSize,
      mode,
    );
    return {
      success: true,
      period: `${hours}h`,
      ...result,
    };
  }

  @Get('stats')
  async getStats(
    @Query('hours', ParseIntPipe) hours: number = 24,
    @Query('mode') mode?: 'auto' | 'raw' | 'avg',
  ) {
    const stats = await this.sensorsService.getStats(hours, mode);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('chart/:type')
  async getChartData(
    @Param('type') type: 'temperature' | 'humidity' | 'pressure',
    @Query('hours', ParseIntPipe) hours: number = 24,
  ) {
    const data = await this.sensorsService.getChartData(type, hours);
    return {
      success: true,
      type,
      period: `${hours}h`,
      count: data.length,
      data,
    };
  }
}
