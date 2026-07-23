// src/modules/quizzes/dto/update-quiz.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateQuizDto } from './create-quiz.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}