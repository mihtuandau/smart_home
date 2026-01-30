import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { MqttModule } from './module/mqtt/mqtt.module';
import { SensorsModule } from './module/sensors/sensors.module';
import { DevicesModule } from './module/devices/devices.module';
import { AutomationModule } from './module/automation/automation.module';
import { SettingsModule } from './module/settings/settings.module';
import { DashboardModule } from './module/dashboard/dashboard.module';
import { EnergyModule } from './module/energy/energy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    MqttModule,
    SensorsModule,
    DevicesModule,
    AutomationModule,
    SettingsModule,
    DashboardModule,
    EnergyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
