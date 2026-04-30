-- ============================================
-- ACMP Brasil - Form Submissions (Inbox)
-- Captura de TODOS os formulários do portal
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Tabela única de submissões de formulários
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Identificação do formulário
    form_type TEXT NOT NULL,           -- ex: newsletter, exit_popup, voluntario, parceiro, branch, evento, contato, login_signup
    form_label TEXT,                   -- rótulo legível (ex: "Voluntário - PUC-SP")
    subject TEXT,                      -- _subject usado no Formspree

    -- Dados pessoais (campos comuns)
    name TEXT,
    email TEXT,
    phone TEXT,
    organization TEXT,
    linkedin TEXT,
    city_state TEXT,
    message TEXT,

    -- Demais campos do formulário, sem perda de informação
    extra_data JSONB DEFAULT '{}'::jsonb,

    -- Origem / contexto da navegação
    source_page TEXT,                  -- title da página
    source_path TEXT,                  -- pathname (/pages/voluntarios.html)
    source_url TEXT,                   -- URL completa
    referrer TEXT,                     -- document.referrer
    user_agent TEXT,
    ip_address INET,                   -- preenchido por trigger se possível

    -- Workflow no painel admin
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'read', 'replied', 'archived')),
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    admin_notes TEXT,

    -- Anti-spam (honeypot detectado)
    is_spam BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status     ON form_submissions (status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type  ON form_submissions (form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email      ON form_submissions (email);

-- 2. Trigger para manter updated_at
CREATE OR REPLACE FUNCTION trg_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS form_submissions_updated_at ON form_submissions;
CREATE TRIGGER form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION trg_form_submissions_updated_at();

-- 3. RLS: visitantes anônimos só podem INSERIR; só admin/moderator lê e gerencia.
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS form_submissions_insert_anon ON form_submissions;
CREATE POLICY form_submissions_insert_anon
    ON form_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS form_submissions_select_admin ON form_submissions;
CREATE POLICY form_submissions_select_admin
    ON form_submissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM member_profiles
            WHERE member_profiles.id = auth.uid()
              AND member_profiles.role IN ('admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS form_submissions_update_admin ON form_submissions;
CREATE POLICY form_submissions_update_admin
    ON form_submissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM member_profiles
            WHERE member_profiles.id = auth.uid()
              AND member_profiles.role IN ('admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS form_submissions_delete_admin ON form_submissions;
CREATE POLICY form_submissions_delete_admin
    ON form_submissions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM member_profiles
            WHERE member_profiles.id = auth.uid()
              AND member_profiles.role = 'admin'
        )
    );

-- 4. View auxiliar: contagem por status (para dashboard)
CREATE OR REPLACE VIEW form_submissions_stats AS
SELECT
    status,
    COUNT(*) AS total
FROM form_submissions
WHERE is_spam = FALSE
GROUP BY status;
