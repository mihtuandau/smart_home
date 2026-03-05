/**
 * ai-baseline.service.ts
 *
 * Tương đương baseline_manager.py trong AI_SmartHome.
 *
 * - Duy trì profile tiêu thụ điện trung bình theo (weekday × hour × ledState)
 *   → 7 × 24 × 4 = 672 slots (none / led1 / led2 / both)
 * - Pre-warm từ bảng power_data khi khởi động (dữ liệu lịch sử thực)
 * - Lưu snapshot vào AiLearningData, load lại khi restart
 * - Cập nhật in-memory sau mỗi MQTT message, persist định kỳ
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BaselineProfile, BaselineSlot, LedState } from './dto/ai-result.dto';

const BASELINE_FEATURE = 'power_baseline_v2';
const PERSIST_INTERVAL_MS = 5 * 60 * 1000; // flush to DB every 5 minutes
/** Số ngày lịch sử load khi khởi động để pre-warm */
const PREWARM_DAYS = 7;
/**
 * Ngưỡng công suất (mW) phân tách idle vs đèn bật.
 * DB không có LED state nên dùng ngưỡng này để phân loại khi pre-warm.
 * Idle ~600 mW, LED1 bật ~2100 mW → 1200 mW là ngưỡng an toàn.
 */
const IDLE_THRESHOLD_MW = 1200;

function ledStateKey(led1: boolean, led2: boolean): LedState {
  if (led1 && led2) return 'both';
  if (led1) return 'led1';
  if (led2) return 'led2';
  return 'none';
}

@Injectable()
export class AiBaselineService implements OnModuleInit {
  private readonly logger = new Logger(AiBaselineService.name);

  private profile: BaselineProfile = {};
  private dirty = false;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // 1. Thử load snapshot đã lưu
    const loaded = await this.loadFromDb();
    // 2. Nếu chưa có dữ liệu đủ → pre-warm từ bảng power_data thực
    if (!loaded) {
      await this.prewarmFromPowerData();
    }
    setInterval(() => this.persistIfDirty(), PERSIST_INTERVAL_MS);
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  private ensureSlot(wd: string, h: string, state: LedState): BaselineSlot {
    if (!this.profile[wd]) this.profile[wd] = {};
    if (!this.profile[wd][h]) this.profile[wd][h] = {};
    if (!this.profile[wd][h][state]) {
      this.profile[wd][h][state] = { count: 0, sum: 0, mean: null };
    }
    return this.profile[wd][h][state]!;
  }

  private async loadFromDb(): Promise<boolean> {
    try {
      const record = await this.prisma.aiLearningData.findFirst({
        where: { feature: BASELINE_FEATURE },
        orderBy: { timestamp: 'desc' },
      });
      if (record?.outputData) {
        this.profile = record.outputData as unknown as BaselineProfile;
        // Đếm tổng số slot đã học
        let totalSlots = 0;
        for (const wdMap of Object.values(this.profile)) {
          for (const hMap of Object.values(wdMap)) {
            totalSlots += Object.keys(hMap).length;
          }
        }
        this.logger.log(`✅ Baseline loaded từ DB (${totalSlots} slots)`);
        return totalSlots > 10;
      }
    } catch (err) {
      this.logger.warn(`Failed to load baseline from DB: ${err.message}`);
    }
    this.profile = {};
    return false;
  }

  /**
   * Pre-warm từ bảng power_data lịch sử.
   * - power_mW < IDLE_THRESHOLD_MW  → không có đèn bật → học vào slot 'none'
   * - power_mW >= IDLE_THRESHOLD_MW → có khả năng đèn bật → học vào slot 'led1' (tham khảo)
   *   Các slot led2/both sẽ được học chính xác từ MQTT sau (có LED state thực).
   */
  private async prewarmFromPowerData(): Promise<void> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - PREWARM_DAYS);

      const rows = await this.prisma.powerData.findMany({
        where: { timestamp: { gte: since } },
        select: { power: true, timestamp: true },
        orderBy: { timestamp: 'asc' },
      });

      if (rows.length === 0) {
        this.logger.log('📋 Baseline khởi tạo trống (chưa có dữ liệu power_data)');
        return;
      }

      let idleCount = 0;
      let activeCount = 0;

      for (const row of rows) {
        const ts = row.timestamp;
        const wd = String(ts.getDay());
        const h = String(ts.getUTCHours());
        const powerMw = row.power * 1000; // DB lưu Watts → chuyển sang mW

        if (powerMw < IDLE_THRESHOLD_MW) {
          // Tải thấp: không có đèn bật → slot 'none'
          const slot = this.ensureSlot(wd, h, 'none');
          slot.count += 1;
          slot.sum += powerMw;
          slot.mean = slot.sum / slot.count;
          idleCount++;
        } else {
          // Tải cao: có thể có đèn → slot 'led1' làm ước lượng ban đầu
          const slot = this.ensureSlot(wd, h, 'led1');
          slot.count += 1;
          slot.sum += powerMw;
          slot.mean = slot.sum / slot.count;
          activeCount++;
        }
      }

      this.dirty = true;
      this.logger.log(
        `🔥 Baseline pre-warmed: ${idleCount} idle readings (none) + ${activeCount} active readings (led1) từ ${PREWARM_DAYS} ngày`,
      );
    } catch (err) {
      this.logger.warn(`Pre-warm failed: ${err.message}`);
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  /**
   * Cập nhật baseline với reading mới nhất — gọi sau mỗi MQTT message.
   * LED state được ghi vào slot riêng để học đúng ngữ cảnh.
   */
  updateWithReading(
    powerW: number,
    ts: Date = new Date(),
    led1 = false,
    led2 = false,
  ): void {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
    const powerMw = powerW * 1000;
    const state = ledStateKey(led1, led2);

    const slot = this.ensureSlot(wd, h, state);
    slot.count += 1;
    slot.sum += powerMw;
    slot.mean = slot.sum / slot.count;

    this.dirty = true;
  }

  // ── Query ───────────────────────────────────────────────────────────────────

  /**
   * Trả về mW kỳ vọng cho thời điểm ts + trạng thái đèn cụ thể.
   * Fallback chain: led-state slot → overall hour avg → global avg → null
   */
  expectedPowerMw(
    ts: Date = new Date(),
    led1 = false,
    led2 = false,
  ): number | null {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
    const state = ledStateKey(led1, led2);

    // 1. Exact slot
    const exactSlot = this.profile?.[wd]?.[h]?.[state];
    if (exactSlot?.mean != null && exactSlot.count >= 3) return exactSlot.mean;

    // 2. Same hour, any LED state → weighted avg
    const hourMap = this.profile?.[wd]?.[h];
    if (hourMap) {
      let sum = 0, count = 0;
      for (const s of Object.values(hourMap)) {
        if (s && s.count > 0) { sum += s.sum; count += s.count; }
      }
      if (count >= 5) return sum / count;
    }

    // 3. Global average across all slots
    let totalSum = 0, totalCount = 0;
    for (const wdMap of Object.values(this.profile)) {
      for (const hMap of Object.values(wdMap)) {
        for (const s of Object.values(hMap)) {
          if (s && s.count > 0) { totalSum += s.sum; totalCount += s.count; }
        }
      }
    }
    return totalCount >= 10 ? totalSum / totalCount : null;
  }

  /**
   * True nếu currentPowerMw vượt quá baseline (LED-state-aware) * factor.
   */
  isSignificantDeviation(
    currentPowerMw: number,
    ts: Date = new Date(),
    factor = 1.4,
    led1 = false,
    led2 = false,
  ): boolean {
    const exp = this.expectedPowerMw(ts, led1, led2);
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
      this.logger.debug('Baseline profile persisted to DB');
    } catch (err) {
      this.logger.warn(`Failed to persist baseline: ${err.message}`);
    }
  }

  async flush() {
    await this.persistIfDirty();
  }

  getProfile(): BaselineProfile {
    return this.profile;
  }
}
