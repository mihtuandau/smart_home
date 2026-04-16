import { Controller, Post } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Post('backfill-aggregations')
  async backfillAggregations() {
    await this.maintenanceService.backfillHistoricalAggregations();
    return { success: true, message: 'Backfill triggered' };
  }
}

