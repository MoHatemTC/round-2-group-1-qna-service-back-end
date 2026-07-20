import { Injectable, NotFoundException } from '@nestjs/common';
import { Attempt, AttemptStatus, StudentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  StudentQuizDashboardDto,
  StudentQuizDashboardDtoItem,
  StudentQuizState,
} from './dto/student-quiz-dashboard.dto';

@Injectable()
export class StudentQuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(studentId: string): Promise<StudentQuizDashboardDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        quiz: { status: 'PUBLISHED' },
      },
      include: { quiz: true },
    });

    const attempts = await this.prisma.attempt.findMany({
      where: { studentId },
    });

    const attemptByQuizId = new Map(
      attempts.map((attempt) => [attempt.quizId, attempt]),
    );

    const now = new Date();

    const quizzes: StudentQuizDashboardDtoItem[] = enrollments.map(
      (enrollment) => {
        const { quiz } = enrollment;
        const attempt = attemptByQuizId.get(quiz.id);
        const studentState = this.deriveStudentState(
          attempt,
          quiz.closesAt,
          now,
        );
        const { canStart, blockedReason } = this.resolveAccess(
          student.status,
          studentState,
          quiz.closesAt,
        );

        return {
          quizId: quiz.id,
          title: quiz.title,
          description: quiz.description ?? '',
          closesAt: quiz.closesAt.toISOString(),
          studentState,
          score: attempt?.score ? Number(attempt.score) : null,
          canStart,
          blockedReason,
        };
      },
    );

    return { quizzes };
  }

  private deriveStudentState(
    attempt: Attempt | undefined,
    closeDate: Date,
    now: Date,
  ): StudentQuizState {
    if (
      attempt?.status === AttemptStatus.SUBMITTED ||
      attempt?.status === AttemptStatus.AUTO_SUBMITTED
    ) {
      return 'Submitted';
    }

    if (now > closeDate) {
      return 'Closed';
    }

    if (attempt?.status === AttemptStatus.IN_PROGRESS) {
      return 'In progress';
    }

    return 'Not started';
  }

  private resolveAccess(
    studentStatus: StudentStatus,
    studentState: StudentQuizState,
    closeDate: Date,
  ): { canStart: boolean; blockedReason?: string } {
    if (studentStatus === StudentStatus.UNVERIFIED) {
      return {
        canStart: false,
        blockedReason: 'Verify your email before starting this quiz.',
      };
    }

    if (studentState === 'Closed') {
      return {
        canStart: false,
        blockedReason: `This quiz closed on ${closeDate.toISOString()}.`,
      };
    }

    if (studentState === 'Submitted') {
      return {
        canStart: false,
        blockedReason: 'You have already submitted this quiz.',
      };
    }

    return { canStart: true };
  }
}
