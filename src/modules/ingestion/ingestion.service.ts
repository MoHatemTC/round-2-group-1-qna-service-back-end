import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SourceType } from '../../common/enums/source-type.enum';

export interface BulkIngestResult {
  title: string;
  success: boolean;
  documentId?: string;
  chunksProcessed?: number;
  isUpdate?: boolean;
  message?: string;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly chunkSize: number;

  constructor(
    private prisma: PrismaService,
    private embeddingsService: EmbeddingsService,
    private configService: ConfigService,
  ) {
    this.chunkSize = this.configService.get('CHUNK_SIZE', 512);
  }

  private cleanContent(content: string): string {
    let cleaned = content.replace(/\0/g, '');
    cleaned = cleaned.replace(/[^\x09\x0A\x0D\x20-\x7E\x80-\uFFFF]/g, '');
    cleaned = cleaned.replace(/^\uFEFF/, '');
    return cleaned.trim();
  }

  async ingestDocument(
    title: string,
    content: string,
    source: string,
    sourceType: SourceType,
    cohort?: string,
    metadata?: Record<string, any>,
  ) {
    const cleanContent = this.cleanContent(content);

    if (!cleanContent || cleanContent.trim().length === 0) {
      throw new BadRequestException('Document content is empty after cleaning');
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(cleanContent)
      .digest('hex');

    const existingDoc = await this.prisma.document.findUnique({
      where: {
        source_title: {
          source,
          title,
        },
      },
      include: {
        chunks: {
          select: {
            contentHash: true,
          },
        },
      },
    });

    if (existingDoc) {
      const hasSameContent = existingDoc.chunks.some(
        (chunk) => chunk.contentHash === contentHash,
      );

      if (hasSameContent) {
        this.logger.log(`Document "${title}" already exists with same content, skipping`);
        return {
          documentId: existingDoc.id,
          chunksProcessed: existingDoc.chunks.length,
          isUpdate: false,
        };
      }

      this.logger.log(`Document "${title}" exists but content changed, updating...`);

      return await this.prisma.$transaction(async (tx: any) => {

        await tx.chunk.deleteMany({
          where: { documentId: existingDoc.id },
        });


        await tx.document.update({
          where: { id: existingDoc.id },
          data: {
            content: cleanContent,
            metadata: metadata || existingDoc.metadata || undefined,
            cohort: cohort || existingDoc.cohort,
          },
        });

        const chunks = this.splitIntoChunks(cleanContent);
        const chunkTexts = chunks.map((c) => c.text);
        const embeddings = await this.embeddingsService.generateEmbeddings(chunkTexts);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i] || [];

          await tx.chunk.create({
            data: {
              documentId: existingDoc.id,
              content: chunk.text,
              contentHash: crypto
                .createHash('sha256')
                .update(chunk.text)
                .digest('hex'),
              chunkIndex: chunk.index,
              embedding: embedding,
            },
          });
        }

        this.logger.log(` Updated ${chunks.length} chunks for document ${existingDoc.id}`);

        return {
          documentId: existingDoc.id,
          chunksProcessed: chunks.length,
          isUpdate: true,
        };
      });
    }

    this.logger.log(`Creating new document "${title}"`);

    const document = await this.prisma.document.create({
      data: {
        title,
        source,
        sourceType,
        cohort,
        content: cleanContent,
        metadata: metadata || undefined,
      },
    });

    this.logger.log(` Document created: ${document.id}`);

    try {
      const chunks = this.splitIntoChunks(cleanContent);
      this.logger.log(` Split into ${chunks.length} chunks`);

      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await this.embeddingsService.generateEmbeddings(chunkTexts);
      this.logger.log(` Generated ${embeddings.length} embeddings`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i] || [];

        await this.prisma.chunk.create({
          data: {
            documentId: document.id,
            content: chunk.text,
            contentHash: crypto
              .createHash('sha256')
              .update(chunk.text)
              .digest('hex'),
            chunkIndex: chunk.index,
            embedding: embedding,
          },
        });
      }

      this.logger.log(` Saved ${chunks.length} chunks for document ${document.id}`);

      return {
        documentId: document.id,
        chunksProcessed: chunks.length,
        isUpdate: false,
      };
    } catch (error) {
      this.logger.error(` Failed to process chunks: ${error.message}`);
      await this.prisma.document.delete({ where: { id: document.id } });
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }
  }

  private splitIntoChunks(content: string): Array<{ text: string; index: number }> {
    const chunks: Array<{ text: string; index: number }> = [];

    const paragraphs = content.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];

      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        if ((currentChunk + ' ' + trimmedSentence).length <= this.chunkSize) {
          currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        } else {
          if (currentChunk) {
            chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });
          }
          currentChunk = trimmedSentence;
        }
      }

      if (currentChunk && chunks.length > 0) {
        currentChunk += '\n';
      }
    }

    if (currentChunk) {
      chunks.push({ text: currentChunk.trim(), index: chunkIndex });
    }

    if (chunks.length === 0 && content.trim()) {
      chunks.push({ text: content.trim(), index: 0 });
    }

    return chunks;
  }

  async bulkIngest(
    documents: Array<{
      title: string;
      content: string;
      source: string;
      sourceType: SourceType;
      cohort?: string;
      metadata?: Record<string, any>;
    }>,
  ): Promise<BulkIngestResult[]> {
    const results: BulkIngestResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.ingestDocument(
          doc.title,
          doc.content,
          doc.source,
          doc.sourceType,
          doc.cohort,
          doc.metadata,
        );
        results.push({
          title: doc.title,
          success: true,
          documentId: result.documentId,
          chunksProcessed: result.chunksProcessed,
          isUpdate: result.isUpdate,
        });
      } catch (error) {
        this.logger.error(`Failed to ingest "${doc.title}": ${error.message}`);
        results.push({
          title: doc.title,
          success: false,
          message: error.message,
        });
      }
    }

    return results;
  }
}