/**
 * ai-analyzer.service.ts
 *
 * Tương đương ai_analyzer.py trong AI_SmartHome.
 *
 * - analyze_realtime()  → so sánh công suất hiện tại với baseline / trung bình rolling
 * - detect_anomaly()    → Modified Z-score (thay IsolationForest) — O(1), không cần ML library
 * - daily_summary()     → trung bình công suất ngày hôm nay từ DB
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AiBaselineService } from './ai-baseline.service';

/** Số dòng rolling window để tính Z-score */
const ANOMALY_WINDOW = 500;
/** Ngưỡng Modified Z-score để coi là bất thường */
const ANOMALY_ZSCORE_THRESHOLD = 3.5;
/** Số lần liên tiếp vượt ngưỡng mới cảnh báo (giảm false positive) */
const ANOMALY_PERSIST_COUNT = 2;
/** Số reading tối thiểu bắt đầu phân tích */
const MIN_WINDOW = 3;

@Injectable()
export class AiAnalyzerService {
  private readonly logger = new Logger(AiAnalyzerService.name);

  /** Rolling window lưu (powerMw, led1, led2) gần nhất */
  private window: Array<{ powerMw: number; led1: boolean; led2: boolean }> = [];
  /** Đếm số lần liên tiếp bị coi là anomaly */
  private consecutiveAnomalyCount = 0;
  /** Trạng thái LED của reading mới nhất */
  private latestLed1 = false;
  private latestLed2 = false;
  /** Trạng thái LED reading trước (để phát hiện transition) */
  private prevLed1: boolean | null = null;
  private prevLed2: boolean | null = null;

  constructor(
    private prisma: PrismaService,
    private baseline: AiBaselineService,
  ) {}

  // ── Window feed (gọi trước analyze + detect) ─────────────────────────────────

  /**
   * Cập nhật rolling window — phải gọi TRƯỚC analyzeRealtime và detectAnomaly.
   */
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

  // ── Realtime analysis ────────────────────────────────────────────────────────

  /**
   * Tương đương analyze_realtime().
   * So sánh công suất hiện tại với baseline hoặc trung bình rolling window.
   * Truyền led1/led2 để tránh cảnh báo sai khi đèn đang bật.
   */
  analyzeRealtime(
    powerMw: number,
    led1: boolean,
    led2: boolean,
    ts: Date = new Date(),
  ): string {
    /** Chuyển mW → W, 1 chữ số thập phân */
    const W = (mw: number) => (mw / 1000).toFixed(1);

    if (this.window.length < MIN_WINDOW) {
      return `📊 AI đang làm quen với thiết bị của bạn... (${this.window.length}/${MIN_WINDOW})`;
    }

    const ledsOn = led1 || led2;
    const ledLabel = led1 && led2 ? 'Đèn 1 + Đèn 2' : led1 ? 'Đèn 1' : led2 ? 'Đèn 2' : 'Tất cả đèn';

    // Phát hiện transition: LED vừa thay đổi trong reading này
    const ledJustChanged =
      this.prevLed1 !== null &&
      (this.prevLed1 !== led1 || this.prevLed2 !== led2);

    if (ledJustChanged) {
      const prevLedsOn = this.prevLed1 || (this.prevLed2 ?? false);
      // Tính công suất trung bình trước khi đèn thay đổi (trạng thái cũ)
      const prevStateWindow = this.window.slice(0, -1).filter(
        (r) => r.led1 === this.prevLed1 && r.led2 === this.prevLed2,
      );
      const prevAvg = prevStateWindow.length >= 2
        ? prevStateWindow.reduce((s, r) => s + r.powerMw, 0) / prevStateWindow.length
        : this.window[this.window.length - 2]?.powerMw ?? powerMw;
      const delta = Math.abs(Math.round(powerMw - prevAvg));
      if (!prevLedsOn && ledsOn) {
        return `💡 ${ledLabel} vừa bật — điện tăng thêm ${W(delta)} W (đang dùng: ${W(powerMw)} W)`;
      } else if (prevLedsOn && !ledsOn) {
        return `🌙 Đèn vừa tắt — điện giảm ${W(delta)} W (điện chờ hiện tại: ${W(powerMw)} W)`;
      } else {
        return `🔄 ${ledLabel} thay đổi — điện tiêu thụ hiện tại: ${W(powerMw)} W`;
      }
    }

    // Trạng thái ổn định: so sánh với rolling window cùng trạng thái đèn
    const sameStateWindow = this.window.filter(
      (r) => r.led1 === led1 && r.led2 === led2,
    );

    if (sameStateWindow.length >= 5) {
      const avgMw =
        sameStateWindow.reduce((s, r) => s + r.powerMw, 0) /
        sameStateWindow.length;
      if (powerMw > avgMw * 1.5) {
        const pct = Math.round((powerMw / avgMw - 1) * 100);
        return `⚠️ Điện cao hơn mức thường ${pct}% — nên kiểm tra xem có thiết bị nào bật quên không`;
      }
      return ledsOn
        ? `✅ ${ledLabel} đang bật — mức điện bình thường (${W(powerMw)} W)`
        : `✅ Đèn đã tắt hết — điện tiêu thụ thấp, bình thường (${W(powerMw)} W)`;
    }

    // Fallback: rolling average toàn bộ
    const avgMw = this.window.reduce((s, r) => s + r.powerMw, 0) / this.window.length;
    if (!ledsOn && powerMw > avgMw * 1.4) {
      return `⚠️ Điện vẫn cao dù đèn đã tắt (${W(powerMw)} W) — có thiết bị nào đang bật không?`;
    }

    return ledsOn
      ? `✅ ${ledLabel} đang bật — điện tiêu thụ ${W(powerMw)} W`
      : `✅ Đèn đã tắt — điện tiêu thụ thấp (${W(powerMw)} W)`;
  }

  // ── Anomaly detection ────────────────────────────────────────────────────────

  /**
   * Tương đương detect_anomaly() với IsolationForest.
   * Dùng Modified Z-score (Median Absolute Deviation) — robust với outliers.
   *
   * Ưu điểm so với IsolationForest: O(1) per message, không cần retrain.
   */
  detectAnomaly(
    powerMw: number,
    led1: boolean,
    led2: boolean,
  ): string | null {
    // Window đã được cập nhật bởi feedReading() trước đó
    if (this.window.length < 30) return null;

    // Suppress nếu LED vừa thay đổi trạng thái (expected power change)
    if (this.window.length >= 2) {
      const prev = this.window[this.window.length - 2];
      if (prev.led1 !== led1 || prev.led2 !== led2) {
        this.consecutiveAnomalyCount = 0;
        return null;
      }
    }

    // Modified Z-score: dùng median và MAD thay vì mean/std
    const powers = this.window.map((r) => r.powerMw).sort((a, b) => a - b);
    const median = this.median(powers);
    const deviations = powers.map((p) => Math.abs(p - median));
    const mad = this.median(deviations.sort((a, b) => a - b));

    // MAD = 0 → tất cả giá trị bằng nhau → không anomaly
    if (mad === 0) {
      this.consecutiveAnomalyCount = 0;
      return null;
    }

    // Modified Z-score = 0.6745 * (x - median) / MAD
    const mzscore = (0.6745 * Math.abs(powerMw - median)) / mad;

    if (mzscore > ANOMALY_ZSCORE_THRESHOLD) {
      this.consecutiveAnomalyCount++;
    } else {
      this.consecutiveAnomalyCount = 0;
    }

    if (this.consecutiveAnomalyCount >= ANOMALY_PERSIST_COUNT) {
      return '🚨 Điện tiêu thụ đột ngột bất thường — vui lòng kiểm tra thiết bị trong nhà';
    }

    return null;
  }

  // ── Daily summary ─────────────────────────────────────────────────────────────

  /**
   * Tương đương daily_summary().
   * Tổng hợp trung bình công suất hôm nay từ DB power_data.
   */
  async getDailySummary(): Promise<string> {
    try {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const rows = await this.prisma.powerData.findMany({
        where: { timestamp: { gte: startOfDay } },
        select: { power: true },
      });

      if (rows.length === 0) {
        return '📅 Không có dữ liệu hôm nay để tổng hợp';
      }

      const avgW = rows.reduce((s, r) => s + r.power, 0) / rows.length;
      return `📅 Điện tiêu thụ trung bình hôm nay: ${avgW.toFixed(1)} W`;
    } catch (err) {
      this.logger.error(`Daily summary error: ${err.message}`);
      return '📅 Không thể tổng hợp dữ liệu';
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private median(sortedArr: number[]): number {
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0
      ? sortedArr[mid]
      : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  }
}
