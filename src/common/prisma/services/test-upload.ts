import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { IngestionService } from '../../../modules/ingestion/ingestion.service';
import { SourceType } from 'src/common/enums/source-type.enum';

async function testUpload() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestionService = app.get(IngestionService);

  try {
    console.log('🚀 Testing upload...');

    const results = await ingestionService.bulkIngest([
      {
        title: 'Test Document from Script',
        content:
          'This is a test document created directly from the backend script.',
        source: 'test-script.md',
        sourceType: SourceType.FAQ,
        cohort: 'Cohort-2026',
        metadata: { test: true },
      },
    ]);

  } finally {
    await app.close();
  }
}

testUpload();
