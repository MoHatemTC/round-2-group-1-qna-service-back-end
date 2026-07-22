import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuizStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  QuestionTypeForValidation,
  validateQuiz,
} from '../questions/validate-quiz';
import {
  AdminQuizDto,
  PublishQuizResponseDto,
} from './dto/admin-quiz.dto';
import {
  ATTEMPT_LOCK_MESSAGE,
  UpdateAdminQuizDto,
} from './dto/update-admin-quiz.dto';

type QuizWithQuestions = Prisma.QuizGetPayload<{
  include: {
    questions: {
      include: { options: true };
    };
  };
}>;

@Injectable()
export class AdminQuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuizForAdmin(quizId: string): Promise<AdminQuizDto> {
    const quiz = await this.loadQuiz(quizId);
    const attemptCount = await this.getAttemptCount(quizId);
    return this.toAdminQuizDto(quiz, attemptCount);
  }

  /**
   * Authoritative publish gate: re-load + validate inside a transaction,
   * then set PUBLISHED. Never trust screen-load validation alone.
   */
  async publishQuiz(quizId: string): Promise<PublishQuizResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: { options: true },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      if (quiz.status === QuizStatus.PUBLISHED) {
        return {
          quizId: quiz.id,
          status: quiz.status,
          message: 'Quiz is already published.',
        };
      }

      const validation = validateQuiz({
        questions: quiz.questions.map((question) => ({
          id: question.id,
          text: question.text,
          type: question.type as QuestionTypeForValidation,
          isHidden: question.isHidden,
          options: question.options.map((option) => ({
            id: option.id,
            option: option.option,
            isCorrect: option.isCorrect,
          })),
        })),
      });

      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Quiz cannot be published.',
          errors: validation.errors,
        });
      }

      const updated = await tx.quiz.update({
        where: { id: quizId },
        data: { status: QuizStatus.PUBLISHED },
      });

      return {
        quizId: updated.id,
        status: updated.status,
        message: 'Quiz published successfully.',
      };
    });
  }

  /**
   * Attempt-aware edit: if any attempt exists (including IN_PROGRESS),
   * only title and description may change.
   */
  async updateQuiz(
    quizId: string,
    dto: UpdateAdminQuizDto,
  ): Promise<AdminQuizDto> {
    const attemptCount = await this.getAttemptCount(quizId);
    const providedFields = (
      Object.keys(dto) as Array<keyof UpdateAdminQuizDto>
    ).filter((field) => dto[field] !== undefined);

    if (attemptCount > 0) {
      const allowed: Array<keyof UpdateAdminQuizDto> = [
        'title',
        'description',
      ];
      const hasDisallowed = providedFields.some(
        (field) => !allowed.includes(field),
      );
      if (hasDisallowed) {
        throw new ForbiddenException(ATTEMPT_LOCK_MESSAGE);
      }
    }

    const data: Prisma.QuizUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (attemptCount === 0) {
      if (dto.duration !== undefined) {
        data.duration = dto.duration;
      }
      if (dto.openDate !== undefined) {
        data.openDate = new Date(dto.openDate);
      }
      if (dto.closesAt !== undefined) {
        data.closesAt = new Date(dto.closesAt);
      }
      if (dto.passScore !== undefined) {
        data.passScore = dto.passScore;
      }
    }

    if (Object.keys(data).length === 0) {
      return this.getQuizForAdmin(quizId);
    }

    try {
      await this.prisma.quiz.update({
        where: { id: quizId },
        data,
      });
    } catch {
      throw new NotFoundException('Quiz not found');
    }

    return this.getQuizForAdmin(quizId);
  }

  private async loadQuiz(quizId: string): Promise<QuizWithQuestions> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private async getAttemptCount(quizId: string): Promise<number> {
    return this.prisma.attempt.count({ where: { quizId } });
  }

  private toAdminQuizDto(
    quiz: QuizWithQuestions,
    attemptCount: number,
  ): AdminQuizDto {
    const questionsForValidation = quiz.questions.map((question) => ({
      id: question.id,
      text: question.text,
      type: question.type as QuestionTypeForValidation,
      isHidden: question.isHidden,
      options: question.options.map((option) => ({
        id: option.id,
        option: option.option,
        isCorrect: option.isCorrect,
      })),
    }));

    const validation = validateQuiz({ questions: questionsForValidation });

    return {
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      openDate: quiz.openDate.toISOString(),
      closesAt: quiz.closesAt.toISOString(),
      duration: quiz.duration,
      passScore: quiz.passScore != null ? Number(quiz.passScore) : null,
      hasAttempts: attemptCount > 0,
      attemptCount,
      canEditStructure: attemptCount === 0,
      isValid: validation.valid,
      validationErrors: validation.errors,
      questions: quiz.questions.map((question) => ({
        questionId: question.id,
        text: question.text,
        type: question.type,
        points: Number(question.points),
        isHidden: question.isHidden,
        options: question.options.map((option) => ({
          optionId: option.id,
          option: option.option,
          isCorrect: option.isCorrect,
        })),
      })),
    };
  }
}
