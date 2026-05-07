import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

import { AiService } from '../ai/ai.service';
import { AiLedStatsService, LedDayEntry } from '../ai/ai-led-stats.service';

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
// @UseGuards(WsJwtGuard)
export class AiEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiEventsGateway.name);

  constructor(
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    private ledStats: AiLedStatsService,
  ) {}

  afterInit() {
    this.logger.log(' AI Events WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const user = (client as any).user;
    this.logger.log(` Client connected: ${client.id} (User: ${user?.email})`);

    // Send initial data immediately
    try {
      const latest = this.aiService.getLatestResult();
      if (latest) {
        client.emit('ai:advice', {
          ...latest,
          type:
            latest.advice?.length > 0 || latest.anomaly ? 'alert' : 'status',
        });
      }

      const today = this.ledStats.getToday();
      const history = await this.ledStats.getHistory(7);
      client.emit('led_stats', { today, history });
    } catch (err) {
      this.logger.error(`Failed to send initial AI/LED data: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    this.logger.log(
      ` Client disconnected: ${client.id} (User: ${user?.email})`,
    );
  }

  emitAiAdvice(payload: AiAdvicePayload): void {
    this.server.emit('ai:advice', payload);
  }

  emitLedStats(today: LedDayEntry, history: LedDayEntry[]): void {
    this.server.emit('led_stats', { today, history });
  }
}
