import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEventsService } from './events/score-events.service';
import { AttemptAnswers, computeScore, QuestionSnapshotItem, ScoreResult } from './scoring';

@Injectable()
export class AttemptScoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: ScoreEventsService,
  ) {}

  async saveAnswer(attemptId: string, questionId: string, selectedOptionId: string | null): Promise<void> {
    const entry = JSON.stringify({ selectedOptionId, answeredAt: new Date().toISOString() });

    const affected = await this.prisma.$executeRaw`
      UPDATE "Attempt"
      SET "attemptAnswers" = jsonb_set(
        COALESCE("attemptAnswers", '{}'::jsonb),
        ARRAY[${questionId}]::text[],
        ${entry}::jsonb,
        true
      )
      WHERE id = ${attemptId}::uuid AND status = 'IN_PROGRESS'::"AttemptStatus"
    `;

    if (affected === 0) {
      const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
      if (!attempt) throw new NotFoundException('Attempt not found');
      throw new ConflictException('Cannot change answers after submission');
    }
  }

  async submitAttempt(attemptId: string): Promise<ScoreResult> {

    const claimed = await this.prisma.$executeRaw`
      UPDATE "Attempt"
      SET status = 'SUBMITTED'::"AttemptStatus", "submittedAt" = NOW()
      WHERE id = ${attemptId}::uuid AND status = 'IN_PROGRESS'::"AttemptStatus"
    `;

    if (claimed === 0) {
      return this.recomputeStoredScore(attemptId);
    }

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const questions = await this.prisma.question.findMany({
      where: { quizId: attempt.quizId },
      include: { options: true },
    });

    const questionSnapshot: QuestionSnapshotItem[] = questions.map(q => ({
      questionId: q.id,
      text: q.text,
      type: q.type,
      points: q.points.toNumber(),
      options: q.options.map(o => ({ id: o.id, option: o.option, isCorrect: o.isCorrect })),
    }));

    const answers = (attempt.attemptAnswers ?? {}) as unknown as AttemptAnswers;

    const passScorePercentage = attempt.quiz.passScore != null ? attempt.quiz.passScore.toNumber() : null;

    const score = computeScore(questionSnapshot, answers, {
      passScorePercentage,
      submittedAt: attempt.submittedAt ?? new Date(),
    });

    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        questionSnapshot: questionSnapshot as any,
        score: score.percentage,
      },
    });

    const payload = {
      attemptId: attempt.id,
      studentId: attempt.studentId,
      quizId: attempt.quizId,
      score,
    };
    this.events.publish('slot1.quiz.attempt.scored', payload);
    this.events.publish('slot5.quiz.attempt.scored', payload);

    return score;
  }

  private async recomputeStoredScore(attemptId: string, retries = 10, delayMs = 100): Promise<ScoreResult> {
    for (let i = 0; i < retries; i++) {
      const attempt = await this.prisma.attempt.findUnique({
        where: { id: attemptId },
        include: { quiz: true },
      });
      if (!attempt) throw new NotFoundException('Attempt not found');
      if (attempt.status === 'IN_PROGRESS') {
        throw new Error('Unexpected attempt state');
      }
      if (attempt.questionSnapshot) {
        const questionSnapshot = attempt.questionSnapshot as unknown as QuestionSnapshotItem[];
        const answers = (attempt.attemptAnswers ?? {}) as unknown as AttemptAnswers;
        const passScorePercentage = attempt.quiz.passScore != null ? attempt.quiz.passScore.toNumber() : null;
        return computeScore(questionSnapshot, answers, {
          passScorePercentage,
          submittedAt: attempt.submittedAt ?? new Date(),
        });
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error('Timed out waiting for a concurrent submission to finish scoring');
  }
}
