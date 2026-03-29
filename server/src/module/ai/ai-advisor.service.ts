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

  constructor(private baseline: AiBaselineService) {}

  getAdvice(input: AdvisorInput): string[] {
    const { powerMw, led1, led2, ts = new Date() } = input;
    const advice: string[] = [];

    const W = (mw: number) => (mw / 1000).toFixed(1);

    const led1Changed = this.prevLed1 !== null && this.prevLed1 !== led1;
    const led2Changed = this.prevLed2 !== null && this.prevLed2 !== led2;
    const prevPower = this.prevPowerMw ?? powerMw;

    if (led1Changed) {
      const delta = Math.abs(Math.round(powerMw - prevPower));
      if (led1) {
        advice.push(
          ` Đèn 1 vừa bật — điện tăng thêm ${W(delta)} W (đang dùng: ${W(powerMw)} W)`,
        );
      } else {
        advice.push(
          ` Đèn 1 vừa tắt — điện giảm ${W(delta)} W (hiện tiêu thụ: ${W(powerMw)} W)`,
        );
      }
    }

    if (led2Changed) {
      const delta = Math.abs(Math.round(powerMw - prevPower));
      if (led2) {
        advice.push(
          ` Đèn 2 vừa bật — điện tăng thêm ${W(delta)} W (đang dùng: ${W(powerMw)} W)`,
        );
      } else {
        advice.push(
          ` Đèn 2 vừa tắt — điện giảm ${W(delta)} W (hiện tiêu thụ: ${W(powerMw)} W)`,
        );
      }
    }

    if (!led1Changed && !led2Changed) {
      const expectedMw = this.baseline.expectedPowerMw(ts, led1, led2);

      if (!led1 && !led2) {
        const normalMw = expectedMw ?? 800;
        const abnormalThreshold = normalMw * 1.3;
        if (powerMw > abnormalThreshold) {
          advice.push(
            `️ Điện vẫn cao dù đèn đã tắt hết (${W(powerMw)} W, mức thường: ~${W(normalMw)} W) — có thiết bị nào quên tắt không?`,
          );
        }
      } else {
        if (led1 && led2) {
          advice.push(
            ' Gợi ý: Tắt bớt đèn không cần thiết để tiết kiệm điện',
          );
        }
        if (expectedMw != null && powerMw > expectedMw * 1.4) {
          const pct = Math.round((powerMw / expectedMw - 1) * 100);
          advice.push(
            ` Điện đang cao hơn mức thường ${pct}% — đang dùng ${W(powerMw)} W thay vì ~${W(expectedMw)} W như thường lệ`,
          );
        }
      }
    }

    this.prevLed1 = led1;
    this.prevLed2 = led2;
    this.prevPowerMw = powerMw;

    return advice;
  }
}
