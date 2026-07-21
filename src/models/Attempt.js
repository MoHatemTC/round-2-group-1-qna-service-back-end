const mongoose = require('mongoose');

/**
 * SLOT 5 CONTRACT — Attempt model (agree this shape on day one).
 *
 * Three distinct pieces of state live here, on purpose:
 *   1. answers          — live, mutable, updated as the student picks (every click).
 *   2. questionSnapshot  — frozen copy of the question bank, written ONCE at submit time.
 *   3. score             — computed once from (1) scored against (2), never recomputed.
 *
 * Because scoring reads from questionSnapshot (not the live Question collection),
 * a later edit or deletion in the question bank can never change a past score.
 */

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptionId: { type: String, default: null }, // null/absent = not answered yet
  answeredAt: { type: Date, default: Date.now },
}, { _id: false });

const questionSnapshotSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, required: true },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
  }],
  correctOptionId: { type: String, required: true },
  points: { type: Number, required: true },
}, { _id: false });

const scoreSchema = new mongoose.Schema({
  rawScore: { type: Number, required: true },   // points earned
  maxScore: { type: Number, required: true },    // total possible points
  percentage: { type: Number, required: true },  // 0-100
  passed: { type: Boolean, default: null },      // null when no pass mark is configured
  submittedAt: { type: Date, required: true },
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress', index: true },

  answers: [answerSchema],
  questionSnapshot: [questionSnapshotSchema],
  score: { type: scoreSchema, default: null },

  submittedAt: { type: Date, default: null },
}, { timestamps: true });

attemptSchema.index({ studentId: 1, quizId: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
