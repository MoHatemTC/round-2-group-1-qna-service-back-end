const assert = require('node:assert/strict');
const { validateQuestion } = require('../services/validateQuestion');

// Valid question passes cleanly.
{
  const { valid, errors } = validateQuestion({
    text: 'What is 2 + 2?',
    options: [{ id: 'a', text: '3' }, { id: 'b', text: '4' }],
    correctOptionId: 'b',
    points: 1,
  });
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
  console.log('PASS: well-formed question validates');
}

// Fewer than 2 options is rejected
{
  const { valid, errors } = validateQuestion({
    text: 'One-option question',
    options: [{ id: 'a', text: 'only one' }],
    correctOptionId: 'a',
  });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('at least 2')));
  console.log('PASS: fewer than 2 options rejected');
}

// correctOptionId not matching any option id is rejected.
{
  const { valid, errors } = validateQuestion({
    text: 'Mismatched correct answer',
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    correctOptionId: 'z',
  });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('correctOptionId must match')));
  console.log('PASS: correctOptionId not matching any option is rejected');
}

// Duplicate option ids are rejected.
{
  const { valid, errors } = validateQuestion({
    text: 'Duplicate ids',
    options: [{ id: 'a', text: 'A' }, { id: 'a', text: 'A again' }],
    correctOptionId: 'a',
  });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('unique')));
  console.log('PASS: duplicate option ids rejected');
}

console.log('All validateQuestion tests passed.');
