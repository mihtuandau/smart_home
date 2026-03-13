import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttPersistenceService } from './mqtt-persistence.service';
import { MqttDeviceStateService } from './mqtt-device-state.service';
import { MqttPersistenceDecisionService } from './mqtt-persistence-decision.service';
import { IotController } from './iot.controller';
import { PrismaModule } from '../../common/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [IotController],
  providers: [
    MqttService,
    MqttPersistenceService,
    MqttDeviceStateService,
    MqttPersistenceDecisionService,
  ],
  exports: [MqttService],
})
export class MqttModule {}
