import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiBillingService } from './ai-billing.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiLedStatsService } from './ai-led-stats.service';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private billing: AiBillingService,
    private baseline: AiBaselineService,
    private ledStats: AiLedStatsService,
  ) {}

  /** Kết quả AI mới nhất (analysis, anomaly, advice, billing) */
  @Get('status')
  @ApiOperation({ summary: 'Kết quả AI phân tích mới nhất' })
  getStatus() {
    return this.aiService.getLatestResult() ?? { message: 'Chưa có dữ liệu AI' };
  }

  /** Dự báo hóa đơn điện tháng hiện tại */
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

  /** Profile baseline theo (weekday × hour) */
  @Get('baseline')
  @ApiOperation({ summary: 'Profile tiêu thụ điện trung bình theo giờ/ngày' })
  getBaseline() {
    return this.baseline.getProfile();
  }

  /** Lịch sử tiêu thụ LED theo ngày (N ngày gần nhất, bao gồm hôm nay) */
  @Get('led-daily')
  @ApiOperation({ summary: 'Lịch sử tiêu thụ Wh và số phút bật của từng LED' })
  async getLedDaily(@Query('days') days?: string) {
    const n = days ? Math.min(Math.max(parseInt(days, 10) || 7, 1), 90) : 7;
    const history = await this.ledStats.getHistory(n);
    return { days: n, data: history };
  }
}
