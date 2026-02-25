/**
 * ai.service.ts
 *
 * Orchestrator — tương đương on_message() trong ai_mqtt.py.
 * Được gọi bởi MqttService sau mỗi tin nhắn IoT nhận được.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AiAnalyzerService } from './ai-analyzer.service';
import { AiAdvisorService } from './ai-advisor.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiBillingService } from './ai-billing.service';
import { AiResultDto } from './dto/ai-result.dto';
import { SensorPayload } from '../mqtt/mqtt.service';

/** Billing chỉ tính mỗi N tin nhắn để không query DB quá nhiều */
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
  ) {}

  /**
   * Điểm vào chính — gọi sau mỗi MQTT message.
   * Tương đương toàn bộ thân hàm on_message() trong ai_mqtt.py.
   */
  async analyze(data: SensorPayload): Promise<AiResultDto> {
    this.messageCount++;
    const now = new Date();
    const powerMw = data.power_mW;

    // 1. Cập nhật baseline (tương đương enqueue_update_with_row)
    this.baseline.updateWithReading(data.power_mW / 1000, now);

    // 2. Phân tích realtime (tương đương analyze_realtime)
    const analysis = this.analyzer.analyzeRealtime(powerMw, now);

    // 3. Phát hiện bất thường (tương đương detect_anomaly)
    const anomaly = this.analyzer.detectAnomaly(powerMw, data.led1, data.led2);

    // 4. Tổng hợp ngày (tương đương daily_summary)
    const summary = await this.analyzer.getDailySummary();

    // 5. Lời khuyên tiết kiệm điện (tương đương energy_advice)
    const advice = this.advisor.getAdvice({ powerMw, led1: data.led1, led2: data.led2, ts: now });

    // 6. Dự báo hóa đơn (tương đương project_monthly_energy_and_cost — chạy định kỳ)
    let billingDto = this.latestResult?.billing ?? null;
    if (this.messageCount % BILLING_EVERY_N === 1) {
      try {
        billingDto = await this.billing.projectMonthly(now);
      } catch (err) {
        this.logger.warn(`Billing forecast failed: ${err.message}`);
      }
    }

    // 7. Lưu kết quả AI vào DB (tương đương save_ai_result)
    if (anomaly || advice.length > 0) {
      this.saveToDb(data, analysis, anomaly, summary, advice).catch(() => {});
    }

    const result: AiResultDto = {
      time: now.toISOString(),
      analysis,
      anomaly: anomaly ?? null,
      summary,
      advice,
      billing: billingDto,
    };

    this.latestResult = result;

    // Log kết quả (tương đương logger.info/logger.warning trong ai_mqtt.py)
    this.logger.log(analysis);
    if (anomaly) this.logger.warn(anomaly);
    if (advice.length) advice.forEach((a) => this.logger.log(a));

    return result;
  }

  getLatestResult(): AiResultDto | null {
    return this.latestResult;
  }

  private async saveToDb(
    data: SensorPayload,
    analysis: string,
    anomaly: string | null,
    summary: string,
    advice: string[],
  ) {
    try {
      await this.prisma.aiLearningData.create({
        data: {
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
        },
      });
    } catch (err) {
      this.logger.debug(`Failed to persist AI result: ${err.message}`);
    }
  }
}
