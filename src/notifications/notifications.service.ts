import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async processNotification(notificationId: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId,
          status: { in: ['PENDING', 'FAILED'] },
        },
        data: {
          status: 'PROCESSING',
        },
      });

      return await this.deliverWithRetry(notification);
    } catch (error) {
      return;
    }
  }

  private async deliverWithRetry(notification: any) {
    const MAX_ATTEMPTS = 3;
    const currentAttempt = notification.attempts + 1;

    try {
      
      return await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          attempts: currentAttempt,
        },
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown delivery error';

      if (currentAttempt >= MAX_ATTEMPTS) {
        return await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            attempts: currentAttempt,
            lastError: `Max attempts reached. Last error: ${errorMessage}`,
          },
        });
      } else {
        const delayInSeconds = Math.pow(2, currentAttempt);
        const nextRetryDate = new Date();
        nextRetryDate.setSeconds(nextRetryDate.getSeconds() + delayInSeconds);

        
        return await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            attempts: currentAttempt,
            lastError: errorMessage,
            retryAfter: nextRetryDate,
          },
        });
      }
    }
  }
}
