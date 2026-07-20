import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EmbeddingsService } from '../../../modules/embeddings/embeddings.service';
import { SearchDto } from '../dto/search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    private embeddingsService: EmbeddingsService,
  ) {}

  async search(searchDto: SearchDto) {
    const {
      query,
      limit = 10,
      cohort,
      minSimilarity = 0.7,
      sourceTypes,
    } = searchDto;

    const queryEmbedding =
      await this.embeddingsService.generateEmbedding(query);

    let sql = `
      SELECT 
        c.id,
        c.content,
        c."documentId",
        c."chunkIndex",
        d.title,
        d.source,
        d."sourceType",
        d.cohort,
        d.metadata as "documentMetadata",
        1 - (c."embeddingVector" <=> $1::vector) as similarity
      FROM "chunks" c
      INNER JOIN "documents" d ON c."documentId" = d.id
      WHERE c."embeddingVector" IS NOT NULL
    `;

    const params: any[] = [JSON.stringify(queryEmbedding)];
    let paramIndex = 2;

    if (cohort) {
      sql += ` AND d.cohort = $${paramIndex}`;
      params.push(cohort);
      paramIndex++;
    }

    if (sourceTypes && sourceTypes.length > 0) {
      sql += ` AND d."sourceType" = ANY($${paramIndex}::text[])`;
      params.push(sourceTypes);
      paramIndex++;
    }

    sql += ` AND (1 - (c."embeddingVector" <=> $1::vector)) >= $${paramIndex}`;
    params.push(minSimilarity);
    paramIndex++;

    sql += `
      ORDER BY c."embeddingVector" <=> $1::vector
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    type SearchResult = {
      id: string;
      title: string;
      content: string;
      similarity: number;
    };

    const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
      sql,
      ...params,
    );

    return results;
  }
}
