// src/modules/documents/documents.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SourceType } from '../../common/enums/source-type.enum';

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
    
    try {
      const documents = await this.prisma.document.findMany({
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
      
      this.logger.log(`✅ Found ${documents.length} documents`);
      return documents;
    } catch (error) {
      this.logger.error(`❌ Error fetching documents: ${error.message}`);
      return [];
    }
  }

  async findOne(id: string) {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          chunks: {
            orderBy: {
              chunkIndex: 'asc',
            },
          },
        },
      });
      
      if (!document) {
        this.logger.warn(`Document with id ${id} not found`);
        return null;
      }
      
      return document;
    } catch (error) {
      this.logger.error(`Error fetching document ${id}: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const document = await this.prisma.document.delete({
        where: { id },
      });
      this.logger.log(`✅ Deleted document: ${id}`);
      return document;
    } catch (error) {
      this.logger.error(`Error deleting document ${id}: ${error.message}`);
      throw error;
    }
  }

  async getStats() {
    try {
      const totalDocs = await this.prisma.document.count();
      
      let totalChunks = 0;
      try {
        totalChunks = await this.prisma.chunk.count();
      } catch (error) {
        this.logger.warn('Could not count chunks, using 0');
        totalChunks = 0;
      }
      
      const sourceTypes = await this.prisma.$queryRaw`
        SELECT "sourceType", COUNT(*) as count
        FROM "documents"
        GROUP BY "sourceType"
        ORDER BY "sourceType" ASC
      `;

      return {
        totalDocuments: totalDocs,
        totalChunks,
        sourceTypes: (sourceTypes as any[]).map((st: any) => ({
          type: st.sourceType,
          count: Number(st.count),
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching stats: ${error.message}`);
      return {
        totalDocuments: 0,
        totalChunks: 0,
        sourceTypes: [],
      };
    }
  }
}