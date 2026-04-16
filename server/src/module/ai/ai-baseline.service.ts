import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BaselineProfile, BaselineSlot, LedState } from './dto/ai-result.dto';

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

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.prewarmFromPowerData();
  }

  private ensureSlot(wd: string, h: string, state: LedState): BaselineSlot {
    if (!this.profile[wd]) this.profile[wd] = {};
    if (!this.profile[wd][h]) this.profile[wd][h] = {};
    if (!this.profile[wd][h][state]) {
      this.profile[wd][h][state] = { count: 0, sum: 0, sumSq: 0, mean: null, stdDev: null };
    }
    return this.profile[wd][h][state]!;
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
        this.logger.log('Baseline khởi tạo trống (chưa có dữ liệu power_data)');
        return;
      }

      let idleCount = 0;
      let activeCount = 0;

      for (const row of rows) {
        const ts = row.timestamp;
        const wd = String(ts.getDay());
        const h = String(ts.getUTCHours());
        const powerMw = row.power; // Already mW in new schema

        const state = powerMw < IDLE_THRESHOLD_MW ? 'none' : 'led1';
        const slot = this.ensureSlot(wd, h, state as LedState);
        slot.count += 1;
        slot.sum += powerMw;
        slot.sumSq = (slot.sumSq || 0) + powerMw * powerMw;
        slot.mean = slot.sum / slot.count;
        const variance = (slot.sumSq / slot.count) - (slot.mean * slot.mean);
        slot.stdDev = variance > 0 ? Math.sqrt(variance) : 0;
        
        if (state === 'none') idleCount++; else activeCount++;
      }

      this.logger.log(
        `Baseline pre-warmed: ${idleCount} idle + ${activeCount} active readings từ ${PREWARM_DAYS} ngày`,
      );
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
      let sum = 0, count = 0;
      for (const s of Object.values(hourMap)) {
        if (s && s.count > 0) {
          sum += s.sum;
          count += s.count;
        }
      }
      if (count >= 5) return sum / count;
    }
    return null;
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
    if (exactSlot?.mean != null && exactSlot.count >= 3) {
      return { mean: exactSlot.mean, stdDev: Math.max(exactSlot.stdDev || 0, 100) };
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
    return null;
  }

  getProfile(): BaselineProfile {
    return this.profile;
  }
}
