import {
  AttemptStatus,
  PrismaClient,
  QuizStatus,
  StudentStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const VERIFIED_STUDENT_ID = '11111111-1111-1111-1111-111111111111';

async function main() {
  await prisma.attempt.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.student.deleteMany();

  const student = await prisma.student.create({
    data: {
      id: VERIFIED_STUDENT_ID,
      name: 'Assem Test',
      email: 'assem.test@example.com',
      status: StudentStatus.VERIFIED,
    },
  });

  const now = new Date();

  const notStartedQuiz = await prisma.quiz.create({
    data: {
      title: 'Not Started Quiz',
      description: 'Opens and closes in the future',
      status: QuizStatus.PUBLISHED,
      closesAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const inProgressQuiz = await prisma.quiz.create({
    data: {
      title: 'In Progress Quiz',
      description: 'Student has an active attempt',
      status: QuizStatus.PUBLISHED,
      closesAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const submittedQuiz = await prisma.quiz.create({
    data: {
      title: 'Submitted Quiz',
      description: 'Student already submitted',
      status: QuizStatus.PUBLISHED,
      closesAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const closedQuiz = await prisma.quiz.create({
    data: {
      title: 'Closed Quiz',
      description: 'Window has passed',
      status: QuizStatus.PUBLISHED,
      closesAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  const draftQuiz = await prisma.quiz.create({
    data: {
      title: 'Draft Quiz',
      description: 'Should never appear on dashboard',
      status: QuizStatus.DRAFT,
      closesAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  for (const quiz of [
    notStartedQuiz,
    inProgressQuiz,
    submittedQuiz,
    closedQuiz,
    draftQuiz,
  ]) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        quizId: quiz.id,
      },
    });
  }

  await prisma.attempt.create({
    data: {
      studentId: student.id,
      quizId: inProgressQuiz.id,
      status: AttemptStatus.IN_PROGRESS,
    },
  });

  await prisma.attempt.create({
    data: {
      studentId: student.id,
      quizId: submittedQuiz.id,
      status: AttemptStatus.SUBMITTED,
      submittedAt: new Date(),
      score: 85,
    },
  });

  console.log('Seed complete.');
  console.log(`MOCK_STUDENT_ID=${student.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
