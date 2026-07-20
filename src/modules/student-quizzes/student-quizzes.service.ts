import { Injectable } from '@nestjs/common';
import { CreateStudentQuizzDto } from './dto/create-student-quizz.dto';
import { UpdateStudentQuizzDto } from './dto/update-student-quizz.dto';

@Injectable()
export class StudentQuizzesService {
  create(createStudentQuizzDto: CreateStudentQuizzDto) {
    return 'This action adds a new studentQuizz';
  }

  findAll() {
    return `This action returns all studentQuizzes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentQuizz`;
  }

  update(id: number, updateStudentQuizzDto: UpdateStudentQuizzDto) {
    return `This action updates a #${id} studentQuizz`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentQuizz`;
  }
}
