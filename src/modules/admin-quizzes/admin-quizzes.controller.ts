import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminQuizzesService } from './admin-quizzes.service';
import { CreateAdminQuizzDto } from './dto/create-admin-quizz.dto';
import { UpdateAdminQuizzDto } from './dto/update-admin-quizz.dto';

@Controller('admin-quizzes')
export class AdminQuizzesController {
  constructor(private readonly adminQuizzesService: AdminQuizzesService) {}

  @Post()
  create(@Body() createAdminQuizzDto: CreateAdminQuizzDto) {
    return this.adminQuizzesService.create(createAdminQuizzDto);
  }

  @Get()
  findAll() {
    return this.adminQuizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminQuizzesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminQuizzDto: UpdateAdminQuizzDto) {
    return this.adminQuizzesService.update(+id, updateAdminQuizzDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminQuizzesService.remove(+id);
  }
}
