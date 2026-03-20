import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MqttService } from './mqtt.service';
import { MqttPersistenceService } from './mqtt-persistence.service';
import { MqttDeviceStateService } from './mqtt-device-state.service';
import { MqttPersistenceDecisionService } from './mqtt-persistence-decision.service';
import { IotController } from './iot.controller';
import { AiEventsGateway } from './ai-events.gateway';
import { PrismaModule } from '../../common/prisma.module';
import { AiModule } from '../ai/ai.module';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (
        configService: ConfigService,
      ): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [IotController],
  providers: [
    MqttService,
    MqttPersistenceService,
    MqttDeviceStateService,
    MqttPersistenceDecisionService,
    AiEventsGateway,
    WsJwtGuard,
  ],
  exports: [MqttService],
})
export class MqttModule {}
