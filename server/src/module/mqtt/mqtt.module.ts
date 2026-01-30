import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { IotController } from './iot.controller';
import { PrismaModule } from '../../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IotController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
