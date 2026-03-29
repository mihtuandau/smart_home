import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiBillingService } from './ai-billing.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiLedStatsService } from './ai-led-stats.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private billing: AiBillingService,
    private baseline: AiBaselineService,
    private ledStats: AiLedStatsService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Kết quả AI phân tích mới nhất' })
  getStatus() {
    return (
      this.aiService.getLatestResult() ?? { message: 'Chưa có dữ liệu AI' }
    );
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Dự báo kWh và chi phí tháng hiện tại' })
  async getForecast(@Query('price') price?: string) {
    const priceVnd = price ? parseFloat(price) : undefined;
    const result = await this.billing.projectMonthly(new Date(), priceVnd);
    return {
      ...result,
      report: this.billing.formatReport(result),
    };
  }

  @Get('baseline')
  @ApiOperation({ summary: 'Profile tiêu thụ điện trung bình theo giờ/ngày' })
  getBaseline() {
    return this.baseline.getProfile();
  }

  @Get('led-daily')
  @ApiOperation({ summary: 'Lịch sử tiêu thụ Wh và số phút bật của từng LED' })
  async getLedDaily(@Query('days') days?: string) {
    const n = days ? Math.min(Math.max(parseInt(days, 10) || 7, 1), 90) : 7;
    const history = await this.ledStats.getHistory(n);
    return { days: n, data: history };
  }
}
