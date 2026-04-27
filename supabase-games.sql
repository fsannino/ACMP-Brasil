-- ============================================
-- ACMP Brasil — Jogos: identificação, feedback e
-- liberação por categoria de público.
-- Aplica para Quiz CM, ACMP Quest, Linha do Tempo
-- e Change Manager Simulator.
-- Execute no SQL Editor do Supabase (idempotente).
-- ============================================

-- 1. Cadastro de jogadores (1 linha por e-mail; upsert)
CREATE TABLE IF NOT EXISTS game_players (
    email           TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    is_member       BOOLEAN NOT NULL DEFAULT FALSE,
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_seen_at   TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
    games_played    JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_game_players_member ON game_players (is_member);
CREATE INDEX IF NOT EXISTS idx_game_players_last ON game_players (last_seen_at DESC);

-- 2. Feedback enviado ao final de cada jogo
CREATE TABLE IF NOT EXISTS game_feedback (
    id            BIGSERIAL PRIMARY KEY,
    player_email  TEXT,
    player_name   TEXT,
    is_member     BOOLEAN,
    user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    game_id       TEXT NOT NULL CHECK (game_id IN ('quiz-cm','acmp-quest','linha-do-tempo','change-manager-simulator')),
    rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
    suggestion    TEXT,
    score_data    JSONB,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Atualiza CHECK pré-existente, se necessário (idempotente)
ALTER TABLE game_feedback DROP CONSTRAINT IF EXISTS game_feedback_game_id_check;
ALTER TABLE game_feedback ADD CONSTRAINT game_feedback_game_id_check
    CHECK (game_id IN ('quiz-cm','acmp-quest','linha-do-tempo','change-manager-simulator'));

-- 3. Liberação de jogos por categoria de público (admin controla)
--    Cada flag indica se a audiência tem permissão de visualizar/jogar.
CREATE TABLE IF NOT EXISTS game_access_settings (
    game_id            TEXT PRIMARY KEY
                       CHECK (game_id IN ('quiz-cm','acmp-quest','linha-do-tempo','change-manager-simulator')),
    public_enabled     BOOLEAN NOT NULL DEFAULT TRUE,   -- visitante anônimo
    community_enabled  BOOLEAN NOT NULL DEFAULT TRUE,   -- identificado (nome+e-mail) ou cadastrado não-associado
    member_enabled     BOOLEAN NOT NULL DEFAULT TRUE,   -- associado ACMP ativo
    volunteer_enabled  BOOLEAN NOT NULL DEFAULT TRUE,   -- voluntário (role=volunteer)
    certified_enabled  BOOLEAN NOT NULL DEFAULT TRUE,   -- CCMP certificado
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Pré-popula com tudo liberado (idempotente)
INSERT INTO game_access_settings (game_id) VALUES
    ('quiz-cm'),
    ('acmp-quest'),
    ('linha-do-tempo'),
    ('change-manager-simulator')
ON CONFLICT (game_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_game_feedback_game ON game_feedback (game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_feedback_rating ON game_feedback (rating);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE game_players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_access_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can register / update their own row (anon insert via apikey)
DROP POLICY IF EXISTS "Anyone insert player"  ON game_players;
DROP POLICY IF EXISTS "Anyone update player"  ON game_players;
DROP POLICY IF EXISTS "Admins read players"   ON game_players;

CREATE POLICY "Anyone insert player" ON game_players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone update player" ON game_players
    FOR UPDATE USING (true);

CREATE POLICY "Admins read players" ON game_players
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Anyone can submit feedback; only admins read aggregated
DROP POLICY IF EXISTS "Anyone insert feedback" ON game_feedback;
DROP POLICY IF EXISTS "Admins read feedback"   ON game_feedback;

CREATE POLICY "Anyone insert feedback" ON game_feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins read feedback" ON game_feedback
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- game_access_settings: leitura pública (frontend filtra cards),
-- escrita apenas por admins.
DROP POLICY IF EXISTS "Anyone read game access"   ON game_access_settings;
DROP POLICY IF EXISTS "Admins write game access"  ON game_access_settings;

CREATE POLICY "Anyone read game access" ON game_access_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins write game access" ON game_access_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- VIEW agregada para painel admin (NPS-style)
-- ============================================

CREATE OR REPLACE VIEW game_feedback_summary AS
SELECT
    game_id,
    COUNT(*) AS total_responses,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating,
    SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive,
    SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS negative,
    COUNT(*) FILTER (WHERE suggestion IS NOT NULL AND length(trim(suggestion)) > 0) AS with_suggestion,
    MAX(created_at) AS last_feedback_at
FROM game_feedback
GROUP BY game_id;
