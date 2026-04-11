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
    // In-memory stats for now since AiLearningData was removed
  }

  tick(led1: boolean, led2: boolean, ts: Date = new Date()): LedDayEntry {
    const dayNow = this.utcDateStr(ts);

    if (dayNow !== this.currentDay) {
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

    return { ...this.today };
  }

  getToday(): LedDayEntry {
    return { ...this.today };
  }

  async getHistory(days = 7): Promise<LedDayEntry[]> {
    // Return mock or empty since we don't persist anymore
    return [{ ...this.today }];
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
