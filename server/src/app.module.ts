/**
 * ✅ SECURED - app.module.ts
 * Thêm: Rate limiting, Global guards
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { MqttModule } from './module/mqtt/mqtt.module';
import { SensorsModule } from './module/sensors/sensors.module';
import { DevicesModule } from './module/devices/devices.module';
import { SettingsModule } from './module/settings/settings.module';
import { DashboardModule } from './module/dashboard/dashboard.module';
import { EnergyModule } from './module/energy/energy.module';
import { MaintenanceModule } from './module/maintenance/maintenance.module';
import { AiModule } from './module/ai/ai.module';
import { SecurityLoggingInterceptor } from './common/interceptors/security-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        // Validate critical env vars
        if (config.NODE_ENV === 'production') {
          if (!config.JWT_SECRET || config.JWT_SECRET === 'your-secret-key') {
            throw new Error('❌ JWT_SECRET must be set in production!');
          }
          if (!config.DATABASE_URL) {
            throw new Error('❌ DATABASE_URL must be set in production!');
          }
        }
        return config;
      },
    }),

    // ╔══════════════════════════════════════════════════════════════╗
    // ║       🔐 RATE LIMITING - DoS Protection                     ║
    // ╚══════════════════════════════════════════════════════════════╝
    ThrottlerModule.forRoot([
      {
        name: 'short', // 1 minute limit
        ttl: 60000, // 60 seconds
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
      },
      {
        name: 'long', // 15 minute limit
        ttl: 900000, // 15 minutes
        limit: process.env.NODE_ENV === 'production' ? 1000 : 5000,
      },
    ]),

    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MqttModule,
    SensorsModule,
    DevicesModule,
    SettingsModule,
    DashboardModule,
    EnergyModule,
    MaintenanceModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // ╔══════════════════════════════════════════════════════════════╗
    // ║          🔐 GLOBAL GUARDS & INTERCEPTORS                    ║
    // ╚══════════════════════════════════════════════════════════════╝

    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Security Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityLoggingInterceptor,
    },
  ],
})
export class AppModule {}
