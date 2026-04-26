-- ============================================
-- ACMP Brasil - ACMP Quest (Quiz Gamificado)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Progresso agregado do jogador (1 linha por usuário)
CREATE TABLE IF NOT EXISTS quiz_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Agente',
    xp INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Histórico de partidas (uma linha por partida concluída)
CREATE TABLE IF NOT EXISTS quiz_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('sprint','lightning','connect','boss')),
    difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
    score INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    grade TEXT,
    played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_scores_score ON quiz_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user ON quiz_scores (user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_mode ON quiz_scores (mode, score DESC);

-- ============================================
-- VIEW pública para leaderboard global
-- (expõe apenas display_name + score + mode + data, sem e-mail)
-- ============================================

CREATE OR REPLACE VIEW quiz_leaderboard AS
SELECT
    id,
    display_name,
    mode,
    difficulty,
    score,
    correct,
    total_questions,
    max_streak,
    grade,
    played_at
FROM quiz_scores
ORDER BY score DESC
LIMIT 100;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores   ENABLE ROW LEVEL SECURITY;

-- quiz_progress: cada usuário lê/edita o próprio
DROP POLICY IF EXISTS "Users read own progress"   ON quiz_progress;
DROP POLICY IF EXISTS "Users insert own progress" ON quiz_progress;
DROP POLICY IF EXISTS "Users update own progress" ON quiz_progress;
DROP POLICY IF EXISTS "Admins manage progress"    ON quiz_progress;

CREATE POLICY "Users read own progress" ON quiz_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress" ON quiz_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" ON quiz_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage progress" ON quiz_progress
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- quiz_scores: leitura aberta (leaderboard), inserção apenas do próprio user
DROP POLICY IF EXISTS "Anyone reads scores"      ON quiz_scores;
DROP POLICY IF EXISTS "Users insert own scores"  ON quiz_scores;
DROP POLICY IF EXISTS "Admins manage scores"     ON quiz_scores;

CREATE POLICY "Anyone reads scores" ON quiz_scores
    FOR SELECT USING (true);

CREATE POLICY "Users insert own scores" ON quiz_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage scores" ON quiz_scores
    FOR ALL USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- TRIGGER: atualizar updated_at em quiz_progress
-- ============================================

CREATE OR REPLACE FUNCTION touch_quiz_progress()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_quiz_progress ON quiz_progress;
CREATE TRIGGER trg_touch_quiz_progress
    BEFORE UPDATE ON quiz_progress
    FOR EACH ROW EXECUTE FUNCTION touch_quiz_progress();

-- ============================================
-- HELPER: upsert atômico (somar XP/score, manter melhores achievements)
-- ============================================

CREATE OR REPLACE FUNCTION add_quiz_result(
    p_xp INTEGER,
    p_score INTEGER,
    p_display_name TEXT,
    p_new_achievements JSONB
) RETURNS quiz_progress AS $$
DECLARE
    result quiz_progress;
BEGIN
    INSERT INTO quiz_progress (user_id, display_name, xp, total_score, games_played, achievements)
    VALUES (auth.uid(), COALESCE(p_display_name,'Agente'), GREATEST(p_xp,0), GREATEST(p_score,0), 1, COALESCE(p_new_achievements,'[]'::jsonb))
    ON CONFLICT (user_id) DO UPDATE
        SET xp           = quiz_progress.xp + GREATEST(p_xp,0),
            total_score  = quiz_progress.total_score + GREATEST(p_score,0),
            games_played = quiz_progress.games_played + 1,
            display_name = COALESCE(p_display_name, quiz_progress.display_name),
            achievements = (
                SELECT jsonb_agg(DISTINCT v)
                FROM jsonb_array_elements_text(quiz_progress.achievements || COALESCE(p_new_achievements,'[]'::jsonb)) v
            )
    RETURNING * INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
