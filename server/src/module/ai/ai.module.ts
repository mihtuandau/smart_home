import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiAnalyzerService } from './ai-analyzer.service';
import { AiAdvisorService } from './ai-advisor.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiBillingService } from './ai-billing.service';
import { AiLedStatsService } from './ai-led-stats.service';
import { AiEventsGateway } from '../mqtt/ai-events.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiAnalyzerService,
    AiAdvisorService,
    AiBaselineService,
    AiBillingService,
    AiLedStatsService,
    AiEventsGateway,
  ],
  exports: [AiService, AiEventsGateway],
})
export class AiModule {}
