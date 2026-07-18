import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { SearchModule } from './modules/search/dto/search.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    DocumentsModule,
    EmbeddingsModule,
    IngestionModule,
    SearchModule,
    QuizzesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
