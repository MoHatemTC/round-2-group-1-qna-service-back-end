import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { QuizStatus } from '../../../common/enums/quiz-status.enum'; // ✅ استخدم الـ Enum اليدوي

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsDateString()
  openDate: string;

  @IsDateString()
  closeDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  passScore?: number;

  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
