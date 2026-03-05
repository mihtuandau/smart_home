/**
 * ai-led-stats.service.ts
 *
 * Tích lũy thời gian bật và năng lượng tiêu thụ của từng LED theo ngày.
 *
 * - Dùng delta time giữa các MQTT message (tính toán chính xác)
 * - Persist vào DB (AiLearningData) để sống sót sau server restart
 * - Tự flush khi sang ngày mới
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface LedDayEntry {
  date: string; // YYYY-MM-DD (UTC)
  led1_wh: number;
  led2_wh: number;
  led1_on_minutes: number;
  led2_on_minutes: number;
}

/** Công suất từng LED (W) — khớp với Python led_analyzer.py */
export const LED1_POWER_W = 0.5;  // 500 mW
export const LED2_POWER_W = 0.8;  // 800 mW

/** Feature key nhận dạng trong bảng AiLearningData */
const FEATURE_PREFIX = 'led_daily_';
/** Lưu DB mỗi N messages để không gây tải */
const PERSIST_EVERY_N = 60;

@Injectable()
export class AiLedStatsService implements OnModuleInit {
  private readonly logger = new Logger(AiLedStatsService.name);

  /** Ngày UTC hiện tại: YYYY-MM-DD */
  private currentDay = this.utcToday();

  /** Tích lũy hôm nay (in-memory) */
  private today: LedDayEntry = this.emptyEntry(this.currentDay);

  /** Thời điểm MQTT message trước (ms) */
  private lastTsMs: number | null = null;
  /** Trạng thái LED lần trước */
  private lastLed: { led1: boolean; led2: boolean } = { led1: false, led2: false };

  private msgCount = 0;

  constructor(private readonly prisma: PrismaService) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async onModuleInit() {
    // Khôi phục dữ liệu hôm nay từ DB sau khi server restart
    await this.loadTodayFromDb();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Gọi sau mỗi MQTT message — cập nhật tích lũy.
   * @returns bản sao today entry sau khi cập nhật
   */
  tick(led1: boolean, led2: boolean, ts: Date = new Date()): LedDayEntry {
    const dayNow = this.utcDateStr(ts);

    // Sang ngày mới → flush ngày cũ vào DB, reset
    if (dayNow !== this.currentDay) {
      const flushed = { ...this.today };
      this.persistEntry(flushed).catch(() => {});
      this.currentDay = dayNow;
      this.today = this.emptyEntry(dayNow);
      this.lastTsMs = null; // reset delta timer
    }

    // Tính delta từ message trước
    const nowMs = ts.getTime();
    if (this.lastTsMs !== null) {
      const deltaMs  = Math.min(nowMs - this.lastTsMs, 120_000); // cap 2 phút
      if (deltaMs > 0) {
        const deltaH   = deltaMs / 3_600_000;
        const deltaMin = deltaMs / 60_000;
        if (this.lastLed.led1) {
          this.today.led1_wh         += LED1_POWER_W * deltaH;
          this.today.led1_on_minutes += deltaMin;
        }
        if (this.lastLed.led2) {
          this.today.led2_wh         += LED2_POWER_W * deltaH;
          this.today.led2_on_minutes += deltaMin;
        }
      }
    }

    this.lastTsMs = nowMs;
    this.lastLed  = { led1, led2 };

    // Persist định kỳ
    this.msgCount++;
    if (this.msgCount % PERSIST_EVERY_N === 0) {
      this.persistEntry({ ...this.today }).catch(() => {});
    }

    return { ...this.today };
  }

  /** Trả về today stats (snapshot) */
  getToday(): LedDayEntry {
    return { ...this.today };
  }

  /** Lấy N ngày gần nhất (bao gồm hôm nay) từ DB + in-memory */
  async getHistory(days = 7): Promise<LedDayEntry[]> {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days + 1);
    cutoff.setUTCHours(0, 0, 0, 0);

    const rows = await this.prisma.aiLearningData.findMany({
      where: {
        feature: { startsWith: FEATURE_PREFIX },
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'asc' },
    });

    // De-dup: keep latest per date (có thể có nhiều row per day)
    const map = new Map<string, LedDayEntry>();
    for (const row of rows) {
      const entry = row.outputData as unknown as LedDayEntry;
      if (entry?.date) {
        map.set(entry.date, entry);
      }
    }

    // Ghi đè bằng today in-memory (luôn mới nhất)
    map.set(this.currentDay, { ...this.today });

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  // ── DB helpers ───────────────────────────────────────────────────────────────

  private async loadTodayFromDb(): Promise<void> {
    try {
      const feature = `${FEATURE_PREFIX}${this.currentDay}`;
      const row = await this.prisma.aiLearningData.findFirst({
        where: { feature },
        orderBy: { timestamp: 'desc' },
      });
      if (row) {
        const saved = row.outputData as unknown as LedDayEntry;
        if (saved?.date === this.currentDay) {
          this.today = { ...saved };
          this.logger.log(`Restored LED stats for ${this.currentDay}: led1=${saved.led1_wh.toFixed(3)}Wh, led2=${saved.led2_wh.toFixed(3)}Wh`);
        }
      }
    } catch (err) {
      this.logger.warn(`Could not load LED stats from DB: ${err.message}`);
    }
  }

  private async persistEntry(entry: LedDayEntry): Promise<void> {
    try {
      const feature = `${FEATURE_PREFIX}${entry.date}`;
      // Upsert: xóa row cũ nhất nếu có nhiều hơn 1, tạo mới
      await this.prisma.aiLearningData.create({
        data: {
          feature,
          inputData:  { date: entry.date },
          outputData: entry as any,
          accuracy:   null,
        },
      });
      // Cleanup: giữ tối đa 2 record per day
      const existing = await this.prisma.aiLearningData.findMany({
        where: { feature },
        orderBy: { timestamp: 'desc' },
        skip: 2,
        select: { id: true },
      });
      if (existing.length > 0) {
        await this.prisma.aiLearningData.deleteMany({
          where: { id: { in: existing.map((r) => r.id) } },
        });
      }
    } catch (err) {
      this.logger.debug(`Persist LED stats failed: ${err.message}`);
    }
  }

  // ── Utils ────────────────────────────────────────────────────────────────────

  private utcToday(): string {
    return this.utcDateStr(new Date());
  }

  private utcDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private emptyEntry(date: string): LedDayEntry {
    return { date, led1_wh: 0, led2_wh: 0, led1_on_minutes: 0, led2_on_minutes: 0 };
  }
}
