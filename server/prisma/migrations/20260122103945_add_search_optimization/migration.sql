-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indices for faster ILIKE search
CREATE INDEX IF NOT EXISTS idx_repo_fullname_trgm ON "Repo" USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_repo_description_trgm ON "Repo" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_repo_summary_trgm ON "Repo" USING GIN ("summary" gin_trgm_ops);
