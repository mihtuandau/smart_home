/**
 * ai-advisor.service.ts
 *
 * Tương đương ai_advisor.py trong AI_SmartHome.
 *
 * Đưa ra lời khuyên tiết kiệm điện dựa trên trạng thái hiện tại và baseline.
 */
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
  constructor(private baseline: AiBaselineService) {}

  /**
   * Tương đương energy_advice().
   * Trả về mảng string lời khuyên (rỗng nếu không có gì bất thường).
   */
  getAdvice(input: AdvisorInput): string[] {
    const { powerMw, led1, led2, ts = new Date() } = input;
    const advice: string[] = [];

    // Lấy ngưỡng từ baseline nếu có, fallback về giá trị cứng
    const expectedMw = this.baseline.expectedPowerMw(ts);
    const highThreshold = expectedMw != null ? expectedMw * 1.5 : 2500;
    const backgroundThreshold = expectedMw != null ? expectedMw * 0.8 : 1500;

    if (led1 && led2 && powerMw > 2000) {
      advice.push('💡 Gợi ý: Nên tắt bớt đèn khi không sử dụng');
    }

    if (powerMw > highThreshold) {
      if (expectedMw != null) {
        const pct = Math.round((powerMw / expectedMw - 1) * 100);
        advice.push(`🔋 Gợi ý: Công suất cao hơn mức bình thường ${pct}%, nên kiểm tra thiết bị tiêu thụ`);
      } else {
        advice.push('🔋 Gợi ý: Công suất cao, nên kiểm tra thiết bị tiêu thụ');
      }
    }

    if (!led1 && !led2 && powerMw > backgroundThreshold) {
      advice.push('⚠️ AI Nhận xét: Có tải điện nền bất thường khi không bật đèn');
    }

    return advice;
  }
}
