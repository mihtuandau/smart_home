import { Injectable, Logger } from '@nestjs/common';

export interface WeeklyData {
  kwhTotal: number;
  ledForgotCount: number;
  highPeakCount: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;

  private formatKwh(value: unknown): string {
    const num = typeof value === 'number' ? value : Number(value ?? 0);
    if (!Number.isFinite(num)) return '0.000';
    return num.toFixed(3);
  }

  constructor() {
    if (this.apiKey) {
      this.logger.log('Gemini API Rest mode initialized for summaries.');
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. Tính năng AI đang tắt.');
    }
  }

  async generateWeeklySummary(data: WeeklyData): Promise<string> {
    if (!this.apiKey) {
      return `Tuần qua gia đình đã sử dụng ${this.formatKwh(data.kwhTotal)} kWh. Đã để quên đèn ban đêm ${data.ledForgotCount} lần và thiết lập đỉnh tải ${data.highPeakCount} lần. Chú ý tiết kiệm điện nhé!`;
    }

    try {
      this.logger.log('Generating AI summary via Gemini REST...');
      const prompt = `Bạn là "Quản gia AI SmartHome" tên là Mina của gia đình. Dưới đây là dữ liệu tiêu thụ điện tuần qua của gia đình:
    - Tiêu thụ tổng cộng: ${this.formatKwh(data.kwhTotal)} kWh
- Số lần quên tắt đèn ban đêm: ${data.ledForgotCount}
- Số lần tải nhảy vọt/vượt đỉnh cao: ${data.highPeakCount}

Hãy viết một đoạn TÓM TẮT THÔNG MINH khoảng 3-4 câu. Văn phong: thân thiện, chuyên nghiệp, khuyên nhủ cách tiết kiệm một cách tự nhiên. Dùng định dạng văn bản bình thường, không dùng in đậm hay markdown phức tạp.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error: ${res.status} ${errText}`);
      }

      const json = (await res.json()) as GeminiResponse;
      const answer = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      return answer ?? 'Không thể tạo bản tóm tắt thông minh lúc này.';
    } catch (error) {
      this.logger.error('Failed to generate summary with Gemini REST:', error);
      return `Tuần qua gia đình đã sử dụng ${this.formatKwh(data.kwhTotal)} kWh. Đã để quên đèn ban đêm ${data.ledForgotCount} lần và thiết lập đỉnh tải ${data.highPeakCount} lần. Chú ý tiết kiệm điện nhé!`;
    }
  }
}
