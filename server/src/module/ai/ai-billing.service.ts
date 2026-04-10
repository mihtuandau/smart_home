import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BillingForecastDto } from './dto/ai-result.dto';

const DEFAULT_PRICE_VND_PER_KWH = parseFloat(
  process.env.ELECTRICITY_PRICE ?? '3000',
);

@Injectable()
export class AiBillingService {
  private readonly logger = new Logger(AiBillingService.name);

  constructor(private prisma: PrismaService) {}

  async computeMonthlyEnergyKwh(year: number, month: number): Promise<number> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end =
      month === 12
        ? new Date(Date.UTC(year + 1, 0, 1))
        : new Date(Date.UTC(year, month, 1));
    const now = new Date();
    const effectiveEnd = end < now ? end : now;

    const RAW_DAYS = 7;
    const rawCutoff = new Date(now.getTime() - RAW_DAYS * 24 * 3_600_000);

    let totalWh = 0;

    // ── Phần 1: PowerAgg cho data cũ hơn 7 ngày ────────────────────────
    if (start < rawCutoff) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: { bucketStart: { gte: start, lt: rawCutoff < effectiveEnd ? rawCutoff : effectiveEnd } },
        orderBy: { bucketStart: 'asc' },
        select: { powerAvg: true, bucketMinutes: true },
      });
      for (const row of aggRows) {
        totalWh += row.powerAvg * (row.bucketMinutes / 60);
      }
    }

    // ── Phần 2: PowerData raw cho 7 ngày gần nhất (hoặc toàn bộ nếu tháng ngắn hơn) ──
    const rawStart = start > rawCutoff ? start : rawCutoff;
    const rows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: rawStart, lt: effectiveEnd } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });

    for (let i = 0; i < rows.length - 1; i++) {
      const dt =
        (rows[i + 1].timestamp.getTime() - rows[i].timestamp.getTime()) /
        3_600_000;
      if (dt <= 2) totalWh += rows[i].power * dt;
    }

    return totalWh / 1000;
  }

  async projectMonthly(
    asOf: Date = new Date(),
    priceVnd: number = DEFAULT_PRICE_VND_PER_KWH,
  ): Promise<BillingForecastDto> {
    const year = asOf.getUTCFullYear();
    const month = asOf.getUTCMonth() + 1;

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end =
      month === 12
        ? new Date(Date.UTC(year + 1, 0, 1))
        : new Date(Date.UTC(year, month, 1));

    const daysInMonth = (end.getTime() - start.getTime()) / 86_400_000;
    const elapsedDays = Math.max(
      (asOf.getTime() - start.getTime()) / 86_400_000,
      1 / 24,
    );

    const kwhSoFar = await this.computeMonthlyEnergyKwh(year, month);

    const dailySeries = await this.computeDailySeriesKwh(year, month, asOf);

    let meanDaily: number;
    let stdDaily: number;
    let nDays: number;

    if (dailySeries.length > 0) {
      meanDaily = dailySeries.reduce((s, v) => s + v, 0) / dailySeries.length;
      const variance =
        dailySeries.reduce((s, v) => s + Math.pow(v - meanDaily, 2), 0) /
        dailySeries.length;
      stdDaily = Math.sqrt(variance);
      nDays = dailySeries.length;
    } else {
      meanDaily = kwhSoFar / elapsedDays;
      stdDaily = 0;
      nDays = 1;
    }

    const remainingDays = Math.max(daysInMonth - elapsedDays, 0);
    const projectedKwh = kwhSoFar + meanDaily * remainingDays;

    let ciLow: number;
    let ciHigh: number;

    if (nDays > 1 && stdDaily > 0) {
      const se = stdDaily / Math.sqrt(nDays);
      const margin = 1.96 * se * remainingDays;
      ciLow = Math.max(0, projectedKwh - margin);
      ciHigh = projectedKwh + margin;
    } else {
      ciLow = Math.max(0, projectedKwh * 0.9);
      ciHigh = projectedKwh * 1.1;
    }

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      kwhSoFar: Math.round(kwhSoFar * 1000) / 1000,
      projectedKwh: Math.round(projectedKwh * 1000) / 1000,
      projectedCostVnd: Math.round(projectedKwh * priceVnd),
      ciLow: Math.round(ciLow * 1000) / 1000,
      ciHigh: Math.round(ciHigh * 1000) / 1000,
      priceVndPerKwh: priceVnd,
    };
  }

  private async computeDailySeriesKwh(
    year: number,
    month: number,
    asOf: Date,
  ): Promise<number[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const now = new Date();
    const RAW_DAYS = 7;
    const rawCutoff = new Date(now.getTime() - RAW_DAYS * 24 * 3_600_000);
    const dayMap = new Map<string, number>();

    // ── Phần 1: PowerAgg cho data cũ hơn 7 ngày ────────────────────────
    if (start < rawCutoff) {
      const aggEnd = rawCutoff < asOf ? rawCutoff : asOf;
      const aggRows = await this.prisma.powerAgg.findMany({
        where: { bucketStart: { gte: start, lt: aggEnd } },
        orderBy: { bucketStart: 'asc' },
        select: { bucketStart: true, powerAvg: true, bucketMinutes: true },
      });
      for (const row of aggRows) {
        const kwh = row.powerAvg * (row.bucketMinutes / 60) / 1000;
        const day = row.bucketStart.toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + kwh);
      }
    }

    // ── Phần 2: PowerData raw cho 7 ngày gần nhất ─────────────────────────
    const rawStart = start > rawCutoff ? start : rawCutoff;
    const rows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: rawStart, lt: asOf } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });

    for (let i = 0; i < rows.length - 1; i++) {
      const dt =
        (rows[i + 1].timestamp.getTime() - rows[i].timestamp.getTime()) /
        3_600_000;
      if (dt <= 2) {
        const kwh = rows[i].power * dt / 1000;
        const day = rows[i].timestamp.toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + kwh);
      }
    }

    return Array.from(dayMap.values());
  }

  /** Tính kWh + công suất TB + số mẫu đo theo khoảng thời gian rolling.
   *  Hybrid: PowerAgg cho data cũ (> 7 ngày) + PowerData raw cho 7 ngày gần nhất.
   */
  async computeRollingStats(
    hours: number,
  ): Promise<{ kwh: number; avgPowerW: number; sampleCount: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - hours * 3_600_000);
    const RAW_DAYS = 7;
    const rawCutoff = new Date(now.getTime() - RAW_DAYS * 24 * 3_600_000);

    let totalWh = 0;
    let powerSum = 0;
    let sampleCount = 0;

    // ── Phần 1: PowerAgg cho dữ liệu cũ hơn 7 ngày ────────────────────────
    if (windowStart < rawCutoff) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: { bucketStart: { gte: windowStart, lt: rawCutoff } },
        orderBy: { bucketStart: 'asc' },
        select: { powerAvg: true, bucketMinutes: true, samples: true },
      });
      for (const row of aggRows) {
        const dtH = row.bucketMinutes / 60;
        totalWh += row.powerAvg * dtH;
        powerSum += row.powerAvg * row.samples;
        sampleCount += row.samples;
      }
    }

    // ── Phần 2: PowerData raw cho 7 ngày gần nhất ────────────────────────
    const effectiveRawStart = windowStart > rawCutoff ? windowStart : rawCutoff;
    const rawRows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: effectiveRawStart, lte: now } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });
    sampleCount += rawRows.length;
    for (const row of rawRows) {
      powerSum += row.power;
    }
    for (let i = 0; i < rawRows.length - 1; i++) {
      const dt =
        (rawRows[i + 1].timestamp.getTime() - rawRows[i].timestamp.getTime()) /
        3_600_000;
      if (dt <= 2) totalWh += rawRows[i].power * dt;
    }

    const kwh = totalWh / 1000;
    const avgPowerW = sampleCount > 0 ? powerSum / sampleCount : 0;
    return { kwh, avgPowerW, sampleCount };
  }

  formatReport(dto: BillingForecastDto): string {
    return [
      `[Báo cáo điện] Tháng: ${dto.month}`,
      `  Đã dùng:     ${dto.kwhSoFar.toFixed(3)} kWh`,
      `  Dự báo:      ${dto.projectedKwh.toFixed(3)} kWh  [CI 95%: ${dto.ciLow.toFixed(2)} – ${dto.ciHigh.toFixed(2)}]`,
      `  Ước tính:    ${dto.projectedCostVnd.toLocaleString('vi-VN')} VNĐ  (${dto.priceVndPerKwh} VNĐ/kWh)`,
    ].join('\n');
  }
}
