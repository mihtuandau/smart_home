import { Injectable } from '@nestjs/common';
import { AiBaselineService } from './ai-baseline.service';

export interface AdvisorInput {
  powerMw: number;
  led1: boolean;
  led2: boolean;
  ts?: Date;
}

@Injectable()
export class AiAdvisorService {
  private prevLed1: boolean | null = null;
  private prevLed2: boolean | null = null;
  private prevPowerMw: number | null = null;
  private lastStateChangeAt: number | null = null;
  private readonly lastAdviceAt = new Map<string, number>();
  private readonly adviceVariantCursor = new Map<string, number>();
  private readonly streakByCondition = new Map<string, number>();

  private static readonly ADVICE_COOLDOWN_MS = 2 * 60 * 1000;
  private static readonly POST_SWITCH_SETTLE_MS = 45 * 1000;

  constructor(private baseline: AiBaselineService) {}

  getAdvice(input: AdvisorInput): string[] {
    const { powerMw, led1, led2, ts = new Date() } = input;
    const advice: string[] = [];

    const W = (mw: number) => (mw / 1000).toFixed(1);

    const led1Changed = this.prevLed1 !== null && this.prevLed1 !== led1;
    const led2Changed = this.prevLed2 !== null && this.prevLed2 !== led2;
    const prevPower = this.prevPowerMw ?? powerMw;
    const expectedMw = this.baseline.expectedPowerMw(ts, led1, led2);
    const expected = expectedMw ?? (led1 || led2 ? 1600 : 800);
    const ratio = expected > 0 ? powerMw / expected : 1;
    const now = ts.getTime();
    const hour = ts.getHours();

    const bumpStreak = (key: string, met: boolean): number => {
      const next = met ? (this.streakByCondition.get(key) ?? 0) + 1 : 0;
      this.streakByCondition.set(key, next);
      return next;
    };

    const shouldFire = (key: string, met: boolean, persistCount: number): boolean => {
      const streak = bumpStreak(key, met);
      return met && streak >= persistCount;
    };

    const pushAdvice = (key: string, variants: string[]) => {
      const last = this.lastAdviceAt.get(key);
      if (last && now - last < AiAdvisorService.ADVICE_COOLDOWN_MS) {
        return;
      }

      const cursor = this.adviceVariantCursor.get(key) ?? 0;
      const text = variants[cursor % variants.length];
      advice.push(text);

      this.adviceVariantCursor.set(key, cursor + 1);
      this.lastAdviceAt.set(key, now);
    };

    if (led1Changed) {
      const delta = Math.abs(Math.round(powerMw - prevPower));
      this.lastStateChangeAt = now;
      if (led1) {
        pushAdvice('led1-on', [
          ` Đèn 1 vừa bật — điện tăng thêm ${W(delta)} W (đang dùng: ${W(powerMw)} W)`,
          ` Phát hiện bật Đèn 1, công suất tăng khoảng ${W(delta)} W (hiện tại: ${W(powerMw)} W)`,
        ]);
      } else {
        pushAdvice('led1-off', [
          ` Đèn 1 vừa tắt — điện giảm ${W(delta)} W (hiện tiêu thụ: ${W(powerMw)} W)`,
          ` Đèn 1 đã tắt, công suất giảm khoảng ${W(delta)} W (còn: ${W(powerMw)} W)`,
        ]);
      }
    }

    if (led2Changed) {
      const delta = Math.abs(Math.round(powerMw - prevPower));
      this.lastStateChangeAt = now;
      if (led2) {
        pushAdvice('led2-on', [
          ` Đèn 2 vừa bật — điện tăng thêm ${W(delta)} W (đang dùng: ${W(powerMw)} W)`,
          ` Phát hiện bật Đèn 2, công suất tăng khoảng ${W(delta)} W (hiện tại: ${W(powerMw)} W)`,
        ]);
      } else {
        pushAdvice('led2-off', [
          ` Đèn 2 vừa tắt — điện giảm ${W(delta)} W (hiện tiêu thụ: ${W(powerMw)} W)`,
          ` Đèn 2 đã tắt, công suất giảm khoảng ${W(delta)} W (còn: ${W(powerMw)} W)`,
        ]);
      }
    }

    const inSettleWindow =
      this.lastStateChangeAt !== null &&
      now - this.lastStateChangeAt < AiAdvisorService.POST_SWITCH_SETTLE_MS;

    if (inSettleWindow) {
      this.prevLed1 = led1;
      this.prevLed2 = led2;
      this.prevPowerMw = powerMw;
      return advice;
    }

    const hasBaseline = expectedMw !== null;

    if (!led1 && !led2) {
      const standbyCritical = hasBaseline
        ? ratio >= 1.7
        : powerMw >= 2200;
      const standbyElevated = hasBaseline
        ? ratio >= 1.3
        : powerMw >= 1600;

      if (shouldFire('standby-critical', standbyCritical, 2)) {
        const pct = Math.round((ratio - 1) * 100);
        pushAdvice('standby-critical', [
          `️ Điện nền đang cao bất thường (${W(powerMw)} W, cao hơn ~${pct}% so với mức thường ${W(expected)} W) — nên kiểm tra thiết bị chạy ngầm`,
          `️ Cảnh báo tải nền: dù tắt đèn, hệ thống vẫn tiêu thụ ${W(powerMw)} W (mức thường ~${W(expected)} W)`,
        ]);
      } else if (shouldFire('standby-elevated', standbyElevated, 3)) {
        pushAdvice('standby-elevated', [
          ` Điện nền hơi cao (${W(powerMw)} W so với ~${W(expected)} W) — có thể còn thiết bị chờ`,
          ` Quan sát tải nền: hiện ${W(powerMw)} W, cao hơn mức thường khi tắt đèn`,
        ]);
      }
    } else {
      const loadVeryHigh = hasBaseline
        ? ratio >= 1.8
        : powerMw >= 4500;
      const loadHigh = hasBaseline
        ? ratio >= 1.4
        : powerMw >= 3500;

      if (shouldFire('load-very-high', loadVeryHigh, 2)) {
        const pct = Math.round((ratio - 1) * 100);
        pushAdvice('load-very-high', [
          `️ Công suất đang vượt mức thường ${pct}% (${W(powerMw)} W so với ~${W(expected)} W) — ưu tiên kiểm tra thiết bị công suất lớn`,
          `️ Hệ thống đang ở mức tiêu thụ cao (${W(powerMw)} W), vượt xa baseline theo trạng thái đèn hiện tại`,
        ]);
      } else if (shouldFire('load-high', loadHigh, 3)) {
        const pct = Math.round((ratio - 1) * 100);
        pushAdvice('load-high', [
          ` Điện đang cao hơn baseline khoảng ${pct}% (${W(powerMw)} W / ~${W(expected)} W)`,
          ` Tải điện cao hơn bình thường (${W(powerMw)} W), cân nhắc tắt thiết bị chưa cần`,
        ]);
      }

      if (led1 && led2) {
        if (hour >= 18 && hour <= 22) {
          pushAdvice('peak-hour-tip', [
            ' Giờ cao điểm: đang bật cả 2 đèn, nên giảm bớt nếu không cần để tiết kiệm chi phí',
            ' Khung giờ tối thường tải cao, có thể tắt bớt 1 đèn để giảm công suất tức thời',
          ]);
        } else {
          pushAdvice('both-led-tip', [
            ' Gợi ý: bật đồng thời 2 đèn chỉ khi cần thiết để tối ưu điện năng',
            ' Nếu độ sáng đã đủ, bạn có thể tắt bớt một đèn để giảm tiêu thụ',
          ]);
        }
      }
    }

    const deltaMw = powerMw - prevPower;
    const significantSpike = !led1Changed && !led2Changed && Math.abs(deltaMw) >= 1100;
    if (shouldFire('power-spike', significantSpike, 2)) {
      const trend = deltaMw > 0 ? 'tăng' : 'giảm';
      pushAdvice('power-spike', [
        `️ Công suất vừa ${trend} nhanh ${W(Math.abs(deltaMw))} W dù trạng thái đèn không đổi — nên kiểm tra tải tức thời`,
        ` Phát hiện dao động công suất lớn (${trend} ${W(Math.abs(deltaMw))} W) không do chuyển trạng thái đèn`,
      ]);
    }

    if ((led1 || led2) && hour >= 23) {
      pushAdvice('late-night-tip', [
        ' Khuya rồi, nếu không cần thiết có thể tắt bớt đèn để giảm tiêu thụ nền ban đêm',
        ' Gợi ý ban đêm: ưu tiên dùng ít đèn hơn để tiết kiệm điện và tăng tuổi thọ thiết bị',
      ]);
    }

    this.prevLed1 = led1;
    this.prevLed2 = led2;
    this.prevPowerMw = powerMw;

    return advice;
  }
}
