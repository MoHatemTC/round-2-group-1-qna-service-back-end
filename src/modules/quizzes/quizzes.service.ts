import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizStatus } from '../../common/enums/quiz-status.enum';

@Injectable()
export class QuizzesService {
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

    //  PartialType  
    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.passScore !== undefined) updateData.passScore = dto.passScore;

    // Validate dates if provided
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

    //  Handle publish helper
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
}
