export class StudentQuizResponseDto {
    id: string;
    quizId: string;
    studentId: string;
    quizResponse?: string;
    createdAt: Date;
    updatedAt: Date;
}