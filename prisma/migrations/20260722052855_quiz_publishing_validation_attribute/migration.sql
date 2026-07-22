-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "points" DECIMAL(7,2) NOT NULL DEFAULT 1;
