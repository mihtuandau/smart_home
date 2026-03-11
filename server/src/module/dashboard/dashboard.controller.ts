import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    const data = await this.dashboardService.getOverview();
    return {
      success: true,
      data,
    };
  }

  @Get('energy')
  async getEnergyStats(@Query('hours', ParseIntPipe) hours: number = 24) {
    const stats = await this.dashboardService.getEnergyStats(hours);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('health')
  async getSystemHealth() {
    const health = await this.dashboardService.getSystemHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('activities')
  async getRecentActivities(@Query('limit', ParseIntPipe) limit: number = 10) {
    const activities = await this.dashboardService.getRecentActivities(limit);
    return {
      success: true,
      count: activities.length,
      data: activities,
    };
  }
}
