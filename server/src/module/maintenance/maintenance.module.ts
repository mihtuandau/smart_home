import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { PrismaModule } from '../../common/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
