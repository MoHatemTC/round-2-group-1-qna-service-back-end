const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const eventBus = require('../events/eventBus');
const { computeScore } = require('./scoring');

class NotFoundError extends Error {}
class AlreadySubmittedError extends Error {}

async function saveAnswer(attemptId, questionId, selectedOptionId) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.status === 'submitted') {
    throw new AlreadySubmittedError('Cannot change answers after submission');
  }

  const existing = attempt.answers.find(a => a.questionId.equals(questionId));
  if (existing) {
    existing.selectedOptionId = selectedOptionId;
    existing.answeredAt = new Date();
  } else {
    attempt.answers.push({ questionId, selectedOptionId, answeredAt: new Date() });
  }

  await attempt.save();
  return attempt;
}


async function submitAttempt(attemptId, { passMarkPercentage = null } = {}) {

  const claimed = await Attempt.findOneAndUpdate(
    { _id: attemptId, status: 'in_progress' },
    { $set: { status: 'submitted', submittedAt: new Date() } },
    { new: false } 
  );

  if (!claimed) {
    return waitForExistingScore(attemptId);
  }

 
  const questions = await Question.find({ quizId: claimed.quizId }).lean();
  const questionSnapshot = questions.map(q => ({
    questionId: q._id,
    text: q.text,
    options: q.options.map(o => ({ id: o.id, text: o.text })),
    correctOptionId: q.correctOptionId,
    points: q.points ?? 1,
  }));

  const score = computeScore(questionSnapshot, claimed.answers, {
    passMarkPercentage,
    submittedAt: claimed.submittedAt,
  });

  const finalAttempt = await Attempt.findByIdAndUpdate(
    attemptId,
    { $set: { questionSnapshot, score } },
    { new: true }
  );

  const payload = {
    attemptId: finalAttempt._id,
    studentId: finalAttempt.studentId,
    quizId: finalAttempt.quizId,
    score,
  };
  eventBus.publish('slot1.quiz.attempt.scored', payload);
  eventBus.publish('slot5.quiz.attempt.scored', payload);

  return score;
}

async function waitForExistingScore(attemptId, { retries = 10, delayMs = 100 } = {}) {
  for (let i = 0; i < retries; i++) {
    const existing = await Attempt.findById(attemptId);
    if (!existing) throw new NotFoundError('Attempt not found');
    if (existing.status !== 'submitted') {
      throw new Error('Unexpected attempt state');
    }
    if (existing.score) return existing.score;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Timed out waiting for a concurrent submission to finish scoring');
}

module.exports = { saveAnswer, submitAttempt, NotFoundError, AlreadySubmittedError };
