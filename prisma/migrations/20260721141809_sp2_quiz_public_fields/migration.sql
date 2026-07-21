/*
  Warnings:

  - You are about to drop the column `closesAt` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the `extensions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `close_at` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'OPEN_ENDED');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'MCQ';

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "closesAt",
ADD COLUMN     "close_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "open_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pass_score" DECIMAL(5,2);

-- DropTable
DROP TABLE "extensions";
