// src/modules/ingestion/ingestion.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { SourceType } from '@prisma/client';

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

  async ingestDocument(
    title: string,
    content: string,
    source: string,
    sourceType: SourceType,
    cohort?: string,
    metadata?: Record<string, any>,
  ) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Document content is empty');
    }

    const contentHash = createHash('sha256').update(content).digest('hex');

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
        this.logger.log(`Document "${title}" already exists, skipping`);
        return {
          documentId: existingDoc.id,
          chunksProcessed: existingDoc.chunks.length,
          isUpdate: false,
        };
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.chunk.deleteMany({
          where: { documentId: existingDoc.id },
        });

        await tx.document.update({
          where: { id: existingDoc.id },
          data: {
            content,
            metadata: metadata ?? existingDoc.metadata ?? undefined,
            cohort: cohort || existingDoc.cohort,
          },
        });

        const chunks = this.splitIntoChunks(content);
        const chunkTexts = chunks.map((c) => c.text);
        const embeddings =
          await this.embeddingsService.generateEmbeddings(chunkTexts);

        await this.createChunksWithEmbeddings(
          tx,
          existingDoc.id,
          chunks,
          embeddings,
        );

        return {
          documentId: existingDoc.id,
          chunksProcessed: chunks.length,
          isUpdate: true,
        };
      });
    }

    return await this.prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          title,
          source,
          sourceType,
          cohort,
          content,
          metadata: metadata || {},
        },
      });

      const chunks = this.splitIntoChunks(content);
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings =
        await this.embeddingsService.generateEmbeddings(chunkTexts);

      await this.createChunksWithEmbeddings(
        tx,
        document.id,
        chunks,
        embeddings,
      );

      return {
        documentId: document.id,
        chunksProcessed: chunks.length,
        isUpdate: false,
      };
    });
  }

  private splitIntoChunks(
    content: string,
  ): Array<{ text: string; index: number }> {
    const chunks: Array<{ text: string; index: number }> = [];

    const paragraphs = content.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [
        trimmedParagraph,
      ];

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

  private async createChunksWithEmbeddings(
    tx: any,
    documentId: string,
    chunks: Array<{ text: string; index: number }>,
    embeddings: number[][],
  ): Promise<void> {
    const chunkData = chunks.map((chunk, index) => ({
      documentId,
      content: chunk.text,
      contentHash: createHash('sha256').update(chunk.text).digest('hex'),
      chunkIndex: chunk.index,
      embedding: embeddings[index] || [],
    }));

    await tx.chunk.createMany({
      data: chunkData,
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      if (embedding && embedding.length > 0) {
        await tx.$executeRaw`
          UPDATE "chunks" 
          SET "embeddingVector" = ${JSON.stringify(embedding)}::vector
          WHERE "documentId" = ${documentId}::uuid 
          AND "chunkIndex" = ${chunk.index}
        `;
      }
    }
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
  ) {
    const results: Array<{
      title: string;
      success: boolean;
      documentId?: string;
      chunksProcessed?: number;
      isUpdate?: boolean;
      message?: string;
    }> = [];

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
          ...result,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        this.logger.error(`Failed to ingest "${doc.title}": ${errorMessage}`);

        results.push({
          title: doc.title,
          success: false,
          message: errorMessage,
        });
      }
    }

    return results;
  }
}
