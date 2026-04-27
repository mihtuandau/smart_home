import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface LedDayEntry {
  date: string;
  led1_wh: number;
  led2_wh: number;
  led1_on_minutes: number;
  led2_on_minutes: number;
}

export const LED1_POWER_W = 15.0;
export const LED2_POWER_W = 25.0;

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

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Load today's persisted data if exists
    try {
      const persisted = await this.prisma.aiLearningData.findFirst({
        where: { 
          date: this.currentDay,
          feature: 'daily_stats'
        },
      });
      if (persisted) {
        this.today = {
          date: persisted.date,
          led1_wh: persisted.led1_wh,
          led2_wh: persisted.led2_wh,
          led1_on_minutes: persisted.led1_on_minutes,
          led2_on_minutes: persisted.led2_on_minutes,
        };
        this.logger.log(`Restored LED stats for ${this.currentDay}`);
      }
    } catch (e) {
      this.logger.error('Failed to restore LED stats from DB', e);
    }
  }

  tick(led1: boolean, led2: boolean, ts: Date = new Date()): LedDayEntry {
    const dayNow = this.utcDateStr(ts);

    // Day change detection
    if (dayNow !== this.currentDay) {
      // Sync last day one last time before switching
      this.syncToDb();
      
      this.currentDay = dayNow;
      this.today = this.emptyEntry(dayNow);
      this.lastTsMs = null;
    }

    const nowMs = ts.getTime();
    if (this.lastTsMs !== null) {
      // Delta capped at 2 minutes to prevent huge jumps if server was offline
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

    // Fire and forget sync to DB
    this.syncToDb();

    return { ...this.today };
  }

  private async syncToDb() {
    try {
      const existing = await this.prisma.aiLearningData.findFirst({
        where: {
          date: this.today.date,
          feature: 'daily_stats',
        },
      });

      if (existing) {
        await this.prisma.aiLearningData.update({
          where: { id: existing.id },
          data: {
            led1_wh: this.today.led1_wh,
            led2_wh: this.today.led2_wh,
            led1_on_minutes: this.today.led1_on_minutes,
            led2_on_minutes: this.today.led2_on_minutes,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Refresh expiry
          },
        });
      } else {
        await this.prisma.aiLearningData.create({
          data: {
            date: this.today.date,
            feature: 'daily_stats',
            led1_wh: this.today.led1_wh,
            led2_wh: this.today.led2_wh,
            led1_on_minutes: this.today.led1_on_minutes,
            led2_on_minutes: this.today.led2_on_minutes,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Keep for 30 days
          },
        });
      }
    } catch (e) {
      // Only log errors occasionally to avoid spamming
      this.logger.error(`Failed to sync LED stats for ${this.today.date}`, e);
    }
  }

  getToday(): LedDayEntry {
    return { ...this.today };
  }

  async getHistory(days = 7): Promise<LedDayEntry[]> {
    try {
      const records = await this.prisma.aiLearningData.findMany({
        where: { feature: 'daily_stats' }, // Filter correctly!
        orderBy: { date: 'desc' },
        take: days,
      });

      // Always include active "today" entry if not in records yet
      const history = records.map(r => ({
        date: r.date,
        led1_wh: r.led1_wh,
        led2_wh: r.led2_wh,
        led1_on_minutes: r.led1_on_minutes,
        led2_on_minutes: r.led2_on_minutes,
      }));

      // Ensure today is the most recent
      const todayInHistory = history.find(h => h.date === this.today.date);
      if (!todayInHistory) {
        history.unshift({ ...this.today });
      } else {
        // Update today in history with in-memory precise values
        const idx = history.findIndex(h => h.date === this.today.date);
        history[idx] = { ...this.today };
      }

      return history.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } catch (e) {
      this.logger.error('Failed to fetch LED history', e);
      return [{ ...this.today }];
    }
  }

  private utcToday(): string {
    return this.utcDateStr(new Date());
  }

  private utcDateStr(d: Date): string {
    // Return YYYY-MM-DD in local-ish time but using ISO slice
    // Use local date parts to ensure it matches user's expectation of "today"
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
