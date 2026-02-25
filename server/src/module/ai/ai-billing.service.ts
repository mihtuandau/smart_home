/**
 * ai-billing.service.ts
 *
 * Tương đương billing_predictor.py trong AI_SmartHome.
 *
 * - Tính tổng kWh tháng hiện tại từ bảng power_data (piecewise-constant integration)
 * - Dự báo kWh và chi phí đến cuối tháng
 * - Khoảng tin cậy 95% theo phân phối chuẩn
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BillingForecastDto } from './dto/ai-result.dto';

const DEFAULT_PRICE_VND_PER_KWH = parseFloat(process.env.ELECTRICITY_PRICE ?? '3000');

@Injectable()
export class AiBillingService {
  private readonly logger = new Logger(AiBillingService.name);

  constructor(private prisma: PrismaService) {}

  // ── Monthly energy computation ───────────────────────────────────────────────

  /**
   * Tương đương compute_monthly_energy_kwh().
   * Tích phân piecewise-constant: Σ (power_i * Δt_i).
   */
  async computeMonthlyEnergyKwh(year: number, month: number): Promise<number> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = month === 12
      ? new Date(Date.UTC(year + 1, 0, 1))
      : new Date(Date.UTC(year, month, 1));

    const rows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: start, lt: end } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });

    if (rows.length < 2) return 0;

    let totalWh = 0;
    for (let i = 0; i < rows.length - 1; i++) {
      const dt = (rows[i + 1].timestamp.getTime() - rows[i].timestamp.getTime()) / 3_600_000; // hours
      totalWh += rows[i].power * dt; // power in W * hours = Wh
    }

    return totalWh / 1000; // kWh
  }

  // ── Projection ───────────────────────────────────────────────────────────────

  /**
   * Tương đương project_monthly_energy_and_cost().
   */
  async projectMonthly(
    asOf: Date = new Date(),
    priceVnd: number = DEFAULT_PRICE_VND_PER_KWH,
  ): Promise<BillingForecastDto> {
    const year = asOf.getUTCFullYear();
    const month = asOf.getUTCMonth() + 1;

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end   = month === 12
      ? new Date(Date.UTC(year + 1, 0, 1))
      : new Date(Date.UTC(year, month, 1));

    const daysInMonth = (end.getTime() - start.getTime()) / 86_400_000;
    const elapsedDays = Math.max((asOf.getTime() - start.getTime()) / 86_400_000, 1 / 24);

    const kwhSoFar = await this.computeMonthlyEnergyKwh(year, month);

    // Daily consumption series
    const dailySeries = await this.computeDailySeriesKwh(year, month, asOf);

    let meanDaily: number;
    let stdDaily: number;
    let nDays: number;

    if (dailySeries.length > 0) {
      meanDaily = dailySeries.reduce((s, v) => s + v, 0) / dailySeries.length;
      const variance = dailySeries.reduce((s, v) => s + Math.pow(v - meanDaily, 2), 0) / dailySeries.length;
      stdDaily = Math.sqrt(variance);
      nDays = dailySeries.length;
    } else {
      meanDaily = kwhSoFar / elapsedDays;
      stdDaily = 0;
      nDays = 1;
    }

    const remainingDays = Math.max(daysInMonth - elapsedDays, 0);
    const projectedKwh = kwhSoFar + meanDaily * remainingDays;

    // 95% CI
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

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private async computeDailySeriesKwh(year: number, month: number, asOf: Date): Promise<number[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const rows = await this.prisma.powerData.findMany({
      where: { timestamp: { gte: start, lt: asOf } },
      orderBy: { timestamp: 'asc' },
      select: { power: true, timestamp: true },
    });

    if (rows.length < 2) return [];

    const dayMap = new Map<string, number>(); // "YYYY-MM-DD" → kWh

    for (let i = 0; i < rows.length - 1; i++) {
      const dt = (rows[i + 1].timestamp.getTime() - rows[i].timestamp.getTime()) / 3_600_000;
      const wh = rows[i].power * dt;
      const day = rows[i].timestamp.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + wh / 1000);
    }

    return Array.from(dayMap.values());
  }

  /** Format human-readable monthly report (mirrors format_monthly_report). */
  formatReport(dto: BillingForecastDto): string {
    return [
      `[Báo cáo điện] Tháng: ${dto.month}`,
      `  Đã dùng:     ${dto.kwhSoFar.toFixed(3)} kWh`,
      `  Dự báo:      ${dto.projectedKwh.toFixed(3)} kWh  [CI 95%: ${dto.ciLow.toFixed(2)} – ${dto.ciHigh.toFixed(2)}]`,
      `  Ước tính:    ${dto.projectedCostVnd.toLocaleString('vi-VN')} VNĐ  (${dto.priceVndPerKwh} VNĐ/kWh)`,
    ].join('\n');
  }
}
