import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationStatus, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private isProcessing = false;

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingNotifications() {
    if (this.isProcessing) {
      this.logger.warn('Previous cron execution is still running. Skipping to prevent overlap.');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Checking for PENDING notifications in the queue...');

    try {
      const mockPendingNotifications = [
        {
          id: '1',
          recipient: 'user@example.com',
          type: NotificationType.EMAIL,
          payload: {},
          dedupKey: 'msg_123',
          status: NotificationStatus.PENDING,
          attempts: 0,
          createdAt: new Date(),
        },
      ];

      for (const notification of mockPendingNotifications) {
        await this.notificationsService.processNotification(notification.id);      }
    } catch (error: any) {
      this.logger.error('Failed to process notification batch', error.stack);
    } finally {
      this.isProcessing = false;
    }
  }
}
