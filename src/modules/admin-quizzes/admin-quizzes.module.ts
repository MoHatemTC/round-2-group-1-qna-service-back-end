import { Module } from '@nestjs/common';
import { AdminQuizzesService } from './admin-quizzes.service';
import { AdminQuizzesController } from './admin-quizzes.controller';

@Module({
  controllers: [AdminQuizzesController],
  providers: [AdminQuizzesService],
})
export class AdminQuizzesModule {}
