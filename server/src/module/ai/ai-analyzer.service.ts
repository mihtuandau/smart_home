import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AiBaselineService } from './ai-baseline.service';

const ANOMALY_WINDOW = 500;

const ANOMALY_ZSCORE_THRESHOLD = 3.5;

const ANOMALY_PERSIST_COUNT = 2;

const MIN_WINDOW = 3;

@Injectable()
export class AiAnalyzerService {
  private readonly logger = new Logger(AiAnalyzerService.name);

  private window: Array<{ powerMw: number; led1: boolean; led2: boolean }> = [];

  private consecutiveAnomalyCount = 0;

  private latestLed1 = false;
  private latestLed2 = false;

  private prevLed1: boolean | null = null;
  private prevLed2: boolean | null = null;

  constructor(
    private prisma: PrismaService,
    private baseline: AiBaselineService,
  ) {}

  feedReading(powerMw: number, led1: boolean, led2: boolean): void {
    this.prevLed1 = this.latestLed1;
    this.prevLed2 = this.latestLed2;
    this.window.push({ powerMw, led1, led2 });
    if (this.window.length > ANOMALY_WINDOW) {
      this.window.shift();
    }
    this.latestLed1 = led1;
    this.latestLed2 = led2;
  }

  analyzeRealtime(
    powerMw: number,
    led1: boolean,
    led2: boolean,
    ts: Date = new Date(),
  ): string {
    const W = (mw: number) => (mw / 1000).toFixed(1);

    if (this.window.length < MIN_WINDOW) {
      return ` AI đang làm quen với thiết bị của bạn... (${this.window.length}/${MIN_WINDOW})`;
    }

    const ledsOn = led1 || led2;
    const ledLabel =
      led1 && led2
        ? 'Đèn 1 + Đèn 2'
        : led1
          ? 'Đèn 1'
          : led2
            ? 'Đèn 2'
            : 'Tất cả đèn';

    const ledJustChanged =
      this.prevLed1 !== null &&
      (this.prevLed1 !== led1 || this.prevLed2 !== led2);

    if (ledJustChanged) {
      const prevLedsOn = this.prevLed1 || (this.prevLed2 ?? false);
      const prevStateWindow = this.window
        .slice(0, -1)
        .filter((r) => r.led1 === this.prevLed1 && r.led2 === this.prevLed2);
      const prevAvg =
        prevStateWindow.length >= 2
          ? prevStateWindow.reduce((s, r) => s + r.powerMw, 0) /
            prevStateWindow.length
          : (this.window[this.window.length - 2]?.powerMw ?? powerMw);
      const delta = Math.abs(Math.round(powerMw - prevAvg));
      if (!prevLedsOn && ledsOn) {
        return ` ${ledLabel} vừa bật — điện tăng thêm ${W(delta)} W (đang dùng: ${W(powerMw)} W)`;
      } else if (prevLedsOn && !ledsOn) {
        return ` Đèn vừa tắt — điện giảm ${W(delta)} W (điện chờ hiện tại: ${W(powerMw)} W)`;
      } else {
        return ` ${ledLabel} thay đổi — điện tiêu thụ hiện tại: ${W(powerMw)} W`;
      }
    }

    const sameStateWindow = this.window.filter(
      (r) => r.led1 === led1 && r.led2 === led2,
    );

    if (sameStateWindow.length >= 5) {
      const avgMw =
        sameStateWindow.reduce((s, r) => s + r.powerMw, 0) /
        sameStateWindow.length;
      if (powerMw > avgMw * 1.5) {
        const pct = Math.round((powerMw / avgMw - 1) * 100);
        return `️ Điện cao hơn mức thường ${pct}% — nên kiểm tra xem có thiết bị nào bật quên không`;
      }
      return ledsOn
        ? ` ${ledLabel} đang bật — mức điện bình thường (${W(powerMw)} W)`
        : ` Đèn đã tắt hết — điện tiêu thụ thấp, bình thường (${W(powerMw)} W)`;
    }

    const avgMw =
      this.window.reduce((s, r) => s + r.powerMw, 0) / this.window.length;
    if (!ledsOn && powerMw > avgMw * 1.4) {
      return `️ Điện vẫn cao dù đèn đã tắt (${W(powerMw)} W) — có thiết bị nào đang bật không?`;
    }

    return ledsOn
      ? ` ${ledLabel} đang bật — điện tiêu thụ ${W(powerMw)} W`
      : ` Đèn đã tắt — điện tiêu thụ thấp (${W(powerMw)} W)`;
  }

  detectAnomaly(powerMw: number, led1: boolean, led2: boolean): string | null {
    if (this.window.length < 30) return null;

    if (this.window.length >= 2) {
      const prev = this.window[this.window.length - 2];
      if (prev.led1 !== led1 || prev.led2 !== led2) {
        this.consecutiveAnomalyCount = 0;
        return null;
      }
    }

    const powers = this.window.map((r) => r.powerMw).sort((a, b) => a - b);
    const median = this.median(powers);
    const deviations = powers.map((p) => Math.abs(p - median));
    const mad = this.median(deviations.sort((a, b) => a - b));

    if (mad === 0) {
      this.consecutiveAnomalyCount = 0;
      return null;
    }

    const mzscore = (0.6745 * Math.abs(powerMw - median)) / mad;

    if (mzscore > ANOMALY_ZSCORE_THRESHOLD) {
      this.consecutiveAnomalyCount++;
    } else {
      this.consecutiveAnomalyCount = 0;
    }

    if (this.consecutiveAnomalyCount >= ANOMALY_PERSIST_COUNT) {
      return ' Điện tiêu thụ đột ngột bất thường — vui lòng kiểm tra thiết bị trong nhà';
    }

    return null;
  }

  async getDailySummary(): Promise<string> {
    try {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const rows = await this.prisma.powerData.findMany({
        where: { timestamp: { gte: startOfDay } },
        select: { power: true },
      });

      if (rows.length === 0) {
        return ' Không có dữ liệu hôm nay để tổng hợp';
      }

      const avgW = rows.reduce((s, r) => s + r.power, 0) / rows.length;
      return ` Điện tiêu thụ trung bình hôm nay: ${avgW.toFixed(1)} W`;
    } catch (err) {
      this.logger.error(`Daily summary error: ${err.message}`);
      return ' Không thể tổng hợp dữ liệu';
    }
  }

  private median(sortedArr: number[]): number {
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0
      ? sortedArr[mid]
      : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  }
}
