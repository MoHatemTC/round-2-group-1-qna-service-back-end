import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly dimensions: number;

  constructor(private configService: ConfigService) {
    this.dimensions = this.configService.get('EMBEDDING_DIMENSIONS', 1536);
    this.logger.warn(' Using MOCK embeddings - NOT for production!');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    
    if (!text || text.trim().length < 5) {
      this.logger.warn('Text too short, using fallback embedding');
      return this.generateFallbackEmbedding();
    }

  
    const embedding = new Array(this.dimensions).fill(0);

    const textLength = text.length;
    const hash = text
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const index1 = Math.abs(hash) % this.dimensions;
    const index2 = Math.abs(hash + textLength) % this.dimensions;
    const index3 = Math.abs(hash + textLength * 2) % this.dimensions;

  
    embedding[index1] = 0.8 + (Math.abs(hash) % 10) / 100;
    embedding[index2] = 0.5 + (textLength % 10) / 100;
    embedding[index3] = 0.3 + (Math.abs(hash + textLength) % 10) / 100;

    const cleanedEmbedding = embedding.map((val) => {
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return 0;
      }
      return Math.min(Math.max(val, -1), 1);
    });
    this.logger.log(
  `Length: ${cleanedEmbedding.length}`,
);

this.logger.log(
  `Undefined count: ${
    cleanedEmbedding.filter(v => v === undefined).length
  }`,
);

this.logger.log(
  cleanedEmbedding.slice(0, 20),
);


    return cleanedEmbedding.every((v) => typeof v === 'number')
      ? cleanedEmbedding
      : this.generateFallbackEmbedding();
  }

  private generateFallbackEmbedding(): number[] {

    const embedding = new Array(this.dimensions).fill(0);
    for (let i = 0; i < 50; i++) {
      const index = Math.floor(Math.random() * this.dimensions);
      embedding[index] = 0.1 + Math.random() * 0.4;
    }
    return embedding.map((v) => (typeof v === 'number' ? v : 0));
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map((text) => this.generateEmbedding(text)),
    );


    return embeddings.map((emb) => {
      if (!Array.isArray(emb) || emb.length !== this.dimensions) {
        this.logger.warn('Invalid embedding detected, using fallback');
        return this.generateFallbackEmbedding();
      }
      return emb.every((v) => typeof v === 'number')
        ? emb
        : this.generateFallbackEmbedding();
    });
  }
}
