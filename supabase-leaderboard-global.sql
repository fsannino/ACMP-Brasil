-- ============================================
-- ACMP Brasil — Leaderboard Global (Fase B)
-- Ranking ponderado entre jogos (quiz-cm, linha-do-tempo,
-- change-manager-simulator). ACMP Quest mantém ranking próprio.
-- Idempotente — pode rodar múltiplas vezes no SQL Editor.
-- Pré-requisito: supabase-leaderboard.sql (Fase A) já aplicado.
-- ============================================

-- 1. Tabela de pesos por jogo (admin pode ajustar via UPDATE)
CREATE TABLE IF NOT EXISTS game_weights (
    game_id     TEXT PRIMARY KEY,
    weight      NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO game_weights (game_id, weight) VALUES
    ('quiz-cm',                  1.0),
    ('linha-do-tempo',            1.5),
    ('change-manager-simulator',  2.0)
ON CONFLICT (game_id) DO NOTHING;

-- 2. RLS: leitura pública (precisa para a view); escrita só admin
ALTER TABLE game_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads weights"   ON game_weights;
DROP POLICY IF EXISTS "Admins manage weights"  ON game_weights;

CREATE POLICY "Anyone reads weights" ON game_weights
    FOR SELECT USING (true);

CREATE POLICY "Admins manage weights" ON game_weights
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. View do leaderboard global (ranking ponderado)
-- Para cada (jogo, jogador), pega o melhor score (DISTINCT ON).
-- Em seguida agrega por jogador: soma ponderada + nº de jogos disputados.
CREATE OR REPLACE VIEW global_leaderboard AS
WITH best_scores AS (
    SELECT DISTINCT ON (game_id, player_email)
        game_id,
        player_email,
        player_name,
        is_member,
        score,
        created_at
    FROM game_scores
    WHERE player_email IS NOT NULL AND player_name IS NOT NULL
    ORDER BY game_id, player_email, score DESC, created_at DESC
)
SELECT
    bs.player_email,
    MAX(bs.player_name)                                                    AS player_name,
    bool_or(bs.is_member)                                                  AS is_member,
    ROUND(SUM(bs.score * COALESCE(gw.weight, 1.0)))::INTEGER               AS weighted_score,
    COUNT(DISTINCT bs.game_id)                                             AS games_played,
    MAX(bs.created_at)                                                     AS last_played_at
FROM best_scores bs
LEFT JOIN game_weights gw ON gw.game_id = bs.game_id
GROUP BY bs.player_email
ORDER BY weighted_score DESC;
