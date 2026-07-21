# Answer Format Contract — Slot 3 (Questions) ⇄ Slot 5 (Attempts)

Agree this on day one. Everything below is already implemented against this shape;
if either slot needs to change it, both owners need to be in the room.

## Question (Slot 3 owns this)

```json
{
  "_id": "ObjectId",
  "quizId": "ObjectId",
  "text": "string",
  "options": [
    { "id": "a", "text": "string" },
    { "id": "b", "text": "string" }
  ],
  "correctOptionId": "a",
  "points": 1
}
```

Rules Slot 3 must not break without warning Slot 5:
- `options[].id` is a short stable string ("a"/"b"/"c"/"d"), not an array index.
  Reordering options must not change their `id`s.
- `correctOptionId` always matches one of `options[].id`.
- `points` defaults to 1 if omitted.

## Attempt answer (Slot 5 owns this, Slot 3 just needs to know the shape)

Each answer the student picks is stored as:

```json
{ "questionId": "ObjectId", "selectedOptionId": "b", "answeredAt": "ISODate" }
```

- `selectedOptionId` is the **option id string**, matching `options[].id` above —
  never an index, never the option text.
- Missing entry / `null` / `undefined` all mean "not answered" and score as wrong.
  Scoring never errors on an unanswered question.

## Why this matters

At submit time, Slot 5's Attempt takes a full copy of the relevant Questions
(`questionSnapshot`) and scores the student's answers against **that copy**,
not the live Question collection. So:

- If Slot 3 edits or deletes a question after a student has submitted,
  already-submitted scores don't change.
- If the `selectedOptionId` format and the `correctOptionId` format ever
  drift apart (e.g. one side switches to numeric indices), every score
  breaks silently — comparisons just always miss. This is the actual
  day-four risk: agree the id format now, not after both sides have built
  against different assumptions.
