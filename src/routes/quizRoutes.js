const express = require('express');
const router = express.Router();
const {
  saveAnswer,
  submitAttempt,
  NotFoundError,
  AlreadySubmittedError,
} = require('../services/quizScoringService');

router.put('/attempts/:attemptId/answers/:questionId', async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;
    const { selectedOptionId } = req.body;
    await saveAnswer(attemptId, questionId, selectedOptionId);
    res.status(200).json({ saved: true });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof AlreadySubmittedError) return res.status(409).json({ error: err.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/attempts/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { passMarkPercentage } = req.body; 
    const score = await submitAttempt(attemptId, { passMarkPercentage });
    res.status(200).json({ score });
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
