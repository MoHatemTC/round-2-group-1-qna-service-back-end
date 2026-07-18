import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDB() {
  try {
    console.log('🔍 Testing database connection...');

    const count = await prisma.document.count();

    const documents = await prisma.document.findMany();
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
