
function validateQuestion({ text, options, correctOptionId, points }) {
  const errors = [];

  if (!text || typeof text !== 'string') {
    errors.push('text is required and must be a string');
  }

  if (!Array.isArray(options) || options.length < 2) {
    errors.push('options must be an array of at least 2 items');
  } else {
    const badShape = options.some(
      o => !o || typeof o.id !== 'string' || typeof o.text !== 'string'
    );
    if (badShape) {
      errors.push('every option needs a string id and a string text');
    }
    const ids = options.map(o => o && o.id);
    if (new Set(ids).size !== ids.length) {
      errors.push('option ids must be unique within a question');
    }
  }

  if (typeof correctOptionId !== 'string' || correctOptionId.length === 0) {
    errors.push('correctOptionId is required and must be a string');
  } else if (Array.isArray(options) && !options.some(o => o && o.id === correctOptionId)) {
    errors.push('correctOptionId must match one of the options');
  }

  if (points != null && (typeof points !== 'number' || points < 0)) {
    errors.push('points must be a non-negative number');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateQuestion };
