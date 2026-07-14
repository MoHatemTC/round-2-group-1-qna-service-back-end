-- prisma/migrations/20250101000000_init_pgvector/migration.sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables
CREATE TABLE IF NOT EXISTS "documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "cohort" VARCHAR(100),
    "metadata" JSONB,
    "content" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_source_title_key" UNIQUE ("source", "title")
);

CREATE TABLE IF NOT EXISTS "chunks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL UNIQUE,
    "embedding" JSONB,
    "embeddingVector" vector(1536),
    "chunkIndex" INTEGER DEFAULT 0,
    "metadata" JSONB,
    CONSTRAINT "chunks_documentId_chunkIndex_key" UNIQUE ("documentId", "chunkIndex")
);

CREATE INDEX idx_chunks_content_hash ON "chunks"("contentHash");
CREATE INDEX idx_chunks_document_id ON "chunks"("documentId");
CREATE INDEX idx_chunks_embedding_vector ON "chunks" USING ivfflat ("embeddingVector" vector_cosine_ops);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION similarity_search(
    query_vector vector(1536),
    similarity_threshold float,
    max_results int
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    document_id UUID,
    title TEXT,
    source TEXT,
    source_type TEXT,
    cohort VARCHAR(100),
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c."documentId",
        d.title,
        d.source,
        d."sourceType",
        d.cohort,
        1 - (c."embeddingVector" <=> query_vector) as similarity
    FROM chunks c
    JOIN documents d ON c."documentId" = d.id
    WHERE c."embeddingVector" IS NOT NULL
        AND (1 - (c."embeddingVector" <=> query_vector)) >= similarity_threshold
    ORDER BY c."embeddingVector" <=> query_vector
    LIMIT max_results;
END;
$$;