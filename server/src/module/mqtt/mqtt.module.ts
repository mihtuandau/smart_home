import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { IotController } from './iot.controller';
import { PrismaModule } from '../../common/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [IotController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
