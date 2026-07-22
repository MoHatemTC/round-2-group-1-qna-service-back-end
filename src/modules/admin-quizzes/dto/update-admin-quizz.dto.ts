import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminQuizzDto } from './create-admin-quizz.dto';

export class UpdateAdminQuizzDto extends PartialType(CreateAdminQuizzDto) {}
