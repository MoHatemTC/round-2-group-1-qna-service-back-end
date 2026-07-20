import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDirectDB() {
  try {

    const document = await prisma.document.create({
      data: {
        title: 'Test Document Direct',
        content: 'This is a test document inserted directly into the database.',
        source: 'test-direct.md',
        sourceType: 'FAQ',
        cohort: 'Cohort-2026',
        metadata: { test: true },
      },
    });

    console.log('✅ Document created:', document);

    const documents = await prisma.document.findMany();
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

testDirectDB();
