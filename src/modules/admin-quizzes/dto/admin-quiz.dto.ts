export class AdminQuizOptionDto {
  optionId: string;
  option: string;
  isCorrect: boolean;
}

export class AdminQuizQuestionDto {
  questionId: string;
  text: string;
  type: string;
  points: number;
  isHidden: boolean;
  options: AdminQuizOptionDto[];
}

/** GET /admin/quizzes/:id — screen-load preview (includes validationErrors). */
export class AdminQuizDto {
  quizId: string;
  title: string;
  description: string | null;
  status: string;
  openDate: string;
  closesAt: string;
  duration: number;
  passScore: number | null;
  hasAttempts: boolean;
  attemptCount: number;
  canEditStructure: boolean;
  isValid: boolean;
  validationErrors: string[];
  questions: AdminQuizQuestionDto[];
}

/** PATCH /admin/quizzes/:id/publish — success body. */
export class PublishQuizResponseDto {
  quizId: string;
  status: string;
  message: string;
}
