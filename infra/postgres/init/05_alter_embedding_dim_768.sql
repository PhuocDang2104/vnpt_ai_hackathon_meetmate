-- Adjust embedding column to 768 dims for model nomic-ai/nomic-embed-text-v1.5
DO $$
BEGIN
    -- Drop vector index if exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_chunk_embedding'
    ) THEN
        EXECUTE 'DROP INDEX IF EXISTS idx_chunk_embedding';
    END IF;

    -- Alter column type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_chunk' AND column_name = 'embedding'
    ) THEN
        EXECUTE 'ALTER TABLE knowledge_chunk ALTER COLUMN embedding TYPE vector(768)';
    END IF;

    -- Recreate ivfflat index
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chunk_embedding ON knowledge_chunk USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
END$$;
