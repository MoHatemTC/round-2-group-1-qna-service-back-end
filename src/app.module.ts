// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { DocumentsModule } from './modules/documents/dto/documents.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { SearchModule } from './modules/search/dto/search.module';
import { StudentQuizAccessModule } from './modules/student-quiz-access/student-quiz-access.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { StudentQuizzesModule } from './modules/student-quizzes/student-quizzes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    DocumentsModule,
    EmbeddingsModule,
    IngestionModule,
    SearchModule,
    StudentQuizAccessModule,
    QuizModule,
    StudentQuizzesModule,
  ],
})
export class AppModule {}
