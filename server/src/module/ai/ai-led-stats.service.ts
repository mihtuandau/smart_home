import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface LedDayEntry {
  date: string;
  led1_wh: number;
  led2_wh: number;
  led1_on_minutes: number;
  led2_on_minutes: number;
}

export const LED1_POWER_W = 0.5;
export const LED2_POWER_W = 0.8;

const FEATURE_PREFIX = 'led_daily_';

const PERSIST_EVERY_N = 60;

@Injectable()
export class AiLedStatsService implements OnModuleInit {
  private readonly logger = new Logger(AiLedStatsService.name);

  private currentDay = this.utcToday();

  private today: LedDayEntry = this.emptyEntry(this.currentDay);

  private lastTsMs: number | null = null;

  private lastLed: { led1: boolean; led2: boolean } = {
    led1: false,
    led2: false,
  };

  private msgCount = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadTodayFromDb();
  }

  tick(led1: boolean, led2: boolean, ts: Date = new Date()): LedDayEntry {
    const dayNow = this.utcDateStr(ts);

    if (dayNow !== this.currentDay) {
      const flushed = { ...this.today };
      this.persistEntry(flushed).catch(() => {});
      this.currentDay = dayNow;
      this.today = this.emptyEntry(dayNow);
      this.lastTsMs = null;
    }

    const nowMs = ts.getTime();
    if (this.lastTsMs !== null) {
      const deltaMs = Math.min(nowMs - this.lastTsMs, 120_000);
      if (deltaMs > 0) {
        const deltaH = deltaMs / 3_600_000;
        const deltaMin = deltaMs / 60_000;
        if (this.lastLed.led1) {
          this.today.led1_wh += LED1_POWER_W * deltaH;
          this.today.led1_on_minutes += deltaMin;
        }
        if (this.lastLed.led2) {
          this.today.led2_wh += LED2_POWER_W * deltaH;
          this.today.led2_on_minutes += deltaMin;
        }
      }
    }

    this.lastTsMs = nowMs;
    this.lastLed = { led1, led2 };

    this.msgCount++;
    if (this.msgCount % PERSIST_EVERY_N === 0) {
      this.persistEntry({ ...this.today }).catch(() => {});
    }

    return { ...this.today };
  }

  getToday(): LedDayEntry {
    return { ...this.today };
  }

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

    const map = new Map<string, LedDayEntry>();
    for (const row of rows) {
      const entry = row.outputData as unknown as LedDayEntry;
      if (entry?.date) {
        map.set(entry.date, entry);
      }
    }

    map.set(this.currentDay, { ...this.today });

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

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
          this.logger.log(
            `Restored LED stats for ${this.currentDay}: led1=${saved.led1_wh.toFixed(3)}Wh, led2=${saved.led2_wh.toFixed(3)}Wh`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(`Could not load LED stats from DB: ${err.message}`);
    }
  }

  private async persistEntry(entry: LedDayEntry): Promise<void> {
    try {
      const feature = `${FEATURE_PREFIX}${entry.date}`;
      await this.prisma.aiLearningData.create({
        data: {
          feature,
          inputData: { date: entry.date },
          outputData: entry as any,
          accuracy: null,
        },
      });
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

  private utcToday(): string {
    return this.utcDateStr(new Date());
  }

  private utcDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private emptyEntry(date: string): LedDayEntry {
    return {
      date,
      led1_wh: 0,
      led2_wh: 0,
      led1_on_minutes: 0,
      led2_on_minutes: 0,
    };
  }
}
