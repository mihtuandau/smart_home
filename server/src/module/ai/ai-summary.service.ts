import { Injectable, Logger } from '@nestjs/common';

export interface WeeklyData {
  kwhTotal: number;
  ledForgotCount: number;
  highPeakCount: number;
}

export interface UnifiedAiContext extends WeeklyData {
  billingForecast: any; // Forecast and cost structure
  advisorAdvice: any;   // Array of rules or strings from AiAdvisor
  baselineStatus: any;  // Current baseline z-score stuff
  currentStatus?: {
    sensor: any;
    power: any;
  }
}

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;

  constructor() {
    if (this.apiKey) {
      this.logger.log('Gemini API Rest mode initialized for summaries.');
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. Tính năng AI đang tắt.');
    }
  }

  async generateWeeklySummary(data: WeeklyData): Promise<string> {
    if (!this.apiKey) {
      return `Tuần qua gia đình đã sử dụng ${data.kwhTotal} kWh. Đã để quên đèn ban đêm ${data.ledForgotCount} lần và thiết lập đỉnh tải ${data.highPeakCount} lần. Chú ý tiết kiệm điện nhé!`;
    }

    try {
      this.logger.log('Generating AI summary via Gemini REST...');
      const prompt = `Bạn là "Quản gia AI SmartHome" tên là Mina của gia đình. Dưới đây là dữ liệu tiêu thụ điện tuần qua của gia đình:
- Tiêu thụ tổng cộng: ${data.kwhTotal} kWh
- Số lần quên tắt đèn ban đêm: ${data.ledForgotCount}
- Số lần tải nhảy vọt/vượt đỉnh cao: ${data.highPeakCount}

Hãy viết một đoạn TÓM TẮT THÔNG MINH khoảng 3-4 câu. Văn phong: thân thiện, chuyên nghiệp, khuyên nhủ cách tiết kiệm một cách tự nhiên. Dùng định dạng văn bản bình thường, không dùng in đậm hay markdown phức tạp.`;
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error: ${res.status} ${errText}`);
      }

      const json = await res.json();
      const answer = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return answer ?? 'Không thể tạo bản tóm tắt thông minh lúc này.';
    } catch (error) {
      this.logger.error('Failed to generate summary with Gemini REST:', error);
      return `Tuần qua gia đình đã sử dụng ${data.kwhTotal} kWh. Đã để quên đèn ban đêm ${data.ledForgotCount} lần và thiết lập đỉnh tải ${data.highPeakCount} lần. Chú ý tiết kiệm điện nhé!`;
    }
  }

  async chatWithMina(question: string, context: UnifiedAiContext): Promise<string> {
    if (!this.apiKey) return 'API Key chưa được cấu hình. Tính năng chat tạm khóa.';
    
    // Explicitly lock to gemini-2.5-flash to bypass limit=20
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const prompt = `Bạn là Quản gia AI SmartHome tên Mina cực kỳ thông minh. Bạn quản lý hệ thống phân tích năng lượng phức tạp.
Dưới đây là TOÀN BỘ số liệu hệ thống đang thu thập (dùng để trả lời nếu được hỏi):

1. THỐNG KÊ TUẦN (7 Ngày Qua):
- Tiêu thụ: ${context.kwhTotal} kWh
- Quên tắt đèn ban đêm: ${context.ledForgotCount} lần
- Vượt đỉnh tải: ${context.highPeakCount} lần

2. DỰ BÁO TIỀN ĐIỆN VÀ HOÁ ĐƠN (Tháng Bảng):
- Đã dùng tháng này: ${context.billingForecast?.kwhSoFar} kWh
- Dự báo cuối tháng: ${context.billingForecast?.projectedKwh} kWh
- Ước tính tiền điện: ${context.billingForecast?.projectedCostVnd?.toLocaleString('vi-VN')} VNĐ



3. CẢNH BÁO / LỜI KHUYÊN HIỆN TẠI TỪ HỆ THỐNG:
${JSON.stringify(context.advisorAdvice)}

4. TRẠNG THÁI HIỆN TẠI TỪ CẢM BIẾN (Trở về ngay lúc này):
- Môi trường: ${context.currentStatus?.sensor ? `Nhiệt độ ${context.currentStatus.sensor.temperature}°C, Độ ẩm ${context.currentStatus.sensor.humidity}%, Sáng ${context.currentStatus.sensor.lightLevel}, Áp suất ${context.currentStatus.sensor.pressure}hPa, ${context.currentStatus.sensor.isRaining ? 'Đang mưa' : 'Không mưa'}, ${context.currentStatus.sensor.isDark ? 'Trời tối' : 'Trời sáng'}` : 'Chưa cập nhật'}
- Điện/Thiết bị: ${context.currentStatus?.power ? `Đang tiêu thụ lưới: ${context.currentStatus.power.power}W (${context.currentStatus.power.voltage}V), Pin dự phòng: ${context.currentStatus.power.batteryLevel}%` : 'Chưa cập nhật'}

Người dùng hỏi/giao tiếp: "${question}"
Hãy trả lời trực tiếp như một người trợ lý đắc lực, xưng là "Mina" và gọi người dùng là "bạn" hoặc "gia đình". Khéo léo lồng ghép thông tin nếu câu hỏi liên quan. Trả lời ngắn gọn, tự nhiên, và hữu ích (từ 1-4 câu). Dùng text thuần túy không được chứa ký tự markdown phức tạp (*, #).`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) {
        const errText = await res.text();
        this.logger.error('Chat error: ' + errText);
        
        // Fallback siêu việt khi Google Gemini bị sập hoặc hết Free Quota
        return this.generateLocalFallback(question, context);
      }
      const json = await res.json();
      return json?.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, suy nghĩ của Mina bị gián đoạn.';
    } catch(err) {
      return this.generateLocalFallback(question, context);
    }
  }

  private generateLocalFallback(question: string, context: UnifiedAiContext): string {
    const q = question.toLowerCase();

    // 1. Chào hỏi
    if (q.includes('chào') || q.includes('hello') || q.includes('hi ') || q === 'hi') {
      return 'Dạ, em là Mina - Quản gia AI của Smart Home. Bạn cần xem thông tin gì về nhiệt độ, điện năng hay dự án ạ?';
    }

    // 2. Dự án / Giới thiệu / Đồ án
    if (q.includes('dự án') || q.includes('đồ án') || q.includes('tốt nghiệp') || q.includes('mục đích')) {
      return 'Dạ, đây là Đồ án Tốt nghiệp Smart Home kết hợp IoT đo lường điện năng. Hệ thống sử dụng ESP32, INA219 kết hợp với GenAI để vừa điều khiển từ xa, vừa phân tích và tối ưu hóa năng lượng ạ!';
    }

    // 3. Linh kiện / Cấu trúc
    if (q.includes('thiết bị') || q.includes('linh kiện') || q.includes('mạch') || q.includes('dùng gì') || q.includes('esp')) {
      return 'Hệ thống dùng vi điều khiển ESP32 giao tiếp MQTT, mạch đo dòng INA219 độ phân giải cao để đếm từng Wh, và điều khiển 2 LED + 1 quạt (có module pin dự phòng) đó ạ.';
    }

    // 4. Tiền điện / Hóa đơn
    if (q.includes('tiền') || q.includes('chi phí') || q.includes('hóa đơn') || q.includes('từ đầu tháng')) {
      const kwhSoFar = context.billingForecast?.kwhSoFar ?? 0;
      const price = context.billingForecast?.priceVndPerKwh ?? 2500;
      const costSoFar = Math.round(kwhSoFar * price);
      
      return `Dạ, tính từ đầu tháng đến nay nhà mình đã dùng ${kwhSoFar} kWh (khoảng ${costSoFar.toLocaleString('vi-VN')} VNĐ). Ước tính đến hết tháng sẽ dùng khoảng ${context.billingForecast?.projectedKwh ?? 0} kWh (tương đương ${context.billingForecast?.projectedCostVnd?.toLocaleString('vi-VN') ?? 0} VNĐ). Bạn nhớ sử dụng điện tiết kiệm nhé!`;
    }
    
    // 5. Thống kê điện năng
    if (q.includes('tốn') || q.includes('tiêu thụ') || q.includes('tuần') || q.includes('điện')) {
      return `Tuần qua nhà mình đã dùng ${context.kwhTotal ?? 0} kWh. Đã có ${context.ledForgotCount ?? 0} lần quên tắt đèn ban đêm. Việc để quên này tuy tốn ít điện (khoảng 0.5W/đèn) nhưng sẽ lãng phí từ từ đó nha!`;
    }

    // 6. Cảm biến / Môi trường hiện tại
    if (q.includes('nhiệt độ') || q.includes('cảm biến') || q.includes('độ ẩm') || q.includes('sáng') || q.includes('mưa') || q.includes('thời tiết')) {
      if (!context.currentStatus?.sensor) return 'Em đang không lấy được tín hiệu từ cảm biến ạ, có thể mạch ESP đang tắt.';
      return `Dạ, lúc này cảm biến báo nhiệt độ là ${context.currentStatus.sensor.temperature}°C, độ ẩm ${context.currentStatus.sensor.humidity}%. Trời đang ${context.currentStatus.sensor.isRaining ? 'mưa' : 'tạnh'} và ${context.currentStatus.sensor.isDark ? 'tối' : 'sáng'} ạ.`;
    }

    // 7. Cảnh báo lỗi
    if (q.includes('cảnh báo') || q.includes('lỗi') || q.includes('nguy hiểm') || q.includes('ổn không')) {
      return `Hệ thống ghi nhận trạng thái: "${context.advisorAdvice?.[0] || 'Tất cả bình thường'}". Bạn có thể xem trên Biểu đồ điện năng để theo dõi thêm nhé!`;
    }

    // 8. Routine / Ai thói quen
    if (q.includes('thói quen') || q.includes('mấy giờ') || q.includes('học')) {
      const routineString = context.advisorAdvice?.find(a => a.includes('thói quen 30 ngày')) || 'Hệ thống năng lượng đang học thói quen của bạn dựa trên độ lệch (Z-score), cần khoảng vài ngày để em nhận biết chính xác ạ.';
      return `Dạ, ${routineString}`;
    }

    // 9. Default if completely unmatched
    return 'Dạ, mạng AI của em đang dùng chế độ Offline nội bộ nên ngôn ngữ hơi hạn chế. Bạn có thể hỏi em về Nhiệt độ, Tiền điện, Thống kê năng lượng hoặc thông tin Đồ án nhé!';
  }
}
