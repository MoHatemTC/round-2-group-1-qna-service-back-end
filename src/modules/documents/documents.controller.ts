// src/modules/documents/documents.controller.ts
// ✅ شيل .js من الآخر
import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SourceType } from '../../common/enums/source-type.enum';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sourceType') sourceType?: SourceType,
    @Query('cohort') cohort?: string,
  ) {
    try {
      const result = await this.documentsService.findAll({
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : undefined,
        sourceType,
        cohort,
      });

      const count = Array.isArray(result) ? result.length : 0;
      console.log('📄 Documents found:', count);

      return result || [];
    } catch (error) {
      console.error('❌ Error in findAll:', error);
      return [];
    }
  }

  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    return this.documentsService.getStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
