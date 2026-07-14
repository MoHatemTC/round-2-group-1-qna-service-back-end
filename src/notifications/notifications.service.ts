import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

    async processNotification(notificationId: string) {
      try {
      await this.deliverWithRetry(notificationId);
    } catch (error: any) { // ضيف : any هنا لمنع اعتراض الـ Compiler
      this.logger.error(`Failed to deliver notification ${notificationId} after all attempts: ${error.message}`);
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', lastError: error.message },
      });
    }
  }

  private async deliverWithRetry(notificationId: string) {
    const current = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    
    if (!current) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    if (current.status === 'SENT') {
      this.logger.warn(`Notification ${notificationId} already delivered. Short-circuiting.`);
      return; 
    }

    await this.sendToProvider(current);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { 
        status: 'SENT', 
        sentAt: new Date(),
        attempts: { increment: 1 } 
      },
    });
  }

  private async sendToProvider(notification: any) {
    
  }
}
