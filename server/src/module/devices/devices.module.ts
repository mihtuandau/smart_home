import { Module, forwardRef } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { PrismaModule } from '../../common/prisma.module';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [PrismaModule, forwardRef(() => MqttModule)],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
