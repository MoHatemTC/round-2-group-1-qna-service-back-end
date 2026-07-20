export class QuizAttemptResponseDto {
    id: string;
    quizId: string;
    userId: string;
    startedAt: Date;
    completedAt?: Date;
    score?: number;
    timeRemaining?: number;
    totalDuration: number;
  }