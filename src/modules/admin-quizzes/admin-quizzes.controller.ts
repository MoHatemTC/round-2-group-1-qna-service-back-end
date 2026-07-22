import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminQuizzesService } from './admin-quizzes.service';
import {
  AdminQuizDto,
  PublishQuizResponseDto,
} from './dto/admin-quiz.dto';
import { UpdateAdminQuizDto } from './dto/update-admin-quiz.dto';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin/quizzes')
@UseGuards(AdminGuard)
export class AdminQuizzesController {
  constructor(private readonly adminQuizzesService: AdminQuizzesService) {}

  @Get(':id')
  getQuiz(@Param('id') id: string): Promise<AdminQuizDto> {
    return this.adminQuizzesService.getQuizForAdmin(id);
  }

  /** Must be declared before PATCH :id so "publish" is not treated as an id. */
  @Patch(':id/publish')
  publishQuiz(@Param('id') id: string): Promise<PublishQuizResponseDto> {
    return this.adminQuizzesService.publishQuiz(id);
  }

  @Patch(':id')
  updateQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateAdminQuizDto,
  ): Promise<AdminQuizDto> {
    return this.adminQuizzesService.updateQuiz(id, dto);
  }
}
