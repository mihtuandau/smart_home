import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { PrismaModule } from '../../common/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
