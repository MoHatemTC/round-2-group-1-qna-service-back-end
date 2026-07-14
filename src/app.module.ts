// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; 
import { PrismaModule } from './common/prisma/prisma.module';
import { DocumentsModule } from './modules/documents/dto/documents.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { SearchModule } from './modules/search/dto/search.module';
import { NotificationsModule } from './notifications/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    DocumentsModule,
    EmbeddingsModule,
    IngestionModule,
    SearchModule,
    NotificationsModule,
  ],
})
export class AppModule {}
