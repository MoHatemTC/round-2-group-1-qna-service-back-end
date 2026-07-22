const prisma = require('../lib/prisma');
const eventBus = require('../events/eventBus');
const { computeScore } = require('./scoring');


class NotFoundError extends Error {}
class AlreadySubmittedError extends Error {}

async function saveAnswer(attemptId, questionId, selectedOptionId) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.status === 'SUBMITTED') {
    throw new AlreadySubmittedError('Cannot change answers after submission');
  }

  await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, selectedOptionId, answeredAt: new Date() },
    update: { selectedOptionId, answeredAt: new Date() },
  });
}


async function submitAttempt(attemptId, { passMarkPercentage = null } = {}) {

  const claim = await prisma.attempt.updateMany({
    where: { id: attemptId, status: 'IN_PROGRESS' },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });

  if (claim.count === 0) {
    return waitForExistingScore(attemptId);
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { answers: true },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');

  const questions = await prisma.question.findMany({ where: { quizId: attempt.quizId } });
  const questionSnapshot = questions.map(q => ({
    questionId: q.id,
    text: q.text,
    options: q.options,
    correctOptionId: q.correctOptionId,
    points: q.points,
  }));

  const score = computeScore(questionSnapshot, attempt.answers, {
    passMarkPercentage,
    submittedAt: attempt.submittedAt,
  });

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { questionSnapshot, score },
  });

  const payload = {
    attemptId: attempt.id,
    studentId: attempt.studentId,
    quizId: attempt.quizId,
    score,
  };
  eventBus.publish('slot1.quiz.attempt.scored', payload);
  eventBus.publish('slot5.quiz.attempt.scored', payload);

  return score;
}

async function waitForExistingScore(attemptId, { retries = 10, delayMs = 100 } = {}) {
  for (let i = 0; i < retries; i++) {
    const existing = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!existing) throw new NotFoundError('Attempt not found');
    if (existing.status !== 'SUBMITTED') {
      throw new Error('Unexpected attempt state');
    }
    if (existing.score) return existing.score;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Timed out waiting for a concurrent submission to finish scoring');
}

module.exports = { saveAnswer, submitAttempt, NotFoundError, AlreadySubmittedError };
