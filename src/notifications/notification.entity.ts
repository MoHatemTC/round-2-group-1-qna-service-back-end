export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export class Notification {
  id!: string;
  recipient!: string;
  type!: NotificationType;
  payload!: any;
  dedupKey!: string;
  status!: NotificationStatus;
  attempts!: number;
  lastError?: string;
  sentAt?: Date;
  createdAt!: Date;
}
