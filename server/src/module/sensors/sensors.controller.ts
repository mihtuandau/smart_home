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
  async getHistory(@Param('hours', ParseIntPipe) hours: number) {
    const data = await this.sensorsService.getHistory(hours);
    return {
      success: true,
      count: data.length,
      period: `${hours}h`,
      data,
    };
  }

  @Get('stats')
  async getStats(@Query('hours', ParseIntPipe) hours: number = 24) {
    const stats = await this.sensorsService.getStats(hours);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('chart/:type')
  async getChartData(
    @Param('type') type: 'temperature' | 'humidity' | 'pressure' | 'light',
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
