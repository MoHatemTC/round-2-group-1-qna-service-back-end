export type StudentQuizState = "Not started" | "In progress" | "Submitted" | "Closed";

export class StudentQuizDashboardDtoItem {
    quizId: string;
    title: string;
    description: string;
    closesAt: String;
    studentState: StudentQuizState;
    score: number;
    canStart: boolean;
}

export class StudentQuizDashboardDto {
    quizzes: StudentQuizDashboardDtoItem[];
}
