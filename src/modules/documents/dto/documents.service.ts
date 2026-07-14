// src/modules/documents/documents.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SourceType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    sourceType?: SourceType;
    cohort?: string;
  }) {
    const { skip = 0, take = 50, sourceType, cohort } = params;

    return this.prisma.document.findMany({
      skip,
      take,
      where: {
        ...(sourceType && { sourceType }),
        ...(cohort && { cohort }),
      },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc',
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }

  async getStats() {
    const [totalDocs, totalChunks, sourceTypes] = await Promise.all([
      this.prisma.document.count(),
      this.prisma.chunk.count(),
      this.prisma.document.groupBy({
        by: ['sourceType'],
        _count: true,
      }),
    ]);

    return {
      totalDocuments: totalDocs,
      totalChunks,
      sourceTypes: sourceTypes.map((st) => ({
        type: st.sourceType,
        count: st._count,
      })),
    };
  }
}
