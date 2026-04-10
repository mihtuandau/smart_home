import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BaselineProfile, BaselineSlot, LedState } from './dto/ai-result.dto';

const BASELINE_FEATURE = 'power_baseline_v2';
const PERSIST_INTERVAL_MS = 5 * 60 * 1000;

const PREWARM_DAYS = 7;

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
    const loaded = await this.loadFromDb();
    if (!loaded) {
      await this.prewarmFromPowerData();
    }
    setInterval(() => this.persistIfDirty(), PERSIST_INTERVAL_MS);
  }

  private ensureSlot(wd: string, h: string, state: LedState): BaselineSlot {
    if (!this.profile[wd]) this.profile[wd] = {};
    if (!this.profile[wd][h]) this.profile[wd][h] = {};
    if (!this.profile[wd][h][state]) {
      this.profile[wd][h][state] = { count: 0, sum: 0, sumSq: 0, mean: null, stdDev: null };
    }
    const slot = this.profile[wd][h][state]!;
    if (slot.sumSq === undefined) {
      slot.sumSq = slot.count * (slot.mean || 0) * (slot.mean || 0); // Approximate existing data
      slot.stdDev = 0;
    }
    return slot;
  }

  private async loadFromDb(): Promise<boolean> {
    try {
      const record = await this.prisma.aiLearningData.findFirst({
        where: { feature: BASELINE_FEATURE },
        orderBy: { timestamp: 'desc' },
      });
      if (record?.outputData) {
        this.profile = record.outputData as unknown as BaselineProfile;
        let totalSlots = 0;
        for (const wdMap of Object.values(this.profile)) {
          for (const hMap of Object.values(wdMap)) {
            totalSlots += Object.keys(hMap).length;
          }
        }
        this.logger.log(` Baseline loaded từ DB (${totalSlots} slots)`);
        return totalSlots > 10;
      }
    } catch (err) {
      this.logger.warn(`Failed to load baseline from DB: ${err.message}`);
    }
    this.profile = {};
    return false;
  }

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
        this.logger.log(
          ' Baseline khởi tạo trống (chưa có dữ liệu power_data)',
        );
        return;
      }

      let idleCount = 0;
      let activeCount = 0;

      for (const row of rows) {
        const ts = row.timestamp;
        const wd = String(ts.getDay());
        const h = String(ts.getUTCHours());
        const powerMw = row.power * 1000;

        if (powerMw < IDLE_THRESHOLD_MW) {
          const slot = this.ensureSlot(wd, h, 'none');
          slot.count += 1;
          slot.sum += powerMw;
          slot.sumSq = (slot.sumSq || 0) + powerMw * powerMw;
          slot.mean = slot.sum / slot.count;
          const variance = (slot.sumSq / slot.count) - (slot.mean * slot.mean);
          slot.stdDev = variance > 0 ? Math.sqrt(variance) : 0;
          idleCount++;
        } else {
          const slot = this.ensureSlot(wd, h, 'led1');
          slot.count += 1;
          slot.sum += powerMw;
          slot.sumSq = (slot.sumSq || 0) + powerMw * powerMw;
          slot.mean = slot.sum / slot.count;
          const variance = (slot.sumSq / slot.count) - (slot.mean * slot.mean);
          slot.stdDev = variance > 0 ? Math.sqrt(variance) : 0;
          activeCount++;
        }
      }

      this.dirty = true;
      this.logger.log(
        ` Baseline pre-warmed: ${idleCount} idle readings (none) + ${activeCount} active readings (led1) từ ${PREWARM_DAYS} ngày`,
      );
    } catch (err) {
      this.logger.warn(`Pre-warm failed: ${err.message}`);
    }
  }

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
    slot.sumSq = (slot.sumSq || 0) + powerMw * powerMw;
    slot.mean = slot.sum / slot.count;
    const variance = (slot.sumSq / slot.count) - (slot.mean * slot.mean);
    slot.stdDev = variance > 0 ? Math.sqrt(variance) : 0;

    this.dirty = true;
  }

  expectedPowerMw(
    ts: Date = new Date(),
    led1 = false,
    led2 = false,
  ): number | null {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
    const state = ledStateKey(led1, led2);

    const exactSlot = this.profile?.[wd]?.[h]?.[state];
    if (exactSlot?.mean != null && exactSlot.count >= 3) return exactSlot.mean;

    const hourMap = this.profile?.[wd]?.[h];
    if (hourMap) {
      let sum = 0,
        count = 0;
      for (const s of Object.values(hourMap)) {
        if (s && s.count > 0) {
          sum += s.sum;
          count += s.count;
        }
      }
      if (count >= 5) return sum / count;
    }

    let totalSum = 0,
      totalCount = 0;
    for (const wdMap of Object.values(this.profile)) {
      for (const hMap of Object.values(wdMap)) {
        for (const s of Object.values(hMap)) {
          if (s && s.count > 0) {
            totalSum += s.sum;
            totalCount += s.count;
          }
        }
      }
    }
    return totalCount >= 10 ? totalSum / totalCount : null;
  }

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

  getZScoreStats(
    ts: Date = new Date(),
    led1 = false,
    led2 = false,
  ): { mean: number; stdDev: number } | null {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
    const state = ledStateKey(led1, led2);

    const exactSlot = this.profile?.[wd]?.[h]?.[state];
    // Always combine enough data or use fallback
    if (exactSlot?.mean != null && exactSlot.count >= 3) {
      return { mean: exactSlot.mean, stdDev: Math.max(exactSlot.stdDev || 0, 100) }; // Minimum default stdDev 100W
    }

    const hourMap = this.profile?.[wd]?.[h];
    if (hourMap) {
      let sum = 0, sumSq = 0, count = 0;
      for (const s of Object.values(hourMap)) {
        if (s && s.count > 0) {
          sum += s.sum;
          sumSq += s.sumSq ?? (s.count * (s.mean ?? 0) * (s.mean ?? 0));
          count += s.count;
        }
      }
      if (count >= 5) {
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        const stdDev = variance > 0 ? Math.sqrt(variance) : 0;
        return { mean, stdDev: Math.max(stdDev, 100) };
      }
    }
    
    // Fallbacks if no exact logic is available
    const fallbackExpected = this.expectedPowerMw(ts, led1, led2);
    if (fallbackExpected) {
      return { mean: fallbackExpected, stdDev: 150 }; // High uncertainty fallback
    }

    return null;
  }

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
