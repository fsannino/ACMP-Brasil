-- ============================================
-- ACMP Brasil - Careers / Jobs Schema
-- Execute APÓS o supabase-setup.sql principal
-- ============================================

-- Tabela de vagas
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    description TEXT,
    job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
    source TEXT NOT NULL CHECK (source IN ('acmp-global', 'linkedin', 'manual')),
    source_url TEXT,
    source_id TEXT,
    salary_range TEXT,
    is_remote BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscas e limpeza
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_expires ON jobs(expires_at);
CREATE INDEX idx_jobs_source_id ON jobs(source, source_id);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Todos podem ver vagas (público)
CREATE POLICY "Jobs are public" ON jobs
    FOR SELECT USING (true);

-- Admins podem gerenciar vagas
CREATE POLICY "Admins can manage jobs" ON jobs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Service role pode inserir (usado pelo scraper via GitHub Actions)
CREATE POLICY "Service can insert jobs" ON jobs
    FOR INSERT WITH CHECK (true);

-- Função para limpar vagas expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM jobs WHERE expires_at < NOW() AND source != 'manual';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para evitar duplicatas no scraping
CREATE OR REPLACE FUNCTION upsert_scraped_job(
    p_title TEXT,
    p_company TEXT,
    p_location TEXT,
    p_description TEXT,
    p_job_type TEXT,
    p_source TEXT,
    p_source_url TEXT,
    p_source_id TEXT,
    p_is_remote BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO jobs (title, company, location, description, job_type, source, source_url, source_id, is_remote, posted_at, expires_at)
    VALUES (p_title, p_company, p_location, p_description, p_job_type, p_source, p_source_url, p_source_id, p_is_remote, NOW(), NOW() + INTERVAL '60 days')
    ON CONFLICT (source, source_id) DO UPDATE SET
        title = EXCLUDED.title,
        company = EXCLUDED.company,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        expires_at = NOW() + INTERVAL '60 days';
EXCEPTION WHEN unique_violation THEN
    -- Ignore duplicates
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Constraint única para evitar duplicatas
ALTER TABLE jobs ADD CONSTRAINT jobs_source_unique UNIQUE (source, source_id);
