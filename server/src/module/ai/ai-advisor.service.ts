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
  private led1StartedAt: number | null = null;
  private led2StartedAt: number | null = null;

  private static readonly ADVICE_COOLDOWN_MS = 10 * 1000; // 10 seconds for demo
  private static readonly POST_SWITCH_SETTLE_MS = 3 * 1000;  // 3 seconds

  private readonly logger = new Logger(AiAdvisorService.name);
  private readonly routineTimeZone = process.env.AI_ROUTINE_TIMEZONE ?? 'Asia/Ho_Chi_Minh';
  private routineSamples = 0;
  private routineLearned = false;

  // Dynamic predicted hours based on 30-day historical data
  private predictedEveningHour = 18;
  private predictedEveningMinute = 30;
  
  private predictedMorningHour = 6;
  private predictedMorningMinute = 15;

  private getHourInRoutineTimeZone(ts: Date): number {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        hour12: false,
        timeZone: this.routineTimeZone,
      }).formatToParts(ts);
      const hourPart = parts.find((p) => p.type === 'hour')?.value;
      const hour = Number(hourPart);
      return Number.isFinite(hour) ? hour : ts.getUTCHours();
    } catch {
      return ts.getUTCHours();
    }
  }

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
      this.logger.log('Đang phân tích dữ liệu 30 ngày (kết hợp Raw + Aggregated) để học thói quen...');
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 1. Lấy dữ liệu chi tiết (7 ngày qua)
      const rawData = await this.prisma.powerData.findMany({
        where: {
          timestamp: { gte: sevenDaysAgo },
          power: { gt: 100 }, 
        },
        select: { timestamp: true }
      });

      // 2. Lấy dữ liệu tổng hợp (23 ngày trước đó)
      const aggData = await this.prisma.powerAgg.findMany({
        where: {
          bucketStart: { gte: thirtyDaysAgo, lt: sevenDaysAgo },
          powerAvg: { gt: 100 },
        },
        select: { bucketStart: true, samples: true }
      });

      this.routineSamples = rawData.length + aggData.reduce((s, a) => s + a.samples, 0);

      if (this.routineSamples >= 5) {
        const hourCounts = new Map<number, number>();

        // Gom nhóm từ dữ liệu chi tiết
        for (const row of rawData) {
          const h = this.getHourInRoutineTimeZone(row.timestamp);
          hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
        }

        // Gom nhóm từ dữ liệu tổng hợp (nhân với số mẫu để đảm bảo trọng số)
        for (const row of aggData) {
          const h = this.getHourInRoutineTimeZone(row.bucketStart);
          hourCounts.set(h, (hourCounts.get(h) || 0) + (row.samples || 1));
        }

        // Tìm giờ buổi tối (16h -> 23h)
        let maxEveningCount = 0;
        let bestEveningHour = 18;
        // Tìm giờ buổi sáng (4h -> 11h)
        let maxMorningCount = 0;
        let bestMorningHour = 6;

        for (const [h, count] of hourCounts.entries()) {
          if (h >= 16 && h <= 23 && count > maxEveningCount) {
            maxEveningCount = count;
            bestEveningHour = h;
          }
          if (h >= 4 && h <= 11 && count > maxMorningCount) {
            maxMorningCount = count;
            bestMorningHour = h;
          }
        }

        this.predictedEveningHour = bestEveningHour;
        this.predictedMorningHour = bestMorningHour;
        this.routineLearned = true;
        this.logger.log(
          `[AI Routine Learned] Kết hợp Raw+Agg, samples=${this.routineSamples}, ` +
            `Tối: ${bestEveningHour}h, Sáng: ${bestMorningHour}h`,
        );
      } else {
        this.routineLearned = false;
        this.logger.log('Chưa đủ Data (cần >= 5 records có dòng điện), tạm giữ mức mặc định 18h và 6h.');
      }
    } catch (err: unknown) {
      this.routineLearned = false;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Lỗi khi học Routine: ' + message);
    }
  }

  public getLearnedRoutineSummary(): string {
    if (!this.routineLearned) {
      return `AI đang học thói quen dùng điện 30 ngày qua (đã thu thập ${this.routineSamples} mẫu), chưa đủ dữ liệu để kết luận khung giờ ổn định.`;
    }
    return `AI đã phân tích thói quen 30 ngày qua (${this.routineSamples} mẫu, múi giờ ${this.routineTimeZone}): bạn thường dùng thiết bị công suất cao vào khoảng ${this.predictedMorningHour}h sáng và ${this.predictedEveningHour}h chiều/tối.`;
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
    const hour = this.getHourInRoutineTimeZone(ts);

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
        this.led1StartedAt = now;
        const dailyCost = Math.round((delta / 1000000) * 24 * 3000);
        const costInfo = delta > 2000 
          ? ` — làm tăng tải thêm ${W(delta)} W (tốn ~${dailyCost.toLocaleString('vi-VN')}đ/ngày nếu bật liên tục).` 
          : '.';
        pushAdvice('led1-on', [
          ` Phòng khách vừa bật${costInfo}`,
          ` Phát hiện bật đèn Phòng khách. Đừng quên tắt khi không dùng để tối ưu điện năng nhé!`,
        ]);
      } else {
        this.led1StartedAt = null;
        const dailySave = Math.round((delta / 1000000) * 24 * 3000);
        const saveInfo = delta > 2000 
          ? `, giúp bạn tiết kiệm được khoảng ${dailySave.toLocaleString('vi-VN')}đ mỗi ngày.` 
          : '.';
        pushAdvice('led1-off', [
          ` Thật tuyệt! Đèn Phòng khách vừa tắt${saveInfo}`,
          ` Đèn Phòng khách đã tắt. Hệ thống cảm ơn hành động tiết kiệm điện của bạn!`,
        ]);
      }
    }

    if (led2Changed) {
      const delta = Math.abs(Math.round(powerMw - prevPower));
      this.lastStateChangeAt = now;
      if (led2) {
        this.led2StartedAt = now;
        const dailyCost = Math.round((delta / 1000000) * 24 * 3000);
        const costInfo = delta > 2000 
          ? ` — làm tăng tải thêm ${W(delta)} W (tốn ~${dailyCost.toLocaleString('vi-VN')}đ/ngày).` 
          : '.';
        pushAdvice('led2-on', [
          ` Đèn Ban công vừa bật${costInfo}`,
          ` Phát hiện bật đèn Ban công. Nhớ tận dụng ánh sáng tự nhiên nếu được nhé!`,
        ]);
      } else {
        this.led2StartedAt = null;
        const dailySave = Math.round((delta / 1000000) * 24 * 3000);
        const saveInfo = delta > 2000 
          ? `, tiết kiệm thêm được ${dailySave.toLocaleString('vi-VN')}đ cho gia đình.` 
          : '.';
        pushAdvice('led2-off', [
          ` Quá chuẩn! Bạn đã tắt đèn Ban công${saveInfo}`,
          ` Đèn Ban công đã tắt, ngân sách tháng này lại rủng rỉnh thêm một chút rồi!`,
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
        ? powerMw > zStats.mean + 3 * zStats.stdDev && powerMw > 10000
        : powerMw >= 10000; // > 10W
      const standbyElevated = hasBaseline
        ? powerMw > zStats.mean + 2 * zStats.stdDev && powerMw > 5000
        : powerMw >= 5000;  // > 5W as per documentation

      const extraMw = Math.max(0, powerMw - expected);
      const wastedVnd = Math.round((extraMw / 1000 / 1000) * 24 * 30 * 3000).toLocaleString('vi-VN');

      if (shouldFire('standby-critical', standbyCritical, 2)) {
        pushAdvice('standby-critical', [
          `️ ⚠️ Cảnh báo: Tiền điện tháng này có nguy cơ tăng mạnh! Hệ thống phát hiện các thiết bị chạy ngầm đang tiêu tốn của bạn khoảng ${wastedVnd}đ mỗi tháng. Hãy kiểm tra và ngắt điện các thiết bị không dùng đến nhé!`,
          `️ ⚠️ Nhắc nhở: Bạn đang lãng phí khoảng ${wastedVnd}đ/tháng cho các thiết bị ở chế độ chờ. Hãy rút phích cắm để bảo vệ túi tiền của mình!`,
        ]);
      } else if (shouldFire('standby-elevated', standbyElevated, 3)) {
        pushAdvice('standby-elevated', [
          ` Tiền điện đang nhích lên một chút do các thiết bị chạy ngầm (khoảng ${wastedVnd}đ/tháng). Một hành động nhỏ như tắt công tắc sẽ giúp bạn tiết kiệm hơn đấy.`,
          ` Có vẻ như đang có vài thiết bị (như củ sạc, máy bơm...) đang chạy lãng phí. Bạn hãy kiểm tra lại nhé!`,
        ]);
      }

      // ===== PREDICTIVE ACTIONS (DỰ ĐOÁN HÀNH VI THỰC TẾ) ======
      // Sử dụng giờ đã học (Learned Routine) từ cơ sở dữ liệu thay vì Hardcode!
      const minute = ts.getMinutes();
      
      // Dự đoán Tối
      if (hour === this.predictedEveningHour && minute >= 0 && minute <= 30) {
        pushAdvice('predictive-evening-lights', [
          ` Gợi ý thông minh: AI phân tích dữ liệu 30 ngày qua thấy bạn hay dùng điện lúc ${this.predictedEveningHour}h. Sắp tối rồi, bạn có muốn tôi bật chiếu sáng sớm giúp không? 🌙`,
          ` AI Tiên Đoán: Ánh sáng ngoài trời sắp giảm. Bạn có muốn kích hoạt kịch bản "Bình Minh Tối" như thói quen ${this.predictedEveningHour}h mọi ngày không?`,
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
        ? (powerMw > zStats.mean + 3 * zStats.stdDev && powerMw > 1000000) // Phải > 1000W mới báo Rất Cao
        : powerMw >= 1000000; // > 1000W
      const loadHigh = hasBaseline
        ? (powerMw > zStats.mean + 2 * zStats.stdDev && powerMw > 500000)  // Phải > 500W mới báo Cao
        : powerMw >= 500000;  // > 500W

      const extraMw = Math.max(0, Math.abs(powerMw - expected));
      const wastedVnd = Math.round((extraMw / 1000 / 1000) * 3000).toLocaleString('vi-VN');

      if (shouldFire('load-very-high', loadVeryHigh, 2)) {
        pushAdvice('load-very-high', [
          `️ ⚠️ Cảnh báo chi phí: Bạn đang sử dụng thiết bị công suất rất lớn, tiêu tốn khoảng ${wastedVnd}đ mỗi giờ. Nếu không thực sự cần thiết, bạn hãy tắt bớt để tiết kiệm điện nhé!`,
          `️ ⚠️ Hệ thống ghi nhận mức tiêu thụ điện đang tăng vọt (${wastedVnd}đ/giờ). Bạn nên kiểm tra xem có thiết bị nào đang bật quá mức cần thiết không.`,
        ]);
      } else if (shouldFire('load-high', loadHigh, 3)) {
        pushAdvice('load-high', [
          ` Công suất điện đang ở mức khá cao, tiêu tốn khoảng ${wastedVnd}đ mỗi giờ. Bạn chú ý cân đối sử dụng nhé!`,
          ` Nhắc nhở: Mức dùng điện hiện tại đang cao hơn so với thói quen hàng ngày của bạn.`,
        ]);
      }

      if (led1 && led2) {
        pushAdvice('both-led-tip', [
          ' Gợi ý tối ưu: Bạn đang dùng cả Phòng khách và Ban công, có thể tắt bớt nếu độ sáng đã đủ dùng.',
          ' Cảnh báo: Việc bật nhiều đèn cùng lúc làm tăng hóa đơn điện. Hãy chỉ bật những nơi thực sự cần thiết!',
        ]);
      }

      // Kiểm tra thời gian sử dụng liên tục (Usage Duration)
      if (this.led1StartedAt && (now - this.led1StartedAt > 2 * 60 * 60 * 1000)) {
        pushAdvice('led1-long-usage', [
          ` Nhận xét: Dựa vào mức độ sử dụng, bạn đã bật đèn Phòng khách liên tục hơn 2 tiếng. Nếu không có người ở đó, bạn nên tắt đi để tiết kiệm điện.`,
          ` Khuyến nghị: Đèn Phòng khách đã bật khá lâu rồi, hãy tắt bớt trong khung giờ này để tối ưu hóa hóa đơn tháng này nhé!`
        ]);
      }
      if (this.led2StartedAt && (now - this.led2StartedAt > 2 * 60 * 60 * 1000)) {
        pushAdvice('led2-long-usage', [
          ` Cảnh báo: Đèn Ban công đã sáng liên tục hơn 2 giờ. Bạn nên tắt thiết bị này nếu không thực sự cần thiết lúc này.`,
        ]);
      }
    }

    const deltaMw = powerMw - prevPower;
    const significantSpike = !led1Changed && !led2Changed && Math.abs(deltaMw) >= 500000; // Threshold: 500W
    if (shouldFire('power-spike', significantSpike, 3)) {
      const trend = deltaMw > 0 ? 'tăng' : 'giảm';
      pushAdvice('power-spike', [
        `️ Công suất điện vừa tăng đột ngột thêm ${W(Math.abs(deltaMw))} W — Bạn có vừa bật thêm thiết bị nặng nào không?`,
        ` Phát hiện thay đổi công suất lớn (${trend} ${W(Math.abs(deltaMw))} W). Bạn hãy kiểm tra lại các thiết bị trong nhà nhé!`,
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
