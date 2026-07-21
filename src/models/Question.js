const mongoose = require('mongoose');

/**
 * SLOT 3 CONTRACT — Question format (agree this shape on day one).
 *
 * Attempts snapshot this exact structure at submit time (see Attempt.js),
 * so any change here must be coordinated with Slot 5 — old attempts are
 * scored against their own frozen copy, but new attempts and the live
 * question bank must still agree on field names and types.
 */
const optionSchema = new mongoose.Schema({
  id: { type: String, required: true },   
  text: { type: String, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  text: { type: String, required: true },
  options: {
    type: [optionSchema],
    validate: v => Array.isArray(v) && v.length >= 2,
  },
  correctOptionId: { type: String, required: true }, // must match one options[].id
  points: { type: Number, default: 1, min: 0 },
}, { timestamps: true });

questionSchema.path('correctOptionId').validate(function (value) {
  return this.options.some(o => o.id === value);
}, 'correctOptionId must match one of the options');

module.exports = mongoose.model('Question', questionSchema);
