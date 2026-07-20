export type StudentQuizState =
  | 'Not started'
  | 'In progress'
  | 'Submitted'
  | 'Closed';

export class StudentQuizDashboardDtoItem {
  quizId!: string;
  title!: string;
  description!: string;
  closesAt!: string;
  studentState!: StudentQuizState;
  score!: number | null;
  canStart!: boolean;
  blockedReason?: string;
}

export class StudentQuizDashboardDto {
  quizzes!: StudentQuizDashboardDtoItem[];
}
