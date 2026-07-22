import { Injectable } from '@nestjs/common';
import { CreateAdminQuizzDto } from './dto/create-admin-quizz.dto';
import { UpdateAdminQuizzDto } from './dto/update-admin-quizz.dto';

@Injectable()
export class AdminQuizzesService {
  create(createAdminQuizzDto: CreateAdminQuizzDto) {
    return 'This action adds a new adminQuizz';
  }

  findAll() {
    return `This action returns all adminQuizzes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminQuizz`;
  }

  update(id: number, updateAdminQuizzDto: UpdateAdminQuizzDto) {
    return `This action updates a #${id} adminQuizz`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminQuizz`;
  }
}
