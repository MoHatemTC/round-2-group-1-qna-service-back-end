// src/modules/documents/dto/create-document.dto.ts
import {
    IsEnum,
    IsOptional,
    IsString,
    IsObject,
    IsNotEmpty,
  } from 'class-validator';
  import { SourceType } from '@prisma/client';
  
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