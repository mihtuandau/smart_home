import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiBillingService } from './ai-billing.service';
import { AiBaselineService } from './ai-baseline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private billing: AiBillingService,
    private baseline: AiBaselineService,
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
}
