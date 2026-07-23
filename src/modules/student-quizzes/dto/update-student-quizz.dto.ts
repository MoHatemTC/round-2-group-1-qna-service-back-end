import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentQuizzDto } from './create-student-quizz.dto';

export class UpdateStudentQuizzDto extends PartialType(CreateStudentQuizzDto) {}
