
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'OPEN_ENDED');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'MCQ';

-- Rename close column (keeps data)
ALTER TABLE "Quiz" RENAME COLUMN "closesAt" TO "close_at";

-- AlterTable
ALTER TABLE "Quiz" 
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "open_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pass_score" DECIMAL(5,2);


