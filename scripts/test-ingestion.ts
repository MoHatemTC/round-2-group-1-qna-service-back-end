import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { IngestionService } from '../src/modules/ingestion/ingestion.service';
import { SearchService } from '../src/modules/search/dto/search.service';
import { SourceType } from '../src/common/enums/source-type.enum';

async function testIngestion() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestionService = app.get(IngestionService);
  const searchService = app.get(SearchService);

  try {
    const testDocs = [
      {
        title: 'Program Onboarding Guide',
        content: `Welcome to the 12-week program. This guide covers:
        
        Week 1-4: Core Fundamentals
        - Programming basics
        - Data structures
        - Algorithms
        
        Week 5-8: Advanced Topics
        - System design
        - Database optimization
        - API development
        
        Week 9-12: Project Phase
        - Capstone project
        - Code reviews
        - Presentation skills`,
        source: 'onboarding-guide.md',
        sourceType: SourceType.ONBOARDING,
        cohort: 'Cohort-2026',
      },
      {
        title: 'Program Schedule',
        content: `Daily Schedule:
        9:00 AM - Morning Standup
        9:30 AM - Lecture
        11:30 AM - Coding Workshop
        1:00 PM - Lunch Break
        2:00 PM - Pair Programming
        4:00 PM - Review Session
        5:00 PM - End of Day`,
        source: 'schedule.pdf',
        sourceType: SourceType.SCHEDULE, 
        cohort: 'Cohort-2026',
      },
    ];

    for (const doc of testDocs) {
      const result = await ingestionService.ingestDocument(
        doc.title,
        doc.content,
        doc.source,
        doc.sourceType,
        doc.cohort,
        { test: true },
      );
    }

    const queries = [
      'program schedule',
      'onboarding guide',
      'pair programming',
    ];

    for (const query of queries) {
      const results = await searchService.search({ query, limit: 5 });
      results.forEach((r: any, i: number) => {});
    }
  } finally {
    await app.close();
  }
}

testIngestion();
