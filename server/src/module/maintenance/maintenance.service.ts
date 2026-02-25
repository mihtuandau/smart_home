import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';

const BUCKET_MINUTES = 5;
const RAW_RETENTION_DAYS = 7; // Production: 7 days retention

@Injectable()
export class MaintenanceService implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Running startup cleanup...');
    await this.cleanupRawData();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async aggregateRecentBuckets() {
    const now = new Date();
    const bucketEnd = this.getBucketEnd(now);
    const bucketStart = new Date(
      bucketEnd.getTime() - BUCKET_MINUTES * 60 * 1000,
    );

    await Promise.all([
      this.aggregateSensorBucket(bucketStart, bucketEnd),
      this.aggregatePowerBucket(bucketStart, bucketEnd),
    ]);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupRawData() {
    const cutoffDate = new Date(Date.now() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const [sensorResult, powerResult, solarResult] = await Promise.all([
      this.prisma.sensorData.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
      this.prisma.powerData.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
      this.prisma.solarData.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
    ]);

    this.logger.log(
      `Cleanup data older than ${RAW_RETENTION_DAYS} days: sensor=${sensorResult.count}, power=${powerResult.count}, solar=${solarResult.count}`,
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
    const lights = rows.map((r) => r.lightLevel);

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
      lightLevelAvg: this.avg(lights),
      lightLevelMin: Math.min(...lights),
      lightLevelMax: Math.max(...lights),
      rainCount: rows.filter((r) => r.isRaining).length,
      darkCount: rows.filter((r) => r.isDark).length,
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
    });

    if (rows.length === 0) {
      return;
    }

    const voltages = rows.map((r) => r.voltage);
    const currents = rows.map((r) => r.current);
    const powers = rows.map((r) => r.power);
    const energySum = rows.reduce((sum, r) => sum + (r.energy || 0), 0);

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
      energySum: Math.round(energySum * 1000) / 1000,
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

  private avg(values: number[]): number {
    const total = values.reduce((sum, v) => sum + v, 0);
    return Math.round((total / values.length) * 1000) / 1000;
  }
}
