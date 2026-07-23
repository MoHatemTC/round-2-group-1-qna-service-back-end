// src/modules/student-quizzes/student-quizzes.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class StudentQuizzesService {
  private readonly logger = new Logger(StudentQuizzesService.name);

  constructor(private prisma: PrismaService) {}

  async getStudentDashboard(studentId: string) {
    try {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        include: {
          quizAttempts: {
            include: {
              quiz: true,
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      return {
        student,
        attempts: student.quizAttempts,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard: ${error.message}`);
      throw error;
    }
  }

  async enrollStudent(studentId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // ✅ محاكاة التسجيل (بدون جدول Enrollment)
    this.logger.log(`Student ${studentId} enrolled in quiz ${quizId}`);
    return { success: true, message: 'Enrolled successfully' };
  }

  async getAttempt(studentId: string, quizId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId: studentId,
        quizId: quizId,
      },
      include: {
        quiz: true,
      },
    });

    if (!attempt) {
      return { hasAttempt: false };
    }

    return {
      hasAttempt: true,
      attempt,
    };
  }
}
