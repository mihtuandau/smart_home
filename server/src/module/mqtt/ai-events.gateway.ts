import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

import type { LedDayEntry } from '../ai/ai-led-stats.service';

export interface AiAdvicePayload {
  time: string;
  advice: string[];
  anomaly: string | null;
  analysis: string;
  /** 'status' = cập nhật thường xuyên, 'alert' = có cảnh báo/lời khuyên cụ thể */
  type: 'status' | 'alert';
  /** Công suất thực tế (W) để UI hiển thị gauge */
  powerW: number;
  led1: boolean;
  led2: boolean;
  /** LED daily consumption stats (today, server-computed) */
  dailyLed: LedDayEntry;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173',
      'https://smart.dautuan.com',
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class AiEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiEventsGateway.name);

  afterInit() {
    this.logger.log('🤖 AI Events WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    this.logger.log(`✅ Client connected: ${client.id} (User: ${user?.email})`);
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    this.logger.log(`❌ Client disconnected: ${client.id} (User: ${user?.email})`);
  }

  /**
   * Broadcast AI advice/warnings to all connected clients.
   * Event name: 'ai:advice'
   */
  emitAiAdvice(payload: AiAdvicePayload): void {
    this.server.emit('ai:advice', payload);
  }
}
