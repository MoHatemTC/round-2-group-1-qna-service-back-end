import { Module } from '@nestjs/common';
import { StudentQuizzesService } from './student-quizzes.service';
import { StudentQuizzesController } from './student-quizzes.controller';

@Module({
  controllers: [StudentQuizzesController],
  providers: [StudentQuizzesService],
})
export class StudentQuizzesModule {}
