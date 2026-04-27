-- ============================================
-- ACMP Brasil — Leaderboard por jogo (Fase A)
-- Tabela isolada de scores + view com melhor pontuação por jogador.
-- Idempotente — pode rodar múltiplas vezes no SQL Editor do Supabase.
-- ============================================

-- 1. Tabela de pontuações (1 linha por partida finalizada)
CREATE TABLE IF NOT EXISTS game_scores (
    id            BIGSERIAL PRIMARY KEY,
    player_email  TEXT,
    player_name   TEXT,
    is_member     BOOLEAN NOT NULL DEFAULT FALSE,
    user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    game_id       TEXT NOT NULL CHECK (game_id IN ('quiz-cm','acmp-quest','linha-do-tempo','change-manager-simulator')),
    score         INTEGER NOT NULL,
    score_data    JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_score ON game_scores (game_id, score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_player    ON game_scores (player_email, game_id);

-- 2. RLS: insert e read são abertos (precisa para gating client-side e leaderboard público)
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone insert score" ON game_scores;
DROP POLICY IF EXISTS "Anyone read score"   ON game_scores;

CREATE POLICY "Anyone insert score" ON game_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone read score" ON game_scores
    FOR SELECT USING (true);

-- 3. View: melhor pontuação de cada jogador em cada jogo
-- DISTINCT ON garante 1 linha por (game_id, player_email) escolhendo o maior score.
CREATE OR REPLACE VIEW game_leaderboard AS
SELECT DISTINCT ON (game_id, player_email)
    game_id,
    player_name,
    player_email,
    is_member,
    score,
    score_data,
    created_at AS achieved_at
FROM game_scores
WHERE player_email IS NOT NULL AND player_name IS NOT NULL
ORDER BY game_id, player_email, score DESC, created_at DESC;
