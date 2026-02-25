/**
 * ai-baseline.service.ts
 *
 * Tương đương baseline_manager.py trong AI_SmartHome.
 *
 * - Duy trì profile tiêu thụ điện trung bình theo (weekday × hour) — 7×24 = 168 slots
 * - Lưu vào bảng AiLearningData với feature = "power_baseline"
 * - Load lúc khởi động, cập nhật in-memory sau mỗi message, persist định kỳ
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BaselineProfile, BaselineSlot } from './dto/ai-result.dto';

const BASELINE_FEATURE = 'power_baseline';
const PERSIST_INTERVAL_MS = 5 * 60 * 1000; // flush to DB every 5 minutes
const DECAY_FACTOR = 0.98; // applied weekly to slowly forget old data

@Injectable()
export class AiBaselineService implements OnModuleInit {
  private readonly logger = new Logger(AiBaselineService.name);

  /** In-memory baseline profile: weekday(0-6) → hour(0-23) → stats */
  private profile: BaselineProfile = {};
  private dirty = false;
  private lastPersistedAt = 0;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadFromDb();
    // Periodic flush
    setInterval(() => this.persistIfDirty(), PERSIST_INTERVAL_MS);
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  private defaultProfile(): BaselineProfile {
    const p: BaselineProfile = {};
    for (let wd = 0; wd < 7; wd++) {
      p[String(wd)] = {};
      for (let h = 0; h < 24; h++) {
        p[String(wd)][String(h)] = { count: 0, sum: 0, mean: null };
      }
    }
    return p;
  }

  private async loadFromDb() {
    try {
      const record = await this.prisma.aiLearningData.findFirst({
        where: { feature: BASELINE_FEATURE },
        orderBy: { timestamp: 'desc' },
      });
      if (record?.outputData) {
        this.profile = record.outputData as unknown as BaselineProfile;
        this.logger.log('✅ Baseline profile loaded from DB');
      } else {
        this.profile = this.defaultProfile();
        this.logger.log('📋 Baseline profile initialised (empty)');
      }
    } catch (err) {
      this.logger.warn(`Failed to load baseline from DB: ${err.message}`);
      this.profile = this.defaultProfile();
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  /**
   * Tương đương enqueue_update_with_row() — gọi sau mỗi MQTT message.
   * Cập nhật in-memory ngay, persist theo interval.
   */
  updateWithReading(powerW: number, ts: Date = new Date()) {
    const wd = String(ts.getDay()); // 0=Sun … 6=Sat  (js) — matches Python weekday when offset handled
    const h = String(ts.getUTCHours());
    const powerMw = powerW * 1000;

    if (!this.profile[wd]) this.profile[wd] = {};
    if (!this.profile[wd][h]) this.profile[wd][h] = { count: 0, sum: 0, mean: null };

    const slot = this.profile[wd][h];
    slot.count += 1;
    slot.sum += powerMw;
    slot.mean = slot.sum / slot.count;

    this.dirty = true;
  }

  // ── Query ───────────────────────────────────────────────────────────────────

  /**
   * Tương đương expected_power().
   * Trả về mW kỳ vọng tại thời điểm ts, hoặc null nếu chưa đủ dữ liệu.
   */
  expectedPowerMw(ts: Date = new Date()): number | null {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());

    const slot: BaselineSlot | undefined = this.profile?.[wd]?.[h];
    if (slot?.mean != null) return slot.mean;

    // Fallback: overall average across all slots
    let totalSum = 0;
    let totalCount = 0;
    for (const wdMap of Object.values(this.profile)) {
      for (const s of Object.values(wdMap)) {
        if (s.count > 0) {
          totalSum += s.sum;
          totalCount += s.count;
        }
      }
    }
    return totalCount > 0 ? totalSum / totalCount : null;
  }

  /**
   * Tương đương is_significant_deviation().
   * True nếu currentPowerMw vượt quá baseline * factor.
   */
  isSignificantDeviation(currentPowerMw: number, ts: Date = new Date(), factor = 1.4): boolean {
    const exp = this.expectedPowerMw(ts);
    if (exp == null) return false;
    return currentPowerMw > exp * factor;
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private async persistIfDirty() {
    if (!this.dirty) return;
    try {
      await this.prisma.aiLearningData.create({
        data: {
          feature: BASELINE_FEATURE,
          inputData: {},
          outputData: this.profile as any,
          accuracy: null,
        },
      });
      this.dirty = false;
      this.lastPersistedAt = Date.now();
      this.logger.debug('Baseline profile persisted to DB');
    } catch (err) {
      this.logger.warn(`Failed to persist baseline: ${err.message}`);
    }
  }

  /** Expose for forced flush on shutdown. */
  async flush() {
    await this.persistIfDirty();
  }

  getProfile(): BaselineProfile {
    return this.profile;
  }
}
