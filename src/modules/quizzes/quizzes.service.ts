import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { QuizStatus } from '../../common/enums/quiz-status.enum';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuizDto) {
    const openDate = new Date(dto.openDate);
    const closeDate = new Date(dto.closeDate);
    if (closeDate <= openDate) {
      throw new BadRequestException('Close date must be after open date');
    }

    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        openDate,
        closeDate,
        passScore: dto.passScore || 0,
        status: dto.status || QuizStatus.DRAFT,
      },
    });
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { attempts: true } },
      },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        attempts: true,
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto) {
    const quiz = await this.findOne(id);

    if (quiz.status !== QuizStatus.DRAFT) {
      throw new ForbiddenException('Only draft quizzes can be edited');
    }

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.passScore !== undefined) updateData.passScore = dto.passScore;

    if (dto.openDate !== undefined || dto.closeDate !== undefined) {
      const openDate = dto.openDate ? new Date(dto.openDate) : quiz.openDate;
      const closeDate = dto.closeDate
        ? new Date(dto.closeDate)
        : quiz.closeDate;
      if (closeDate <= openDate) {
        throw new BadRequestException('Close date must be after open date');
      }
      if (dto.openDate !== undefined) updateData.openDate = openDate;
      if (dto.closeDate !== undefined) updateData.closeDate = closeDate;
    }

    if (dto.publish === true) {
      updateData.status = QuizStatus.PUBLISHED;
    }

    return this.prisma.quiz.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const quiz = await this.findOne(id);

    const attempts = await this.prisma.quizAttempt.count({
      where: { quizId: id },
    });

    if (attempts > 0) {
      throw new BadRequestException(
        `Cannot delete quiz with ${attempts} attempt(s). This quiz has been taken by students.`,
      );
    }

    return this.prisma.quiz.delete({ where: { id } });
  }

  async getAttempts(quizId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async startAttempt(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        attempts: {
          where: { userId },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.status !== QuizStatus.PUBLISHED) {
      throw new BadRequestException('This quiz is not available');
    }

    const now = new Date();
    const openDate = new Date(quiz.openDate);
    const closeDate = new Date(quiz.closeDate);

    if (now < openDate) {
      throw new BadRequestException(
        `This quiz will open on ${openDate.toLocaleString()}`,
      );
    }

    if (now > closeDate) {
      throw new BadRequestException(
        `This quiz closed on ${closeDate.toLocaleString()}`,
      );
    }

    if (quiz.attempts.length > 0) {
      throw new BadRequestException(
        'You have already started this quiz. Only one attempt is allowed.',
      );
    }

    const hasAccess = await this.checkStudentAccess(userId, quizId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this quiz. Please contact your instructor.',
      );
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        startedAt: now,
      },
    });

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      userId: attempt.userId,
      startedAt: attempt.startedAt,
    };
  }

  async checkStudentAccess(userId: string, quizId: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      this.logger.warn(
        `Student access check failed for user ${userId}, quiz ${quizId}: ${error.message}`,
      );
      return true;
    }
  }

  async getCurrentAttempt(quizId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId,
        completedAt: null,
      },
      include: {
        quiz: {
          select: {
            duration: true,
            title: true,
            passScore: true,
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    const elapsedSeconds = Math.floor(
      (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000,
    );
    const totalSeconds = attempt.quiz.duration * 60;
    const timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      userId: attempt.userId,
      startedAt: attempt.startedAt,
      timeRemaining,
      totalDuration: attempt.quiz.duration,
      isCompleted: false,
    };
  }

  async submitAttempt(
    attemptId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ): Promise<any> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        completedAt: null,
      },
      include: {
        quiz: {
          select: {
            duration: true,
            passScore: true,
            title: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Active attempt not found');
    }

    const elapsedSeconds = Math.floor(
      (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000,
    );
    const totalSeconds = attempt.quiz.duration * 60;

    if (elapsedSeconds > totalSeconds) {
      this.logger.warn(
        `Attempt ${attemptId} for user ${userId} expired. Elapsed: ${elapsedSeconds}s, Limit: ${totalSeconds}s`,
      );
    }

    const finalScore = dto.score || 0;

    const completedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        score: finalScore,
      },
      include: {
        quiz: {
          select: {
            title: true,
            passScore: true,
          },
        },
      },
    });

    const passed = finalScore >= (completedAttempt.quiz.passScore || 0);

    if (dto.tabActivity) {
      this.logger.log(
        `📊 Quiz ${attempt.quizId} - User ${userId}: ${dto.tabActivity.totalLeaves} tab leaves, ${dto.tabActivity.totalLeaveDuration}ms total`,
      );
    }

    return {
      id: completedAttempt.id,
      quizId: completedAttempt.quizId,
      userId: completedAttempt.userId,
      startedAt: completedAttempt.startedAt,
      completedAt: completedAttempt.completedAt,
      score: completedAttempt.score,
      passed,
      passScore: completedAttempt.quiz.passScore || 0,
      title: completedAttempt.quiz.title,
    };
  }
}
