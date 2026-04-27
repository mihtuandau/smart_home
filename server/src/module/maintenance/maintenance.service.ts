import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationEmailService } from '../settings/notification-email.service';
import { DeviceStatus } from '@prisma/client';

const BUCKET_MINUTES = 5;
const RAW_RETENTION_DAYS = 7;
const DEVICE_OFFLINE_MINUTES = Number(process.env.DEVICE_OFFLINE_MINUTES || 30);
const SENSOR_STALE_MINUTES = Number(process.env.SENSOR_STALE_MINUTES || 20);
const TEMPERATURE_HIGH_C = Number(process.env.TEMPERATURE_HIGH_C || 35);
const TEMPERATURE_LOW_C = Number(process.env.TEMPERATURE_LOW_C || 15);
const HUMIDITY_HIGH_PERCENT = Number(process.env.HUMIDITY_HIGH_PERCENT || 85);
const HUMIDITY_LOW_PERCENT = Number(process.env.HUMIDITY_LOW_PERCENT || 30);
const PRESSURE_LOW_HPA = Number(process.env.PRESSURE_LOW_HPA || 980);
const PRESSURE_HIGH_HPA = Number(process.env.PRESSURE_HIGH_HPA || 1035);

@Injectable()
export class MaintenanceService implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private notificationEmailService: NotificationEmailService,
  ) {}

  async onModuleInit() {
    this.logger.log('Running startup cleanup...');
    await this.cleanupRawData();
    
    // Run backfill asynchronously to not block other services
    this.backfillHistoricalAggregations().catch((error) => {
      this.logger.error('Backfill failed', error);
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async aggregateRecentBuckets() {
    const now = new Date();
    const bucketEnd = this.getBucketEnd(now);
    const bucketStart = new Date(
      bucketEnd.getTime() - BUCKET_MINUTES * 60 * 1000,
    );

    this.logger.debug(`[Cron] Aggregating bucket: ${bucketStart} - ${bucketEnd}`);

    await Promise.all([
      this.aggregateSensorBucket(bucketStart, bucketEnd),
      this.aggregatePowerBucket(bucketStart, bucketEnd),
    ]);

    await Promise.all([
      this.checkDeviceOfflineAlerts(now),
      this.checkSensorHealthAlerts(now),
    ]);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupRawData() {
    const cutoffDate = new Date(
      Date.now() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const [sensorResult, powerResult, aiResult] = await Promise.all([
      this.prisma.sensorData.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
      this.prisma.powerData.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
      this.prisma.aiLearningData.deleteMany({
        where: { 
          expiresAt: { lt: new Date() },
          feature: { not: 'daily_stats' } // Keep daily stats for history
        },
      }),
    ]);

    this.logger.log(
      `Cleanup complete: sensor=${sensorResult.count}, power=${powerResult.count}, ai=${aiResult.count}`,
    );
  }

  private getBucketEnd(date: Date): Date {
    const bucketMs = BUCKET_MINUTES * 60 * 1000;
    const ms = date.getTime();
    return new Date(Math.floor(ms / bucketMs) * bucketMs);
  }

  private async aggregateSensorBucket(start: Date, end: Date) {
    const rows = await this.prisma.sensorData.findMany({
      where: {
        timestamp: { gte: start, lt: end },
      },
    });

    if (rows.length === 0) {
      return;
    }

    const temps = rows.map((r) => r.temperature);
    const hums = rows.map((r) => r.humidity);
    const pres = rows.map((r) => r.pressure);

    const payload = {
      bucketStart: start,
      bucketMinutes: BUCKET_MINUTES,
      temperatureAvg: this.avg(temps),
      temperatureMin: Math.min(...temps),
      temperatureMax: Math.max(...temps),
      humidityAvg: this.avg(hums),
      humidityMin: Math.min(...hums),
      humidityMax: Math.max(...hums),
      pressureAvg: this.avg(pres),
      pressureMin: Math.min(...pres),
      pressureMax: Math.max(...pres),
      rainCount: rows.filter((r) => r.isRaining).length,
      samples: rows.length,
    };

    await this.prisma.sensorAgg.upsert({
      where: {
        bucketStart_bucketMinutes: {
          bucketStart: start,
          bucketMinutes: BUCKET_MINUTES,
        },
      },
      create: payload,
      update: payload,
    });
  }

  private async aggregatePowerBucket(start: Date, end: Date) {
    const rows = await this.prisma.powerData.findMany({
      where: {
        timestamp: { gte: start, lt: end },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (rows.length === 0) {
      return;
    }

    const voltages = rows.map((r) => r.voltage);
    const currents = rows.map((r) => r.current);
    const powers = rows.map((r) => r.power);
    
    const payload = {
      bucketStart: start,
      bucketMinutes: BUCKET_MINUTES,
      voltageAvg: this.avg(voltages),
      voltageMin: Math.min(...voltages),
      voltageMax: Math.max(...voltages),
      currentAvg: this.avg(currents),
      currentMin: Math.min(...currents),
      currentMax: Math.max(...currents),
      powerAvg: this.avg(powers),
      powerMin: Math.min(...powers),
      powerMax: Math.max(...powers),
      samples: rows.length,
    };

    await this.prisma.powerAgg.upsert({
      where: {
        bucketStart_bucketMinutes: {
          bucketStart: start,
          bucketMinutes: BUCKET_MINUTES,
        },
      },
      create: payload,
      update: payload,
    });
  }

  private async checkDeviceOfflineAlerts(now: Date) {
    const cutoff = new Date(now.getTime() - DEVICE_OFFLINE_MINUTES * 60 * 1000);

    const staleDevices = await this.prisma.device.findMany({
      where: {
        status: DeviceStatus.ON,
        OR: [
          { lastActive: null },
          {
            lastActive: {
              lt: cutoff,
            },
          },
        ],
      },
      select: {
        name: true,
      },
      take: 5,
    });

    if (staleDevices.length === 0) {
      return;
    }

    const result = await this.notificationEmailService.sendDeviceOfflineAlert({
      deviceNames: staleDevices.map((device) => device.name),
      offlineMinutes: DEVICE_OFFLINE_MINUTES,
      detectedAt: now,
    });

    if (result.sent > 0) {
      this.logger.warn(
        `Detected ${staleDevices.length} possible offline device(s). Sent ${result.sent} device alert email(s).`,
      );
    }
  }

  private async checkSensorHealthAlerts(now: Date) {
    const latest = await this.prisma.sensorData.findFirst({
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!latest) {
      return;
    }

    const issues: string[] = [];
    const staleCutoff = new Date(now.getTime() - SENSOR_STALE_MINUTES * 60 * 1000);

    if (latest.timestamp < staleCutoff) {
      issues.push(
        `Sensor data stream seems stale (last sample at ${latest.timestamp.toISOString()}).`,
      );
    }

    if (latest.temperature >= TEMPERATURE_HIGH_C) issues.push(`Temperature is too high: ${latest.temperature.toFixed(1)} C`);
    if (latest.temperature <= TEMPERATURE_LOW_C) issues.push(`Temperature is too low: ${latest.temperature.toFixed(1)} C`);
    if (latest.humidity >= HUMIDITY_HIGH_PERCENT) issues.push(`Humidity is too high: ${latest.humidity.toFixed(1)}%`);
    if (latest.humidity <= HUMIDITY_LOW_PERCENT) issues.push(`Humidity is too low: ${latest.humidity.toFixed(1)}%`);
    if (latest.pressure <= PRESSURE_LOW_HPA) issues.push(`Pressure is too low: ${latest.pressure.toFixed(1)} hPa`);

    if (issues.length === 0) {
      return;
    }

    const result = await this.notificationEmailService.sendSystemAnomalyAlert({
      issues,
      detectedAt: now,
    });

    if (result.sent > 0) {
      this.logger.warn(`Detected ${issues.length} sensor anomaly issue(s). Sent alert email(s).`);
    }
  }

  private avg(values: number[]): number {
    const total = values.reduce((sum, v) => sum + v, 0);
    return Math.round((total / values.length) * 1000) / 1000;
  }

  async backfillHistoricalAggregations() {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      // Get the earliest sensor aggregation record
      const earliestSensorAgg = await this.prisma.sensorAgg.findFirst({
        orderBy: { bucketStart: 'asc' },
      });

      const earliestSensorAggTime = earliestSensorAgg?.bucketStart || now;

      // Get the earliest sensor raw data record (within last 7 days to avoid deleted data)
      const rawCutoff = new Date(now.getTime() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const earliestRawData = await this.prisma.sensorData.findFirst({
        where: { timestamp: { gte: startTime, lt: now } },
        orderBy: { timestamp: 'asc' },
      });

      if (!earliestRawData) {
        this.logger.debug('No raw sensor data found for backfill');
        return;
      }

      // Determine the backfill start time
      const backfillStart = Math.max(
        earliestRawData.timestamp.getTime(),
        startTime.getTime()
      );

      // Backfill sensor aggregations
      let bucketTime = this.getBucketEnd(new Date(backfillStart));
      const bucketMs = BUCKET_MINUTES * 60 * 1000;
      let aggregatedCount = 0;

      while (bucketTime <= now) {
        const bucketStart = new Date(bucketTime.getTime() - bucketMs);
        const exists = await this.prisma.sensorAgg.findUnique({
          where: {
            bucketStart_bucketMinutes: {
              bucketStart,
              bucketMinutes: BUCKET_MINUTES,
            },
          },
        });

        if (!exists) {
          await this.aggregateSensorBucket(bucketStart, bucketTime);
          aggregatedCount++;
        }

        bucketTime = new Date(bucketTime.getTime() + bucketMs);

        // Log progress every 100 buckets
        if (aggregatedCount % 100 === 0) {
          this.logger.log(`Sensor backfill progress: ${aggregatedCount} buckets created`);
        }
      }

      if (aggregatedCount > 0) {
        this.logger.log(`Sensor aggregation backfill completed: ${aggregatedCount} buckets created`);
      }

      // Similar backfill for power data
      const earliestPowerAgg = await this.prisma.powerAgg.findFirst({
        orderBy: { bucketStart: 'asc' },
      });

      const earliestPowerData = await this.prisma.powerData.findFirst({
        where: { timestamp: { gte: startTime, lt: now } },
        orderBy: { timestamp: 'asc' },
      });

      if (!earliestPowerData) {
        this.logger.debug('No raw power data found for backfill');
        return;
      }

      const powerBackfillStart = Math.max(
        earliestPowerData.timestamp.getTime(),
        startTime.getTime()
      );

      bucketTime = this.getBucketEnd(new Date(powerBackfillStart));
      let powerAggregatedCount = 0;

      while (bucketTime <= now) {
        const bucketStart = new Date(bucketTime.getTime() - bucketMs);
        const exists = await this.prisma.powerAgg.findUnique({
          where: {
            bucketStart_bucketMinutes: {
              bucketStart,
              bucketMinutes: BUCKET_MINUTES,
            },
          },
        });

        if (!exists) {
          await this.aggregatePowerBucket(bucketStart, bucketTime);
          powerAggregatedCount++;
        }

        bucketTime = new Date(bucketTime.getTime() + bucketMs);

        if (powerAggregatedCount % 100 === 0) {
          this.logger.log(`Power backfill progress: ${powerAggregatedCount} buckets created`);
        }
      }

      if (powerAggregatedCount > 0) {
        this.logger.log(`Power aggregation backfill completed: ${powerAggregatedCount} buckets created`);
      }
    } catch (error) {
      this.logger.error('Historical aggregation backfill failed', error);
    }
  }

}
