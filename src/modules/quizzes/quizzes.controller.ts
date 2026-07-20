import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Request() req, @Body() dto: CreateQuizDto) {
    return this.quizzesService.create(req.user.userId, dto);
  }

  @Get()
  @Roles('ADMIN', 'USER')
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.quizzesService.delete(id);
  }

  @Get(':id/attempts')
  @Roles('ADMIN')
  getAttempts(@Param('id') id: string) {
    return this.quizzesService.getAttempts(id);
  }

  @Post(':id/start')
  @Roles('USER')
  @HttpCode(HttpStatus.OK)
  startAttempt(@Param('id') quizId: string, @Request() req) {
    console.log('🔑 Starting attempt for user:', req.user);
    return this.quizzesService.startAttempt(quizId, req.user.userId);
  }

  @Get(':id/current-attempt')
  @Roles('USER')
  getCurrentAttempt(@Param('id') quizId: string, @Request() req) {
    return this.quizzesService.getCurrentAttempt(quizId, req.user.userId);
  }

  @Post('attempts/:attemptId/submit')
  @Roles('USER')
  @HttpCode(HttpStatus.OK)
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @Request() req,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizzesService.submitAttempt(attemptId, req.user.userId, dto);
  }
}
