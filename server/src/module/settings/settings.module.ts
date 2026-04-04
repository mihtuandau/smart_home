import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../../common/prisma.module';
import { NotificationEmailService } from './notification-email.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, NotificationEmailService],
  exports: [SettingsService, NotificationEmailService],
})
export class SettingsModule {}
