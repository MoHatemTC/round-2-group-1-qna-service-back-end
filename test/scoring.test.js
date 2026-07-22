const assert = require('node:assert/strict');
const { computeScore } = require('../services/scoring');

const snapshot = [
  { questionId: 'q1', correctOptionId: 'a', points: 1 },
  { questionId: 'q2', correctOptionId: 'b', points: 2 },
  { questionId: 'q3', correctOptionId: 'c', points: 1 },
];

// Mixed: correct, wrong, and one question never answered at all.
{
  const answers = [
    { questionId: 'q1', selectedOptionId: 'a' },
    { questionId: 'q2', selectedOptionId: 'x' },
    // q3 intentionally absent — must score as wrong, not throw.
  ];
  const score = computeScore(snapshot, answers, { passMarkPercentage: 50 });
  assert.equal(score.rawScore, 1);
  assert.equal(score.maxScore, 4);
  assert.equal(score.percentage, 25);
  assert.equal(score.passed, false);
  console.log('PASS: unanswered question scores as wrong, no error');
}

// All correct.
{
  const answers = [
    { questionId: 'q1', selectedOptionId: 'a' },
    { questionId: 'q2', selectedOptionId: 'b' },
    { questionId: 'q3', selectedOptionId: 'c' },
  ];
  const score = computeScore(snapshot, answers, { passMarkPercentage: 50 });
  assert.equal(score.rawScore, 4);
  assert.equal(score.percentage, 100);
  assert.equal(score.passed, true);
  console.log('PASS: fully correct attempt scores 100%');
}

// No pass mark configured -> passed must be null, not false.
{
  const score = computeScore(snapshot, [], {});
  assert.equal(score.passed, null);
  assert.equal(score.rawScore, 0);
  console.log('PASS: no pass mark configured leaves passed as null');
}

// Explicit null selection (option was picked then cleared) also counts as wrong.
{
  const answers = [{ questionId: 'q1', selectedOptionId: null }];
  const score = computeScore(snapshot, answers, {});
  assert.equal(score.rawScore, 0);
  console.log('PASS: explicit null selection scores as wrong');
}

console.log('All scoring tests passed.');
