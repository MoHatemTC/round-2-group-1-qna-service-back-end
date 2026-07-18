import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minSimilarity?: number = 0.7;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceTypes?: string[];
}
