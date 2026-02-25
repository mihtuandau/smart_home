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

@Injectable()
export class AiAnalyzerService {
  private readonly logger = new Logger(AiAnalyzerService.name);

  /** Rolling window lưu (powerMw, led1, led2) gần nhất */
  private window: Array<{ powerMw: number; led1: boolean; led2: boolean }> = [];
  /** Đếm số lần liên tiếp bị coi là anomaly */
  private consecutiveAnomalyCount = 0;

  constructor(
    private prisma: PrismaService,
    private baseline: AiBaselineService,
  ) {}

  // ── Realtime analysis ────────────────────────────────────────────────────────

  /**
   * Tương đương analyze_realtime().
   * So sánh công suất hiện tại với baseline hoặc trung bình rolling window.
   */
  analyzeRealtime(powerMw: number, ts: Date = new Date()): string {
    if (this.window.length < 10) {
      return '📊 AI: Chưa đủ dữ liệu để phân tích';
    }

    // Ưu tiên baseline-aware check
    if (this.baseline.isSignificantDeviation(powerMw, ts, 1.4)) {
      const exp = this.baseline.expectedPowerMw(ts)!;
      const pct = Math.round((powerMw / exp - 1) * 100);
      return `⚠️ AI Cảnh báo: Công suất hiện tại cao hơn baseline khoảng ${pct}%`;
    }

    // Fallback: rolling average
    const avgMw = this.window.reduce((s, r) => s + r.powerMw, 0) / this.window.length;
    if (powerMw > avgMw * 1.4) {
      return '⚠️ AI Cảnh báo: Công suất hiện tại cao bất thường';
    }

    return '✅ AI: Mức tiêu thụ điện ổn định';
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
    // Cập nhật rolling window
    this.window.push({ powerMw, led1, led2 });
    if (this.window.length > ANOMALY_WINDOW) {
      this.window.shift();
    }

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
      return '🚨 AI ML: Phát hiện hành vi tiêu thụ điện bất thường';
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
      const avgMw = avgW * 1000;
      return `📅 Trung bình công suất hôm nay: ${Math.round(avgMw)} mW`;
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
