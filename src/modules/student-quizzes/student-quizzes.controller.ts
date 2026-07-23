// src/modules/student-quizzes/student-quizzes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StudentQuizzesService } from './student-quizzes.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('student-quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentQuizzesController {
  constructor(private readonly studentQuizzesService: StudentQuizzesService) {}

  @Get('dashboard')
  @Roles('USER')
  async getDashboard(@Request() req) {
    return this.studentQuizzesService.getStudentDashboard(req.user.userId);
  }

  @Post(':quizId/enroll')
  @Roles('USER')
  async enroll(@Param('quizId') quizId: string, @Request() req) {
    return this.studentQuizzesService.enrollStudent(req.user.userId, quizId);
  }

  @Get(':quizId/attempt')
  @Roles('USER')
  async getAttempt(@Param('quizId') quizId: string, @Request() req) {
    return this.studentQuizzesService.getAttempt(req.user.userId, quizId);
  }
}
