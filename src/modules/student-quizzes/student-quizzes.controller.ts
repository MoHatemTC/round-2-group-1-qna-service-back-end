import {
  BadRequestException,
  Controller,
  Get,
  Headers,
} from '@nestjs/common';
import { StudentQuizzesService } from './student-quizzes.service';

@Controller('student/quizzes')
export class StudentQuizzesController {
  constructor(private readonly studentQuizzesService: StudentQuizzesService) {}

  @Get()
  getDashboard(@Headers('x-student-id') studentId?: string) {
    const resolvedStudentId = studentId ?? process.env.MOCK_STUDENT_ID;

    if (!resolvedStudentId) {
      throw new BadRequestException(
        'Missing student id. Send x-student-id header or set MOCK_STUDENT_ID.',
      );
    }

    return this.studentQuizzesService.getDashboard(resolvedStudentId);
  }
}
