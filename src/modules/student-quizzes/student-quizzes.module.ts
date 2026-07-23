// src/modules/student-quizzes/student-quizzes.module.ts
import { Module } from '@nestjs/common';
import { StudentQuizzesService } from './student-quizzes.service.js';
import { StudentQuizzesController } from './student-quizzes.controller.js';

@Module({
  providers: [StudentQuizzesService],
  controllers: [StudentQuizzesController],
  exports: [StudentQuizzesService],
})
export class StudentQuizzesModule {}
