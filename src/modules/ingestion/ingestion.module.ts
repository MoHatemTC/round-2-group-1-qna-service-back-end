import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { DocumentsModule } from '../documents/documents.module';
import { FileParserService } from '../../../src/common/prisma/services/file-parser.service';

@Module({
  imports: [EmbeddingsModule, DocumentsModule],
  controllers: [IngestionController],
  providers: [IngestionService, FileParserService],
  exports: [IngestionService],
})
export class IngestionModule {}
