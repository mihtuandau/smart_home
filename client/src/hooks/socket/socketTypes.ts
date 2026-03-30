export interface LedDayEntry {
  date: string;
  led1_wh: number;
  led2_wh: number;
  led1_on_minutes: number;
  led2_on_minutes: number;
}

export interface AiAdvicePayload {
  time: string;
  advice: string[];
  anomaly: string | null;
  analysis: string;
  type: 'status' | 'alert';
  powerW: number;
  led1: boolean;
  led2: boolean;
  dailyLed: LedDayEntry;
}
