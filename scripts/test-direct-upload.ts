import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { IngestionService } from '../src/modules/ingestion/ingestion.service';
import { SourceType } from '../src/common/enums/source-type.enum';

async function testDirectUpload() {

  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestionService = app.get(IngestionService);

  try {
    const result = await ingestionService.ingestDocument(
      'Direct Test Document',
      'This is a test document created directly from the backend script.',
      'direct-test.md',
      SourceType.FAQ,
      'Cohort-2026',
      { test: true, timestamp: new Date().toISOString() },
    );

  } catch (error) {
  } finally {
    await app.close();
  }
}

testDirectUpload();
