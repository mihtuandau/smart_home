import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiAnalyzerService } from './ai-analyzer.service';
import { AiAdvisorService } from './ai-advisor.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiBillingService } from './ai-billing.service';
import { AiLedStatsService } from './ai-led-stats.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { AiSummaryService } from './ai-summary.service';

@Module({
  imports: [PrismaModule, forwardRef(() => MqttModule)],
  controllers: [AiController],
  providers: [
    AiService,
    AiAnalyzerService,
    AiAdvisorService,
    AiBaselineService,
    AiBillingService,
    AiLedStatsService,
    AiSummaryService,
  ],
  exports: [AiService, AiSummaryService],
})
export class AiModule {}
