import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { SourceType } from '../../../common/enums/source-type.enum'; // ✅ استخدم الـ Enum بتاعنا

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsEnum(SourceType)
  sourceType: SourceType;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
