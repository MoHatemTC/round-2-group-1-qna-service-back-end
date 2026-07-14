/*
  Warnings:

  - Made the column `chunkIndex` on table `chunks` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `sourceType` on the `documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `created_at` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `documents` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('FAQ', 'ONBOARDING', 'SCHEDULE', 'PROGRAM_DOC', 'OTHER');

-- DropForeignKey
ALTER TABLE "chunks" DROP CONSTRAINT "chunks_documentId_fkey";

-- DropIndex
DROP INDEX "idx_chunks_embedding_vector";

-- AlterTable
ALTER TABLE "chunks" ALTER COLUMN "chunkIndex" SET NOT NULL;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" "SourceType" NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "extensions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extensions_name_key" ON "extensions"("name");

-- AddForeignKey
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_chunks_content_hash" RENAME TO "chunks_contentHash_idx";

-- RenameIndex
ALTER INDEX "idx_chunks_document_id" RENAME TO "chunks_documentId_idx";
