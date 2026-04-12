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

    let totalMwh = 0;
    let rawCount = 0;
    let aggCount = 0;

    const firstRaw = await this.prisma.powerData.findFirst({
      where: { timestamp: { gte: start, lt: effectiveEnd } },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });

    const rawStart = firstRaw?.timestamp ?? effectiveEnd;

    // Use aggregates for the older segment to avoid being capped by raw retention.
    if (start < rawStart) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: { bucketStart: { gte: start, lt: rawStart } },
        orderBy: { bucketStart: 'asc' },
        select: { powerAvg: true, bucketMinutes: true },
      });
      for (const row of aggRows) {
        totalMwh += row.powerAvg * (row.bucketMinutes / 60);
      }
      aggCount = aggRows.length;
    }

    const rows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: rawStart, lt: effectiveEnd } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });

    for (let i = 0; i < rows.length - 1; i++) {
      const dtHours =
        (rows[i + 1].timestamp.getTime() - rows[i].timestamp.getTime()) /
        3_600_000;
      if (dtHours <= 24) {
        const avgPower = (rows[i].power + rows[i + 1].power) / 2;
        totalMwh += avgPower * dtHours;
        rawCount++;
      }
    }

    const kwhSoFar = totalMwh / 1_000_000; // mWh / 1,000,000 => kWh
    
    this.logger.debug(
      `Monthly energy computation: year=${year}, month=${month}, ` +
      `aggRows=${aggCount}, rawIntervals=${rawCount}, totalMwh=${totalMwh}, kwhSoFar=${kwhSoFar.toFixed(3)}`,
    );

    return kwhSoFar;
  }

  private async getMonthDataStart(
    start: Date,
    end: Date,
  ): Promise<Date | null> {
    const firstRaw = await this.prisma.powerData.findFirst({
      where: { timestamp: { gte: start, lt: end } },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });
    const firstAgg = await this.prisma.powerAgg.findFirst({
      where: { bucketStart: { gte: start, lt: end } },
      orderBy: { bucketStart: 'asc' },
      select: { bucketStart: true },
    });

    const candidates = [firstRaw?.timestamp, firstAgg?.bucketStart].filter(
      (d): d is Date => Boolean(d),
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((min, cur) => (cur < min ? cur : min));
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
    const dataStart = await this.getMonthDataStart(start, asOf);
    const hasFullCoverage = dataStart !== null && dataStart.getTime() <= start.getTime() + 60_000;

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

    const observedDays =
      dataStart === null
        ? elapsedDays
        : Math.max((asOf.getTime() - dataStart.getTime()) / 86_400_000, 1 / 24);
    const missingDaysAtStart =
      dataStart === null
        ? 0
        : Math.max((dataStart.getTime() - start.getTime()) / 86_400_000, 0);
    const shouldEstimateMissingStart = missingDaysAtStart > 0.25 && observedDays >= 0.5;
    const estimatedStartKwh = shouldEstimateMissingStart
      ? (kwhSoFar / observedDays) * missingDaysAtStart
      : 0;
    const kwhFromMonthStart = kwhSoFar + estimatedStartKwh;

    const remainingDays = Math.max(daysInMonth - elapsedDays, 0);
    const projectedKwh = kwhFromMonthStart + meanDaily * remainingDays;

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
      kwhSoFar: kwhFromMonthStart,
      projectedKwh: projectedKwh,
      projectedCostVnd: Math.round(projectedKwh * priceVnd),
      ciLow: ciLow,
      ciHigh: ciHigh,
      priceVndPerKwh: priceVnd,
      dataStartIso: dataStart ? dataStart.toISOString() : null,
      dataCoverageLabel: hasFullCoverage ? 'full-month' : 'partial-month',
      estimatedFromMonthStart: shouldEstimateMissingStart,
      estimatedMissingDays: shouldEstimateMissingStart ? missingDaysAtStart : 0,
    };
  }

  private async computeDailySeriesKwh(
    year: number,
    month: number,
    asOf: Date,
  ): Promise<number[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const dayMap = new Map<string, number>();

    const firstRaw = await this.prisma.powerData.findFirst({
      where: { timestamp: { gte: start, lt: asOf } },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });
    const rawStart = firstRaw?.timestamp ?? asOf;

    if (start < rawStart) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: { bucketStart: { gte: start, lt: rawStart } },
        orderBy: { bucketStart: 'asc' },
        select: { bucketStart: true, powerAvg: true, bucketMinutes: true },
      });
      for (const row of aggRows) {
        const kwh = (row.powerAvg * (row.bucketMinutes / 60)) / 1_000_000;
        const day = row.bucketStart.toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + kwh);
      }
    }

    const rows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: rawStart, lt: asOf } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });

    for (let i = 0; i < rows.length - 1; i++) {
      const dt = (rows[i + 1].timestamp.getTime() - rows[i].timestamp.getTime()) / 3_600_000;
      if (dt <= 24) {
        const avgPower = (rows[i].power + rows[i + 1].power) / 2;
        const kwh = (avgPower * dt) / 1_000_000;
        const day = rows[i].timestamp.toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + kwh);
      }
    }

    return Array.from(dayMap.values());
  }

  async computeRollingStats(
    hours: number,
  ): Promise<{ kwh: number; avgPowerW: number; sampleCount: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - hours * 3_600_000);
    const RAW_DAYS = 7;
    const rawCutoff = new Date(now.getTime() - RAW_DAYS * 24 * 3_600_000);

    let totalMwh = 0;
    let powerSumMw = 0;
    let sampleCount = 0;

    // ── Part 1: PowerAgg ────────────────────────
    if (windowStart < rawCutoff) {
      const aggRows = await this.prisma.powerAgg.findMany({
        where: { bucketStart: { gte: windowStart, lt: rawCutoff } },
        orderBy: { bucketStart: 'asc' },
        select: { powerAvg: true, bucketMinutes: true, samples: true },
      });
      for (const row of aggRows) {
        totalMwh += row.powerAvg * (row.bucketMinutes / 60);
        powerSumMw += row.powerAvg * row.samples;
        sampleCount += row.samples;
      }
    }

    // ── Part 2: PowerData raw ────────────────────────
    const effectiveRawStart = windowStart > rawCutoff ? windowStart : rawCutoff;
    const rawRows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: effectiveRawStart, lte: now } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });
    sampleCount += rawRows.length;
    for (const row of rawRows) {
      powerSumMw += row.power;
    }
    for (let i = 0; i < rawRows.length - 1; i++) {
      const dt = (rawRows[i + 1].timestamp.getTime() - rawRows[i].timestamp.getTime()) / 3_600_000;
      if (dt <= 24) {
        const avgPower = (rawRows[i].power + rawRows[i + 1].power) / 2;
        totalMwh += avgPower * dt;
      }
    }

    return {
      kwh: totalMwh / 1_000_000,
      avgPowerW: sampleCount > 0 ? (powerSumMw / sampleCount) / 1000 : 0,
      sampleCount,
    };
  }

  formatReport(dto: BillingForecastDto): string {
    return [
      `[Báo cáo điện] Tháng: ${dto.month}`,
      `  Đã dùng:     ${dto.kwhSoFar.toFixed(3)} kWh`,
      `  Dự báo:      ${dto.projectedKwh.toFixed(3)} kWh`,
      `  Ước tính:    ${dto.projectedCostVnd.toLocaleString('vi-VN')} VNĐ  (${dto.priceVndPerKwh} VNĐ/kWh)`,
    ].join('\n');
  }
}
