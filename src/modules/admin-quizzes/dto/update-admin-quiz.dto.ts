import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * PATCH /admin/quizzes/:id body.
 * When attempts exist, only title + description are allowed (enforced in service).
 */
export class UpdateAdminQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  openDate?: string;

  @IsOptional()
  @IsString()
  closesAt?: string;

  @IsOptional()
  @IsNumber()
  passScore?: number | null;
}

export const ATTEMPT_LOCK_MESSAGE =
  'This quiz has student attempts. Duplicate the quiz to make structural changes.';
