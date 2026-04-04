import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as nodemailer from 'nodemailer';

type EnergyAlertPayload = {
  currentPower: number;
  thresholdPower: number;
  measuredAt: Date;
};

type DeviceOfflineAlertPayload = {
  deviceNames: string[];
  offlineMinutes: number;
  detectedAt: Date;
};

type DeviceStateChangeAlertPayload = {
  changes: string[];
  detectedAt: Date;
};

type SystemAnomalyAlertPayload = {
  issues: string[];
  detectedAt: Date;
};

type SystemRecoveryAlertPayload = {
  message: string;
  recoveredAt: Date;
};

type AlertPreferenceKey = 'energyAlerts' | 'deviceAlerts' | 'systemAlerts';

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);
  private readonly cooldownMs =
    Number(process.env.ALERT_COOLDOWN_SECONDS || 1800) * 1000;
  private readonly deviceStateChangeCooldownMs =
    Number(process.env.DEVICE_STATE_ALERT_COOLDOWN_SECONDS || 0) * 1000;
  private readonly energyAlertCooldownMs =
    Number(process.env.ENERGY_ALERT_COOLDOWN_SECONDS || 1800) * 1000;
  private readonly systemAlertCooldownMs =
    Number(process.env.SYSTEM_ALERT_COOLDOWN_SECONDS || 600) * 1000;
  private readonly deviceOfflineCooldownMs =
    Number(process.env.DEVICE_OFFLINE_ALERT_COOLDOWN_SECONDS || 600) * 1000;
  private readonly systemRecoveryCooldownMs =
    Number(process.env.SYSTEM_RECOVERY_ALERT_COOLDOWN_SECONDS || 0) * 1000;
  private readonly lastSentMap = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  private isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS,
    );
  }

  private getTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private getExtraRecipients(): string[] {
    const raw = process.env.ALERT_EXTRA_RECIPIENTS || '';
    if (!raw.trim()) {
      return [];
    }

    return raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0 && email.includes('@'));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatDateTimeVi(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'medium',
      hour12: false,
    }).format(date);
  }

  private buildMailHtml(params: {
    appName: string;
    title: string;
    intro: string;
    rows: Array<{ label: string; value: string }>;
    notes?: string[];
  }): string {
    const rowsHtml = params.rows
      .map(
        (row) =>
          `<tr><td style="padding:8px 10px;color:#334155;font-weight:600;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(row.label)}</td><td style="padding:8px 10px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${this.escapeHtml(row.value)}</td></tr>`,
      )
      .join('');

    const notesHtml = (params.notes || [])
      .map(
        (note) =>
          `<li style="margin-bottom:6px;">${this.escapeHtml(note)}</li>`,
      )
      .join('');

    return `
<!doctype html>
<html lang="vi">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:24px auto;padding:0 12px;">
      <div style="background:#ffffff;border:1px solid #dbeafe;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:18px 20px;">
          <h2 style="margin:0;color:#ffffff;font-size:20px;">${this.escapeHtml(params.title)}</h2>
          <p style="margin:6px 0 0;color:#dbeafe;font-size:13px;">${this.escapeHtml(params.appName)}</p>
        </div>
        <div style="padding:18px 20px;">
          <p style="margin:0 0 14px;color:#1e293b;line-height:1.5;">${this.escapeHtml(params.intro)}</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          ${notesHtml ? `<div style="margin-top:14px;"><p style="margin:0 0 6px;color:#0f172a;font-weight:700;">Khuyến nghị:</p><ul style="margin:0;padding-left:18px;color:#334155;">${notesHtml}</ul></div>` : ''}
          <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Email tự động, vui lòng không trả lời trực tiếp email này.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
  }

  private parseTimeToMinutes(value: string): number {
    const [hour, minute] = value.split(':').map((part) => Number(part));
    return hour * 60 + minute;
  }

  private isInsideQuietHours(from: string, to: string, now: Date): boolean {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const fromMinutes = this.parseTimeToMinutes(from);
    const toMinutes = this.parseTimeToMinutes(to);

    if (fromMinutes === toMinutes) {
      return false;
    }

    if (fromMinutes < toMinutes) {
      return nowMinutes >= fromMinutes && nowMinutes < toMinutes;
    }

    return nowMinutes >= fromMinutes || nowMinutes < toMinutes;
  }

  private getCooldownForAlertType(alertType: string): number {
    if (alertType === 'energy-threshold') {
      return this.energyAlertCooldownMs;
    }

    if (alertType === 'system-anomaly') {
      return this.systemAlertCooldownMs;
    }

    if (alertType === 'device-offline') {
      return this.deviceOfflineCooldownMs;
    }

    if (alertType === 'system-recovery') {
      return this.systemRecoveryCooldownMs;
    }

    if (alertType === 'device-state-change') {
      return this.deviceStateChangeCooldownMs;
    }

    return this.cooldownMs;
  }

  private isInCooldown(userId: string, alertType: string, nowMs: number): boolean {
    const cooldownMs = this.getCooldownForAlertType(alertType);
    if (cooldownMs <= 0) {
      return false;
    }

    const key = `${userId}:${alertType}`;
    const lastSent = this.lastSentMap.get(key);

    if (!lastSent) {
      return false;
    }

    return nowMs - lastSent < cooldownMs;
  }

  private markSent(userId: string, alertType: string, nowMs: number) {
    const key = `${userId}:${alertType}`;
    this.lastSentMap.set(key, nowMs);
  }

  private async getEligibleRecipients(
    preferenceKey: AlertPreferenceKey,
    alertType: string,
  ) {
    const notificationRows = await this.prisma.userNotificationSettings.findMany({
      where: {
        emailAlerts: true,
        [preferenceKey]: true,
      } as Record<string, boolean>,
      select: {
        userId: true,
        quietHoursFrom: true,
        quietHoursTo: true,
        emailFrequency: true,
      },
    });

    if (notificationRows.length === 0) {
      return [] as Array<{ userId: string; email: string }>;
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: notificationRows.map((row) => row.userId),
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userEmailMap = new Map(users.map((user) => [user.id, user.email]));
    const now = new Date();
    const nowMs = now.getTime();

    return notificationRows
      .filter((row) => {
        if (row.emailFrequency !== 'real-time') {
          return false;
        }

        if (this.isInsideQuietHours(row.quietHoursFrom, row.quietHoursTo, now)) {
          return false;
        }

        if (this.isInCooldown(row.userId, alertType, nowMs)) {
          return false;
        }

        return Boolean(userEmailMap.get(row.userId));
      })
      .map((row) => ({
        userId: row.userId,
        email: userEmailMap.get(row.userId) as string,
      }));
  }

  private async sendToRecipients(
    recipients: Array<{ userId: string; email: string }>,
    alertType: string,
    subject: string,
    text: string,
    html?: string,
  ) {
    const recipientMap = new Map<string, { userId?: string; email: string }>();

    for (const recipient of recipients) {
      const normalizedEmail = recipient.email.trim().toLowerCase();
      if (!normalizedEmail) {
        continue;
      }

      recipientMap.set(normalizedEmail, {
        userId: recipient.userId,
        email: normalizedEmail,
      });
    }

    for (const extraEmail of this.getExtraRecipients()) {
      if (!recipientMap.has(extraEmail)) {
        recipientMap.set(extraEmail, {
          email: extraEmail,
        });
      }
    }

    const allRecipients = Array.from(recipientMap.values());

    if (allRecipients.length === 0) {
      return { sent: 0 };
    }

    const transporter = this.getTransporter();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    const nowMs = Date.now();
    let sent = 0;

    for (const recipient of allRecipients) {
      await transporter.sendMail({
        from: fromEmail,
        to: recipient.email,
        subject,
        text,
        html,
      });

      if (recipient.userId) {
        this.markSent(recipient.userId, alertType, nowMs);
      }
      sent += 1;
    }

    return { sent };
  }

  async sendEnergyThresholdAlert(payload: EnergyAlertPayload) {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP is not configured. Skipping energy alert emails.');
      return { sent: 0, skipped: 0 };
    }

    const recipients = await this.getEligibleRecipients(
      'energyAlerts',
      'energy-threshold',
    );
    const appName = process.env.APP_NAME || 'Smart Home';
    const subject = `[${appName}] Cảnh báo năng lượng vượt ngưỡng`;
    const measuredAtText = this.formatDateTimeVi(payload.measuredAt);
    const text = [
      'Phát hiện cảnh báo năng lượng vượt ngưỡng.',
      `Công suất hiện tại: ${payload.currentPower.toFixed(2)} W`,
      `Ngưỡng cài đặt: ${payload.thresholdPower.toFixed(2)} W`,
      `Thời gian: ${measuredAtText}`,
    ].join('\n');
    const html = this.buildMailHtml({
      appName,
      title: 'Cảnh báo năng lượng',
      intro: 'Hệ thống ghi nhận công suất tiêu thụ vượt mức cho phép.',
      rows: [
        { label: 'Công suất hiện tại', value: `${payload.currentPower.toFixed(2)} W` },
        { label: 'Ngưỡng cài đặt', value: `${payload.thresholdPower.toFixed(2)} W` },
        { label: 'Thời gian', value: measuredAtText },
      ],
      notes: [
        'Kiểm tra các thiết bị công suất lớn đang hoạt động.',
        'Xem lại ngưỡng maxPowerConsumption trong cài đặt hệ thống.',
      ],
    });

    const { sent } = await this.sendToRecipients(
      recipients,
      'energy-threshold',
      subject,
      text,
      html,
    );

    return {
      sent,
      skipped: Math.max(recipients.length - sent, 0),
    };
  }

  async sendDeviceOfflineAlert(payload: DeviceOfflineAlertPayload) {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP is not configured. Skipping device offline emails.');
      return { sent: 0, skipped: 0 };
    }

    const recipients = await this.getEligibleRecipients(
      'deviceAlerts',
      'device-offline',
    );
    const appName = process.env.APP_NAME || 'Smart Home';
    const subject = `[${appName}] Cảnh báo thiết bị mất kết nối`;
    const detectedAtText = this.formatDateTimeVi(payload.detectedAt);
    const text = [
      'Một hoặc nhiều thiết bị có thể đã mất kết nối.',
      `Ngưỡng mất kết nối: ${payload.offlineMinutes} phút`,
      `Thời gian phát hiện: ${detectedAtText}`,
      `Thiết bị ảnh hưởng: ${payload.deviceNames.join(', ')}`,
    ].join('\n');
    const html = this.buildMailHtml({
      appName,
      title: 'Cảnh báo thiết bị mất kết nối',
      intro: 'Hệ thống phát hiện dấu hiệu gián đoạn kết nối từ thiết bị.',
      rows: [
        { label: 'Thiết bị ảnh hưởng', value: payload.deviceNames.join(', ') || 'Không xác định' },
        { label: 'Ngưỡng mất kết nối', value: `${payload.offlineMinutes} phút` },
        { label: 'Thời gian phát hiện', value: detectedAtText },
      ],
      notes: [
        'Kiểm tra nguồn điện và kết nối mạng của thiết bị.',
        'Kiểm tra broker MQTT và firmware thiết bị.',
      ],
    });

    const { sent } = await this.sendToRecipients(
      recipients,
      'device-offline',
      subject,
      text,
      html,
    );

    return {
      sent,
      skipped: Math.max(recipients.length - sent, 0),
    };
  }

  async sendDeviceStateChangeAlert(payload: DeviceStateChangeAlertPayload) {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP is not configured. Skipping device state-change emails.');
      return { sent: 0, skipped: 0 };
    }

    const recipients = await this.getEligibleRecipients(
      'deviceAlerts',
      'device-state-change',
    );
    const appName = process.env.APP_NAME || 'Smart Home';
    const subject = `[${appName}] Thông báo thay đổi trạng thái thiết bị`;
    const detectedAtText = this.formatDateTimeVi(payload.detectedAt);
    const text = [
      'Phát hiện thay đổi trạng thái thiết bị.',
      `Thời gian: ${detectedAtText}`,
      'Danh sách thay đổi:',
      ...payload.changes.map((change) => `- ${change}`),
    ].join('\n');
    const html = this.buildMailHtml({
      appName,
      title: 'Thông báo thay đổi trạng thái thiết bị',
      intro: 'Trạng thái bật/tắt của thiết bị vừa thay đổi.',
      rows: [
        { label: 'Thời gian', value: detectedAtText },
        { label: 'Số thay đổi', value: `${payload.changes.length}` },
      ],
      notes: payload.changes,
    });

    const { sent } = await this.sendToRecipients(
      recipients,
      'device-state-change',
      subject,
      text,
      html,
    );

    return {
      sent,
      skipped: Math.max(recipients.length - sent, 0),
    };
  }

  async sendSystemAnomalyAlert(payload: SystemAnomalyAlertPayload) {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP is not configured. Skipping system anomaly emails.');
      return { sent: 0, skipped: 0 };
    }

    const recipients = await this.getEligibleRecipients(
      'systemAlerts',
      'system-anomaly',
    );
    const appName = process.env.APP_NAME || 'Smart Home';
    const subject = `[${appName}] Cảnh báo hệ thống bất thường`;
    const detectedAtText = this.formatDateTimeVi(payload.detectedAt);
    const text = [
      'Hệ thống phát hiện bất thường từ dữ liệu cảm biến.',
      `Thời gian: ${detectedAtText}`,
      'Chi tiết:',
      ...payload.issues.map((issue) => `- ${issue}`),
    ].join('\n');
    const html = this.buildMailHtml({
      appName,
      title: 'Cảnh báo hệ thống bất thường',
      intro: 'Phát hiện một hoặc nhiều thông số cảm biến vượt ngưỡng.',
      rows: [
        { label: 'Thời gian', value: detectedAtText },
        { label: 'Số vấn đề', value: `${payload.issues.length}` },
      ],
      notes: payload.issues,
    });

    const { sent } = await this.sendToRecipients(
      recipients,
      'system-anomaly',
      subject,
      text,
      html,
    );

    return {
      sent,
      skipped: Math.max(recipients.length - sent, 0),
    };
  }

  async sendSystemRecoveryAlert(payload: SystemRecoveryAlertPayload) {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP is not configured. Skipping system recovery emails.');
      return { sent: 0, skipped: 0 };
    }

    const recipients = await this.getEligibleRecipients(
      'systemAlerts',
      'system-recovery',
    );
    const appName = process.env.APP_NAME || 'Smart Home';
    const recoveredAtText = this.formatDateTimeVi(payload.recoveredAt);
    const subject = `[${appName}] Hệ thống đã kết nối lại MQTT`;
    const text = [
      'Kết nối MQTT đã được khôi phục.',
      `Thời gian: ${recoveredAtText}`,
      `Chi tiết: ${payload.message}`,
    ].join('\n');
    const html = this.buildMailHtml({
      appName,
      title: 'Kết nối MQTT đã khôi phục',
      intro: 'Hệ thống đã kết nối lại thành công và dữ liệu thời gian thực đã hoạt động trở lại.',
      rows: [
        { label: 'Thời gian khôi phục', value: recoveredAtText },
        { label: 'Chi tiết', value: payload.message },
      ],
      notes: ['Bạn có thể tiếp tục theo dõi dữ liệu thời gian thực như bình thường.'],
    });

    const { sent } = await this.sendToRecipients(
      recipients,
      'system-recovery',
      subject,
      text,
      html,
    );

    return {
      sent,
      skipped: Math.max(recipients.length - sent, 0),
    };
  }
}