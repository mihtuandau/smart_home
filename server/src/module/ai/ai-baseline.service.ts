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
      slot.sumSq = slot.count * (slot.mean || 0) * (slot.mean || 0);
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
        return true;
      }
    } catch (err) {
      this.logger.warn(`Failed to load baseline from DB: ${err.message}`);
    }
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

      if (rows.length === 0) return;

      for (const row of rows) {
        const ts = row.timestamp;
        const wd = String(ts.getDay());
        const h = String(ts.getUTCHours());
        const powerMw = row.power; // Already mW

        const state = powerMw < IDLE_THRESHOLD_MW ? 'none' : 'led1';
        const slot = this.ensureSlot(wd, h, state as LedState);
        slot.count += 1;
        slot.sum += powerMw;
        slot.sumSq = (slot.sumSq || 0) + powerMw * powerMw;
        slot.mean = slot.sum / slot.count;
        const variance = (slot.sumSq / slot.count) - (slot.mean * slot.mean);
        slot.stdDev = variance > 0 ? Math.sqrt(variance) : 0;
      }

      this.dirty = true;
      this.logger.log(`Baseline pre-warmed từ ${rows.length} mẫu.`);
    } catch (err) {
      this.logger.warn(`Pre-warm failed: ${err.message}`);
    }
  }

  updateWithReading(
    powerMw: number,
    ts: Date = new Date(),
    led1 = false,
    led2 = false,
  ): void {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
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

  expectedPowerMw(ts: Date = new Date(), led1 = false, led2 = false): number | null {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
    const state = ledStateKey(led1, led2);
    const slot = this.profile?.[wd]?.[h]?.[state];
    return slot?.mean || null;
  }

  getZScoreStats(ts: Date = new Date(), led1 = false, led2 = false) {
    const wd = String(ts.getDay());
    const h = String(ts.getUTCHours());
    const state = ledStateKey(led1, led2);
    const slot = this.profile?.[wd]?.[h]?.[state];
    if (slot?.mean != null && slot.count >= 3) {
      return { mean: slot.mean, stdDev: Math.max(slot.stdDev || 0, 100) };
    }
    return null;
  }

  private async persistIfDirty() {
    if (!this.dirty) return;
    try {
      await this.prisma.aiLearningData.create({
        data: {
          date: new Date().toISOString().split('T')[0],
          feature: BASELINE_FEATURE,
          inputData: {},
          outputData: this.profile as any,
          accuracy: null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Keep baseline for 7 days
        },
      });
      this.dirty = false;
      this.logger.debug('Baseline profile persisted');
    } catch (err) {
      this.logger.warn(`Failed to persist baseline: ${err.message}`);
    }
  }

  getProfile(): BaselineProfile {
    return this.profile;
  }
}
