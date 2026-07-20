import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentQuizzesService } from './student-quizzes.service';
import { CreateStudentQuizzDto } from './dto/create-student-quizz.dto';
import { UpdateStudentQuizzDto } from './dto/update-student-quizz.dto';

@Controller('student-quizzes')
export class StudentQuizzesController {
  constructor(private readonly studentQuizzesService: StudentQuizzesService) {}

  @Post()
  create(@Body() createStudentQuizzDto: CreateStudentQuizzDto) {
    return this.studentQuizzesService.create(createStudentQuizzDto);
  }

  @Get()
  findAll() {
    return this.studentQuizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentQuizzesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentQuizzDto: UpdateStudentQuizzDto) {
    return this.studentQuizzesService.update(+id, updateStudentQuizzDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentQuizzesService.remove(+id);
  }
}
