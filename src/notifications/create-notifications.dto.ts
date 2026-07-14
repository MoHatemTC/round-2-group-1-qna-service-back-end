import { IsString, IsNotEmpty, IsObject, IsEnum } from 'class-validator';
import { NotificationType } from './notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsObject()
  @IsNotEmpty()
  payload!: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  dedupKey!: string;
}
