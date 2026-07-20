import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  ParseArrayPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './ingestion.service';
import { CreateDocumentDto } from '../documents/dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileParserService } from '../../common/prisma/services/file-parser.service';
import { SourceType } from '../../common/enums/source-type.enum';

@Controller('ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngestionController {
  constructor(
    private ingestionService: IngestionService,
    private fileParserService: FileParserService,
  ) {}

  @Post('document')
  @Roles('ADMIN')
  async ingestDocument(@Body() createDocDto: CreateDocumentDto) {
    try {
      const result = await this.ingestionService.ingestDocument(
        createDocDto.title,
        createDocDto.content,
        createDocDto.source,
        createDocDto.sourceType,
        createDocDto.cohort,
        createDocDto.metadata,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('bulk')
  @Roles('ADMIN')
  async bulkIngest(
    @Body('documents', new ParseArrayPipe({ items: CreateDocumentDto }))
    documents: CreateDocumentDto[],
  ) {
    const results = await this.ingestionService.bulkIngest(
      documents.map((doc) => ({
        title: doc.title,
        content: doc.content,
        source: doc.source,
        sourceType: doc.sourceType as SourceType,
        cohort: doc.cohort,
        metadata: doc.metadata,
      })),
    );

    return {
      success: true,
      total: documents.length,
      results,
    };
  }

  @Post('files')
  @Roles('ADMIN')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, 
        files: 10,
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { sourceType: string; cohort?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results: any[] = [];

    for (const file of files) {
      try {
        const content = await this.fileParserService.parseFile(file);
        const sourceType = body.sourceType as SourceType;

        const result = await this.ingestionService.ingestDocument(
          file.originalname,
          content,
          file.originalname,
          sourceType,
          body.cohort,
          {
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        );
        results.push({
          fileName: file.originalname,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          fileName: file.originalname,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      totalFiles: files.length,
      results,
    };
  }
}
