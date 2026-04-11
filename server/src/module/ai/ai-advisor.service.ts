import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { AiBaselineService } from './ai-baseline.service';
import { PrismaService } from '../../common/prisma.service';

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

  private readonly logger = new Logger(AiAdvisorService.name);

  // Dynamic predicted hours based on 30-day historical data
  private predictedEveningHour = 18;
  private predictedEveningMinute = 30;
  
  private predictedMorningHour = 6;
  private predictedMorningMinute = 15;

  constructor(
    private baseline: AiBaselineService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.learnRoutinesFromHistory();
  }

  /**
   * Phân tích lịch sử 30 ngày để học thói quen (Routine) thực tế của người dùng.
   */
  private async learnRoutinesFromHistory() {
    try {
      this.logger.log('Đang phân tích dữ liệu 30 ngày qua để train mô hình Dự đoán hành vi...');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Lấy lịch sử biến động công suất đột ngột (hoặc ActivityLog nếu có)
      const data = await this.prisma.powerData.findMany({
        where: {
          timestamp: { gte: thirtyDaysAgo },
          power: { gt: 1000 }, // Ngưỡng bật thiết bị đáng kể (1000mW = 1W)
        },
        select: { timestamp: true }
      });

      if (data.length >= 5) {
        // Gom nhóm theo Giờ (Hour)
        const hourCounts = new Map<number, number>();
        for (const row of data) {
          const h = row.timestamp.getHours();
          hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
        }

        // Tìm giờ buổi tối được kích hoạt thiết bị nhiều nhất (Từ 17h -> 22h)
        let maxEveningCount = 0;
        let bestEveningHour = 18;
        // Tìm giờ buổi sáng nhiều nhất (Từ 5h -> 9h)
        let maxMorningCount = 0;
        let bestMorningHour = 6;

        for (const [h, count] of hourCounts.entries()) {
          if (h >= 17 && h <= 22 && count > maxEveningCount) {
            maxEveningCount = count;
            bestEveningHour = h;
          }
          if (h >= 5 && h <= 9 && count > maxMorningCount) {
            maxMorningCount = count;
            bestMorningHour = h;
          }
        }

        this.predictedEveningHour = bestEveningHour;
        this.predictedMorningHour = bestMorningHour;
        this.logger.log(`[AI Routine Learned] Buổi tối bật lúc: ${bestEveningHour}h, Buổi sáng lúc: ${bestMorningHour}h`);
      } else {
        this.logger.log('Chưa đủ Data (cần >= 5 records có dòng điện), tạm giữ mức mặc định 18h và 6h.');
      }
    } catch(err) {
      this.logger.error('Lỗi khi học Routine: ' + err.message);
    }
  }

  public getLearnedRoutineSummary(): string {
    return `AI đã học được thói quen 30 ngày qua: Bạn thường dùng thiết bị công suất cao lúc ${this.predictedMorningHour}h sáng và ${this.predictedEveningHour}h tối.`;
  }

  getAdvice(input: AdvisorInput): string[] {
    const { powerMw, led1, led2, ts = new Date() } = input;
    const advice: string[] = [];

    const W = (mw: number) => (mw / 1000).toFixed(1);

    const led1Changed = this.prevLed1 !== null && this.prevLed1 !== led1;
    const led2Changed = this.prevLed2 !== null && this.prevLed2 !== led2;
    const prevPower = this.prevPowerMw ?? powerMw;
    const expectedMw = this.baseline.expectedPowerMw(ts, led1, led2);
    const zStats = this.baseline.getZScoreStats(ts, led1, led2);
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
      const costPerDay = ((delta / 1000 / 1000) * 24 * 3000).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
      this.lastStateChangeAt = now;
      if (led1) {
        pushAdvice('led1-on', [
          ` Đèn 1 vừa bật — làm tăng tải thêm ${W(delta)} W. Tương đương tốn khoảng ${costPerDay}đ mỗi ngày nếu giữ liên tục.`,
          ` Phát hiện bật Đèn 1. Bật đèn hợp lý sẽ giúp tiết kiệm điện, đừng quên tắt khi không dùng nhé!`,
        ]);
      } else {
        pushAdvice('led1-off', [
          ` Thật tuyệt! Đèn 1 vừa tắt, giúp bạn tiết kiệm được khoảng ${costPerDay}đ mỗi ngày.`,
          ` Đèn 1 đã tắt. Hành động nhỏ tiết kiệm lớn, hệ thống cảm ơn bạn!`,
        ]);
      }
    }

    if (led2Changed) {
      const delta = Math.abs(Math.round(powerMw - prevPower));
      const costPerDay = ((delta / 1000 / 1000) * 24 * 3000).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
      this.lastStateChangeAt = now;
      if (led2) {
        pushAdvice('led2-on', [
          ` Đèn 2 vừa bật — làm tăng tải thêm ${W(delta)} W. Sẽ tốn thêm tầm ${costPerDay}đ/ngày nếu không tắt.`,
          ` Phát hiện bật Đèn 2. Nhớ tận dụng ánh sáng tự nhiên nếu được nhé!`,
        ]);
      } else {
        pushAdvice('led2-off', [
          ` Quá chuẩn! Đêm qua hoặc nãy giờ bạn đã tắt Đèn 2, tiết kiệm thêm được ${costPerDay}đ.`,
          ` Đèn 2 đã tắt, ngân sách tháng này lại rủng rỉnh thêm một chút rồi!`,
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

    const hasBaseline = zStats !== null;

    if (!led1 && !led2) {
      const standbyCritical = hasBaseline
        ? powerMw > zStats.mean + 3 * zStats.stdDev
        : powerMw >= 2200;
      const standbyElevated = hasBaseline
        ? powerMw > zStats.mean + 2 * zStats.stdDev
        : powerMw >= 1600;

      const extraMw = Math.max(0, powerMw - expected);
      const wastedVnd = Math.round((extraMw / 1000 / 1000) * 24 * 30 * 3000).toLocaleString('vi-VN');

      if (shouldFire('standby-critical', standbyCritical, 2)) {
        pushAdvice('standby-critical', [
          `️ ⚠️ Tải nền đang cao bất thường! Ước tính hóa đơn sẽ ĐỘI THÊM ${wastedVnd}đ tháng này nếu bạn không kiểm tra ngay các thiết bị chạy ngầm!`,
          `️ ⚠️ Z-Score Cảnh báo: Tải nền rò rỉ rất đắt đỏ. Bạn sẽ lãng phí ${wastedVnd}VNĐ vào cuối tháng nếu giữ mức tải này khi đã tắt đèn.`,
        ]);
      } else if (shouldFire('standby-elevated', standbyElevated, 3)) {
        pushAdvice('standby-elevated', [
          ` Điện nền dao động làm tốn kém thêm ${wastedVnd}đ/tháng. Nên rút phích cắm đồ điện khi không xài.`,
          ` Hệ thống thấy bạn đang tốn thêm chút tiền cho tải nền. Hãy xem có củ sạc hay máy bơm nào quên tắt không nhé.`,
        ]);
      }

      // ===== PREDICTIVE ACTIONS (DỰ ĐOÁN HÀNH VI THỰC TẾ) ======
      // Sử dụng giờ đã học (Learned Routine) từ cơ sở dữ liệu thay vì Hardcode!
      const minute = ts.getMinutes();
      
      // Dự đoán Tối
      if (hour === this.predictedEveningHour && minute >= 0 && minute <= 30) {
        pushAdvice('predictive-evening-lights', [
          ` Gợi ý thông minh: AI phân tích Data 30 ngày qua thấy bạn hay dùng điện lúc ${this.predictedEveningHour}h. Sắp tối rồi, bạn có muốn tôi bật chiếu sáng sớm giúp không? 🌙`,
          ` AI Tiên Đoán (Dựa trên lịch sử): Ánh sáng ngoài trời sắp giảm. Bạn có muốn kích hoạt kịch bản "Bình Minh Tối" như thói quen ${this.predictedEveningHour}h mọi ngày không?`,
        ]);
      }
      
      // Dự đoán Sáng
      if (hour === this.predictedMorningHour && minute >= 0 && minute <= 30) {
        pushAdvice('predictive-morning-lights', [
          ` Gợi ý thông minh: AI phân tích thói quen sáng quanh mức ${this.predictedMorningHour}h của bạn! Bạn có muốn ngắt điện các thiết bị ban đêm không? ☀️`
        ]);
      }

    } else {
      const loadVeryHigh = hasBaseline
        ? powerMw > zStats.mean + 3 * zStats.stdDev
        : powerMw >= 4500;
      const loadHigh = hasBaseline
        ? powerMw > zStats.mean + 2 * zStats.stdDev
        : powerMw >= 3500;

      const extraMw = Math.max(0, Math.abs(powerMw - expected));
      const wastedVnd = Math.round((extraMw / 1000 / 1000) * 3000).toLocaleString('vi-VN');

      if (shouldFire('load-very-high', loadVeryHigh, 2)) {
        pushAdvice('load-very-high', [
          `️ ⚠️ Cảnh báo tiền điện! Thiết bị công suất khủng đang đốt của bạn khoảng ${wastedVnd}đ MỖI GIỜ. Hãy tắt ngay bình nóng lạnh hoặc thiết bị nặng nếu không dùng!`,
          `️ ⚠️ Bất thường Cấp độ 3 (Z-Score): Tải đỉnh báo động đỏ. Bạn đang đốt tiền điện rất nhanh (${wastedVnd}đ/giờ). Ưu tiên giảm công suất lập tức!`,
        ]);
      } else if (shouldFire('load-high', loadHigh, 3)) {
        pushAdvice('load-high', [
          ` Đang có thiết bị tiêu thụ khá mạnh, tốn khoảng ${wastedVnd}đ/giờ. Chú ý chi phí nhé!`,
          ` Cảnh báo chi phí: Công suất đang vọt lên, hệ thống ghi nhận bạn đang xài lố so với thói quen hằng ngày.`,
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
