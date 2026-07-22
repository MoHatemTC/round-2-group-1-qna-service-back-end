/**
 * Shared quiz validity rules — single source of truth for Slot 2 (publish)
 * and Slot 3 (Omar). Import this; never copy the checks elsewhere.
 *
 * Contract: docs/sprint 2/publish-contract.md §A
 */

import type {
  QuizForValidation,
  QuestionForValidation,
  ValidationResult,
} from './validate-quiz.types';

export type {
  QuizForValidation,
  QuestionForValidation,
  QuizOptionForValidation,
  QuestionTypeForValidation,
  ValidationResult,
} from './validate-quiz.types';

/** Visible questions only — hidden ones stay in DB for old attempts. */
export function getVisibleQuestions(
  questions: QuestionForValidation[],
): QuestionForValidation[] {
  return questions.filter((question) => !question.isHidden);
}

/**
 * Validate a quiz for publish (and any other gate that must reuse the same rules).
 * Question numbers (N) are 1-based among visible questions only.
 */
export function validateQuiz(quiz: QuizForValidation): ValidationResult {
  const errors: string[] = [];
  const visibleQuestions = getVisibleQuestions(quiz.questions);

  if (visibleQuestions.length === 0) {
    errors.push('This quiz has no questions');
    return { valid: false, errors };
  }

  visibleQuestions.forEach((question, index) => {
    const questionNumber = index + 1;
    const trimmedText = question.text?.trim() ?? '';

    if (!trimmedText) {
      errors.push(`Question ${questionNumber} has no text`);
    }

    const options = question.options ?? [];
    const correctCount = options.filter((option) => option.isCorrect).length;

    if (correctCount !== 1) {
      errors.push(`Question ${questionNumber} has no correct answer marked`);
    }

    if (question.type === 'MCQ') {
      if (options.length === 1) {
        errors.push(`Question ${questionNumber} has only one option`);
      } else if (options.length < 2) {
        errors.push(
          `Question ${questionNumber} must have at least two options for MCQ`,
        );
      }
    }

    if (question.type === 'TRUE_FALSE' && options.length !== 2) {
      errors.push(
        `Question ${questionNumber} must have exactly two options for True/False`,
      );
    }
  });

  return { valid: errors.length === 0, errors };
}
