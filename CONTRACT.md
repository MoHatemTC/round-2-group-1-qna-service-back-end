# Answer Format Contract — Slot 3 (Questions) ⇄ Slot 5 (Attempts)

Agree this on day one. Everything below is already implemented against this shape;
if either slot needs to change it, both owners need to be in the room.

## Question (Slot 3 owns this)

```json
{
  "id": "cuid-string",
  "quizId": "string",
  "text": "string",
  "options": [
    { "id": "a", "text": "string" },
    { "id": "b", "text": "string" }
  ],
  "correctOptionId": "a",
  "points": 1
}
```

`options` is stored as a Prisma `Json` column. **This is the main thing that
changed from a Mongoose version of this contract: Prisma enforces nothing about
its internal shape.** There is no schema-level guarantee that `options` has at
least 2 entries, that ids are unique, or that `correctOptionId` matches one of
them — the database will happily store garbage. Call
`services/validateQuestion.js` before every create/update to get that guarantee
back at the application layer.

Rules Slot 3 must not break without warning Slot 5:
- `options[].id` is a short stable string ("a"/"b"/"c"/"d"), not an array index.
  Reordering options must not change their `id`s.
- `correctOptionId` always matches one of `options[].id`.
- `points` defaults to 1 if omitted.

## Attempt answer (Slot 5 owns this, Slot 3 just needs to know the shape)

Each answer the student picks is one row:

```json
{ "attemptId": "cuid", "questionId": "cuid", "selectedOptionId": "b", "answeredAt": "ISODate" }
```

- `selectedOptionId` is the **option id string**, matching `options[].id` above —
  never an index, never the option text.
- `null` / missing row both mean "not answered" and score as wrong.
  Scoring never errors on an unanswered question.

## Why this matters

At submit time, Slot 5's Attempt takes a full copy of the relevant Questions
(`questionSnapshot`, itself a `Json` column) and scores the student's answers
against **that copy**, not the live Question table. So:

- If Slot 3 edits or deletes a question after a student has submitted,
  already-submitted scores don't change.
- If the `selectedOptionId` format and the `correctOptionId` format ever
  drift apart (e.g. one side switches to numeric indices), every score
  breaks silently — comparisons just always miss, no error to catch it. This
  is the actual day-four risk: agree the id format now, and validate it at
  write time, rather than after both sides have built against different
  assumptions.
