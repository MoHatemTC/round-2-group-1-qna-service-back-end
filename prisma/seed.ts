import {
  AttemptStatus,
  PrismaClient,
  QuestionType,
  QuizStatus,
  StudentStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const VERIFIED_STUDENT_ID = '11111111-1111-1111-1111-111111111111';
const PUBLISHABLE_DRAFT_ID = '22222222-2222-2222-2222-222222222222';
const INVALID_DRAFT_ID = '33333333-3333-3333-3333-333333333333';
const EMPTY_DRAFT_ID = '44444444-4444-4444-4444-444444444444';
 
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
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const notStartedQuiz = await prisma.quiz.create({
    data: {
      title: 'Not Started Quiz',
      description: 'Opens and closes in the future',
      status: QuizStatus.PUBLISHED,
      openDate: now,
      closesAt: weekFromNow,
      duration: 60,
    },
  });

  const inProgressQuiz = await prisma.quiz.create({
    data: {
      title: 'In Progress Quiz',
      description: 'Student has an active attempt',
      status: QuizStatus.PUBLISHED,
      openDate: now,
      closesAt: weekFromNow,
      duration: 60,
    },
  });

  const submittedQuiz = await prisma.quiz.create({
    data: {
      title: 'Submitted Quiz',
      description: 'Student already submitted',
      status: QuizStatus.PUBLISHED,
      openDate: now,
      closesAt: weekFromNow,
      duration: 60,
    },
  });

  const closedQuiz = await prisma.quiz.create({
    data: {
      title: 'Closed Quiz',
      description: 'Window has passed',
      status: QuizStatus.PUBLISHED,
      openDate: dayAgo,
      closesAt: dayAgo,
      duration: 60,
    },
  });

  const draftQuiz = await prisma.quiz.create({
    data: {
      title: 'Draft Quiz',
      description: 'Should never appear on dashboard',
      status: QuizStatus.DRAFT,
      openDate: now,
      closesAt: weekFromNow,
      duration: 60,
    },
  });

  const publishableDraft = await prisma.quiz.create({
    data: {
      id: PUBLISHABLE_DRAFT_ID,
      title: 'Publishable Draft Quiz',
      description: 'Valid draft for publish demo',
      status: QuizStatus.DRAFT,
      openDate: now,
      closesAt: weekFromNow,
      duration: 45,
      passScore: 70,
    },
  });

  const invalidDraft = await prisma.quiz.create({
    data: {
      id: INVALID_DRAFT_ID,
      title: 'Invalid Draft Quiz',
      description: 'Missing correct answer',
      status: QuizStatus.DRAFT,
      openDate: now,
      closesAt: weekFromNow,
      duration: 60,
    },
  });

  const emptyDraft = await prisma.quiz.create({
    data: {
      id: EMPTY_DRAFT_ID,
      title: 'Empty Draft Quiz',
      description: 'No questions',
      status: QuizStatus.DRAFT,
      openDate: now,
      closesAt: weekFromNow,
      duration: 60,
    },
  });

  for (const quiz of [
    notStartedQuiz,
    inProgressQuiz,
    submittedQuiz,
    closedQuiz,
    draftQuiz,
    publishableDraft,
    invalidDraft,
    emptyDraft,
  ]) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        quizId: quiz.id,
      },
    });
  }

  await prisma.question.create({
    data: {
      quizId: publishableDraft.id,
      text: 'What is 2+2?',
      type: QuestionType.MCQ,
      points: 1,
      options: {
        create: [
          { option: '3', isCorrect: false },
          { option: '4', isCorrect: true },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      quizId: invalidDraft.id,
      text: 'Ungraded question',
      type: QuestionType.MCQ,
      points: 1,
      options: {
        create: [
          { option: 'A', isCorrect: false },
          { option: 'B', isCorrect: false },
        ],
      },
    },
  });

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
  console.log(`PUBLISHABLE_DRAFT_QUIZ_ID=${publishableDraft.id}`);
  console.log(`INVALID_DRAFT_QUIZ_ID=${invalidDraft.id}`);
  console.log(`EMPTY_DRAFT_QUIZ_ID=${emptyDraft.id}`);
  console.log(`IN_PROGRESS_QUIZ_ID=${inProgressQuiz.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
