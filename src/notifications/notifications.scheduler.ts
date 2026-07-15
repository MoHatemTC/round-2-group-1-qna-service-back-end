import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNotificationCron() {
    this.logger.log('Scanning database for due notifications...');

    try {
      const dueNotifications = await this.prisma.notification.findMany({
        where: {
          status: { in: ['PENDING', 'FAILED'] },
          OR: [
            { retryAfter: null },
            { retryAfter: { lte: new Date() } },
          ],
        },
        select: {
          id: true,
        },
        take: 50,
      });

      if (dueNotifications.length === 0) {
        this.logger.log('No due notifications found.');
        return;
      }

      this.logger.log(`Found ${dueNotifications.length} notifications to process.`);

      await Promise.all(
        dueNotifications.map((notif) =>
          this.notificationsService.processNotification(notif.id),
        ),
      );

      this.logger.log('Batch processing completed for this cycle.');
    } catch (error) {
      this.logger.error('Error occurred during notification cron cycle', error);
    }
  }
}
