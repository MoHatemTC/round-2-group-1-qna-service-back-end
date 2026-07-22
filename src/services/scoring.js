
function computeScore(questionSnapshot, answers, { passMarkPercentage = null, submittedAt = new Date() } = {}) {
  const answerMap = new Map(
    answers.map(a => [String(a.questionId), a.selectedOptionId])
  );

  let rawScore = 0;
  let maxScore = 0;

  for (const q of questionSnapshot) {
    maxScore += q.points;

    const selected = answerMap.has(String(q.questionId)) ? answerMap.get(String(q.questionId)) : null;
    if (selected != null && selected === q.correctOptionId) {
      rawScore += q.points;
    }
  }

  const percentage = maxScore > 0 ? Math.round((rawScore / maxScore) * 10000) / 100 : 0;
  const passed = passMarkPercentage != null ? percentage >= passMarkPercentage : null;

  return { rawScore, maxScore, percentage, passed, submittedAt };
}

module.exports = { computeScore };
