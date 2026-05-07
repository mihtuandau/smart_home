import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AiAnalyzerService } from './ai-analyzer.service';
import { AiAdvisorService } from './ai-advisor.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiBillingService } from './ai-billing.service';
import { AiLedStatsService } from './ai-led-stats.service';
import { RainForecastOptimizerService } from './rain-forecast-optimizer.service';
import { AiResultDto } from './dto/ai-result.dto';
import { SensorPayload } from '../mqtt/mqtt.service';
import { AiEventsGateway } from '../mqtt/ai-events.gateway';

const BILLING_EVERY_N = 100;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private messageCount = 0;
  private latestResult: AiResultDto | null = null;

  constructor(
    private prisma: PrismaService,
    private analyzer: AiAnalyzerService,
    private advisor: AiAdvisorService,
    private baseline: AiBaselineService,
    private billing: AiBillingService,
    private ledStats: AiLedStatsService,
    private rainForecast: RainForecastOptimizerService,
    @Inject(forwardRef(() => AiEventsGateway))
    private aiEventsGateway: AiEventsGateway,
  ) {}

  async analyze(data: SensorPayload): Promise<AiResultDto> {
    this.messageCount++;
    const now = new Date();
    const powerMw = data.power_mW;

    // Cập nhật dữ liệu cảm biến cho rain forecast optimizer (chỉ để dự báo, không tự động hóa)
    try {
      await this.rainForecast.addSensorReading(data);
    } catch (err) {
      this.logger.warn(
        `Failed to update rain forecast with sensor data: ${err.message}`,
      );
    }

    // Fetch system settings
    const settings = await this.prisma.systemSettings.findFirst();

    const dailyLed = this.ledStats.tick(data.led1, data.led2, now);

    this.baseline.updateWithReading(
      data.power_mW / 1000,
      now,
      data.led1,
      data.led2,
    );

    this.analyzer.feedReading(powerMw, data.led1, data.led2);

    // INTERNAL ADVISOR DISABLED: Using Python AI for analysis & advice
    const analysis = this.latestResult?.analysis || 'Đang chờ phân tích từ AI...';
    const anomaly = this.latestResult?.anomaly || null;
    const summary = this.latestResult?.summary || '';
    const advice = this.latestResult?.advice || [];

    let billingDto = this.latestResult?.billing ?? null;
    if (this.messageCount % BILLING_EVERY_N === 1) {
      try {
        billingDto = await this.billing.projectMonthly(
          now,
          settings?.energyPriceKwh ?? 2500,
        );
      } catch (err) {
        this.logger.warn(`Billing forecast failed: ${err.message}`);
      }
    }

    const isAlert = advice.length > 0 || !!anomaly;

    // Cập nhật thông số kỹ thuật (Watt, LED) nhưng giữ nguyên lời khuyên từ Python
    const result: AiResultDto = {
      time: now.toISOString(),
      analysis: analysis,
      anomaly: anomaly,
      summary: summary,
      advice: advice,
      billing: billingDto,
      dailyLed,
      powerW: powerMw / 1000,
      led1: data.led1,
      led2: data.led2,
      type: isAlert ? 'alert' : 'status',
    };

    this.latestResult = result;

    this.logger.log(analysis);
    if (anomaly) this.logger.warn(anomaly);
    if (advice.length) advice.forEach((a) => this.logger.log(a));

    // Lưu snapshot định kỳ hoặc khi có bất thường để tránh bloat DB
    if (anomaly || this.messageCount % 100 === 1) {
      try {
        await this.prisma.aiLearningData.create({
          data: {
            date: new Date().toISOString().split('T')[0],
            feature: anomaly ? 'anomaly_detection' : 'energy_monitoring',
            inputData: {
              power_mW: data.power_mW,
              current_mA: data.current_mA,
              voltage: data.voltage,
              led1: data.led1,
              led2: data.led2,
            },
            outputData: { analysis, anomaly, summary, advice },
            accuracy: null,
            // Snapshot thông thường hết hạn sau 1 ngày, Anomaly giữ lại 7 ngày
            expiresAt: anomaly
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to save AI learning data: ${err.message}`);
      }
    }

    // Broadcast to UI via Socket (ĐÃ TẮT ĐỂ TRÁNH SPAM - CHỈ DÙNG AI TỪ PYTHON)
    // this.logger.log(`[AI Broadcast - DISABLED] adviceCount=${advice.length}, type=${isAlert ? 'ALERT' : 'STATUS'}`);
    /*
    this.aiEventsGateway.emitAiAdvice({
      time: now.toISOString(),
      advice,
      anomaly: anomaly ?? null,
      analysis,
      type: isAlert ? 'alert' : 'status',
      powerW: powerMw / 1000,
      led1: data.led1,
      led2: data.led2,
      dailyLed,
    });
    */

    // Phát ngay dữ liệu LED
    const history = await this.ledStats.getHistory(7);
    this.aiEventsGateway.emitLedStats(dailyLed, history);

    return result;
  }

  getLatestResult(): AiResultDto | null {
    if (!this.latestResult) {
      return {
        time: new Date().toISOString(),
        analysis: 'Hệ thống AI đang theo dõi dữ liệu cảm biến...',
        advice: [],
        anomaly: null,
        summary: '',
        powerW: 0,
        led1: false,
        led2: false,
        dailyLed: {} as any,
        billing: null,
        type: 'status',
      };
    }
    return this.latestResult;
  }
}
