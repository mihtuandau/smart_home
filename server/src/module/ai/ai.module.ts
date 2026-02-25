import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiAnalyzerService } from './ai-analyzer.service';
import { AiAdvisorService } from './ai-advisor.service';
import { AiBaselineService } from './ai-baseline.service';
import { AiBillingService } from './ai-billing.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiAnalyzerService,
    AiAdvisorService,
    AiBaselineService,
    AiBillingService,
  ],
  exports: [AiService],
})
export class AiModule {}
