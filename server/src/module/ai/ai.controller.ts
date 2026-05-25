import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiBillingService } from './ai-billing.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiLedStatsService } from './ai-led-stats.service';
import { AiSummaryService } from './ai-summary.service';
import { RainForecastOptimizerService } from './rain-forecast-optimizer.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private billing: AiBillingService,
    private baseline: AiBaselineService,
    private ledStats: AiLedStatsService,
    private aiSummary: AiSummaryService,
    private rainForecast: RainForecastOptimizerService,
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
    let priceVnd = price ? parseFloat(price) : undefined;

    // If no price provided, fetch from system settings
    if (!priceVnd) {
      const settings = await this.prisma.systemSettings.findFirst();
      priceVnd = settings?.energyPriceKwh ?? 2500;
    }

    const result = await this.billing.projectMonthly(new Date(), priceVnd);
    return {
      ...result,
      report: this.billing.formatReport(result),
    };
  }

  @Get('energy-kwh')
  @ApiOperation({
    summary:
      'Tổng điện năng kWh + công suất trung bình theo khoảng thời gian rolling',
  })
  async getEnergyKwh(@Query('hours') hoursStr?: string) {
    const hours = Math.min(
      Math.max(parseFloat(hoursStr ?? '168') || 168, 1),
      8760,
    );
    const { kwh, avgPowerW, sampleCount } =
      await this.billing.computeRollingStats(hours);
    return {
      hours,
      kwh: Math.round(kwh * 10000) / 10000,
      avgPowerW: Math.round(avgPowerW * 100) / 100,
      sampleCount,
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

  @Get('weekly-summary')
  @ApiOperation({ summary: 'Tóm tắt hàng tuần sử dụng GenAI (Gemini)' })
  async getWeeklySummary() {
    // Lấy dữ liệu thật từ database 7 ngày qua
    const history = await this.ledStats.getHistory(7);
    let ledForgotCount = 0;

    for (const day of history) {
      // Nếu đèn bật hơn 300 phút (5 tiếng) thì AI tự học đây là "quên tắt đèn"
      if (day.led1_on_minutes > 300 || day.led2_on_minutes > 300) {
        ledForgotCount++;
      }
    }

    // Tính tổng KWh của 7 ngày qua DỰA TRÊN TOÀN BỘ HỆ THỐNG (thay vì chỉ tính đèn bật)
    // Điều này giúp khớp số liệu với bên Report/Billing
    const { kwh: exactKwh7d } = await this.billing.computeRollingStats(168);
    const totalKwh = Math.round(exactKwh7d * 1000) / 1000;

    // Tính số lần vượt ngưỡng công suất đỉnh (ví dụ > 25W) trong 7 ngày qua
    const peakThresholdMw = 25000;
    const highPeakCount = await this.prisma.powerData.count({
      where: {
        power: { gt: peakThresholdMw },
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const realData = {
      kwhTotal: totalKwh,
      ledForgotCount: ledForgotCount,
      highPeakCount: highPeakCount,
    };

    const summary = await this.aiSummary.generateWeeklySummary(realData);
    return { data: realData, summary };
  }

  @Get('rain-forecast')
  @ApiOperation({
    summary: 'Dự báo mưa tối ưu hóa 48 giờ (kết hợp API + cảm biến địa phương)',
  })
  async getRainForecast(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
    @Query('refresh') refresh?: string,
  ) {
    const latitude = lat ? parseFloat(lat) : undefined;
    const longitude = lon ? parseFloat(lon) : undefined;
    const forceRefresh = refresh === 'true';

    try {
      const report = await this.rainForecast.getCurrentForecast(
        latitude,
        longitude,
        forceRefresh,
      );
      return report;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch rain forecast',
        status: 500,
      };
    }
  }

  @Get('rain-forecast/latest-prob')
  @ApiOperation({ summary: 'Lấy xác suất mưa hiệu chỉnh gần nhất (0-100%)' })
  async getLatestRainProb(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
    @Query('refresh') refresh?: string,
  ) {
    const latitude = lat ? parseFloat(lat) : undefined;
    const longitude = lon ? parseFloat(lon) : undefined;
    const forceRefresh = refresh === 'true';

    try {
      const prob = await this.rainForecast.getLatestAdjustedPop(
        latitude,
        longitude,
        forceRefresh,
      );
      return {
        adjusted_probability: prob !== null ? Math.round(prob * 100) : null,
        unit: 'percent',
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch rain probability',
        status: 500,
      };
    }
  }

  @Post('rain-forecast/clear-cache')
  @ApiOperation({
    summary: 'Xóa cache dự báo mưa để refetch dữ liệu mới từ API',
  })
  async clearRainForecastCache() {
    try {
      await this.rainForecast.clearCache();
      return {
        success: true,
        message:
          'Rain forecast cache cleared. API will fetch fresh data on next request.',
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to clear cache',
        status: 500,
      };
    }
  }
}
