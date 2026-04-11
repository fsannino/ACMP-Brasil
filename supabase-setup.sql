-- ============================================
-- ACMP Brasil - Supabase Database Schema
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Tabela de perfis de membros
CREATE TABLE IF NOT EXISTS member_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    linkedin TEXT,
    acmp_member_id TEXT,
    ccmp_certified BOOLEAN DEFAULT FALSE,
    membership_status TEXT DEFAULT 'pending' CHECK (membership_status IN ('active', 'pending', 'expired', 'rejected')),
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'volunteer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de conteúdo exclusivo
CREATE TABLE IF NOT EXISTS exclusive_content (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'video', 'article', 'webinar', 'game', 'template', 'tool')),
    category TEXT CHECK (category IN ('standard', 'certificacao', 'webinars', 'ferramentas', 'jogos', 'artigos', 'templates')),
    file_url TEXT,
    thumbnail_url TEXT,
    external_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    access_level TEXT DEFAULT 'member' CHECK (access_level IN ('public', 'member', 'certified', 'admin')),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de log de acesso (para analytics)
CREATE TABLE IF NOT EXISTS content_access_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    content_id INTEGER REFERENCES exclusive_content(id),
    action TEXT CHECK (action IN ('view', 'download', 'play')),
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de membros importados (CSV do ACMP Global)
CREATE TABLE IF NOT EXISTS imported_members (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    acmp_member_id TEXT,
    membership_type TEXT,
    expiry_date DATE,
    ccmp_status TEXT,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT FALSE
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_members ENABLE ROW LEVEL SECURITY;

-- Membros podem ver/editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON member_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON member_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON member_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins podem gerenciar todos os perfis
CREATE POLICY "Admins can manage all profiles" ON member_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Conteúdo público é visível por todos, exclusivo apenas para membros ativos
CREATE POLICY "Public content visible to all" ON exclusive_content
    FOR SELECT USING (access_level = 'public');

CREATE POLICY "Member content for active members" ON exclusive_content
    FOR SELECT USING (
        access_level IN ('member', 'public') AND
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND membership_status = 'active')
    );

CREATE POLICY "Certified content for CCMP holders" ON exclusive_content
    FOR SELECT USING (
        access_level IN ('certified', 'member', 'public') AND
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND ccmp_certified = TRUE)
    );

CREATE POLICY "Admins can manage content" ON exclusive_content
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Log de acesso: usuários podem inserir, admins podem ver tudo
CREATE POLICY "Users can log own access" ON content_access_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON content_access_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Imported members: apenas admins
CREATE POLICY "Admins can manage imports" ON imported_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO member_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: criar perfil ao registrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Função para sincronizar membros importados
CREATE OR REPLACE FUNCTION sync_imported_members()
RETURNS INTEGER AS $$
DECLARE
    synced_count INTEGER := 0;
BEGIN
    UPDATE member_profiles mp
    SET
        membership_status = 'active',
        acmp_member_id = im.acmp_member_id,
        ccmp_certified = CASE WHEN im.ccmp_status = 'active' THEN TRUE ELSE mp.ccmp_certified END,
        expires_at = im.expiry_date,
        updated_at = NOW()
    FROM imported_members im
    WHERE mp.email = im.email AND im.is_synced = FALSE;

    GET DIAGNOSTICS synced_count = ROW_COUNT;

    UPDATE imported_members SET is_synced = TRUE WHERE is_synced = FALSE;

    RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (conteúdo de exemplo)
-- ============================================

INSERT INTO exclusive_content (title, description, content_type, category, access_level, is_featured) VALUES
('ACMP Standard - Resumo em Português', 'Resumo traduzido dos principais pontos do Standard for Change Management', 'pdf', 'standard', 'member', TRUE),
('Webinar: Gestão de Mudanças na Era da IA', 'Gravação do webinar sobre impacto da IA na prática de CM', 'webinar', 'webinars', 'member', TRUE),
('Template: Plano de Gestão de Mudanças', 'Modelo editável de plano de CM baseado no ACMP Standard', 'template', 'templates', 'member', FALSE),
('Template: Análise de Stakeholders', 'Planilha para mapeamento e análise de partes interessadas', 'template', 'templates', 'member', FALSE),
('Template: Avaliação de Prontidão para Mudança', 'Questionário de change readiness assessment', 'template', 'templates', 'member', FALSE),
('Guia de Preparação para o CCMP', 'Material exclusivo de preparação para o exame de certificação', 'pdf', 'certificacao', 'member', TRUE),
('Quiz: Teste seus conhecimentos em CM', 'Jogo de perguntas e respostas sobre Gestão de Mudanças', 'game', 'jogos', 'member', TRUE),
('Simulado CCMP - 50 questões', 'Simulado com questões no estilo do exame CCMP', 'game', 'jogos', 'certified', FALSE),
('Artigo: Melhores práticas de comunicação em mudanças', 'Estratégias comprovadas de comunicação para projetos de transformação', 'article', 'artigos', 'member', FALSE),
('Vídeo: Como vender Gestão de Mudanças para a liderança', 'Técnicas para conseguir buy-in executivo', 'video', 'webinars', 'member', FALSE);
