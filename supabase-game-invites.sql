-- ============================================
-- ACMP Brasil — Convites entre jogadores
-- Registra cada convite enviado para anti-abuso (rate limit)
-- e analytics futuros (taxa de conversão).
-- Idempotente.
-- ============================================

CREATE TABLE IF NOT EXISTS game_invites (
    id              BIGSERIAL PRIMARY KEY,
    inviter_email   TEXT NOT NULL,
    inviter_name    TEXT,
    invitee_email   TEXT NOT NULL,
    game_id         TEXT,
    message         TEXT,
    ip_hash         TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_invites_inviter   ON game_invites (inviter_email, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_invites_iphash    ON game_invites (ip_hash, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_invites_invitee   ON game_invites (invitee_email, sent_at DESC);

-- RLS
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

-- INSERT só pela Edge Function (que usa service role, bypass RLS).
-- Não criar policy de INSERT pública: previne spam direto pela API anon.
DROP POLICY IF EXISTS "Anyone insert invite" ON game_invites;

-- Apenas admins leem (analytics)
DROP POLICY IF EXISTS "Admins read invites" ON game_invites;
CREATE POLICY "Admins read invites" ON game_invites
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM member_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Helper: check if a user has played at least once (usado pela Edge Function)
-- Não é necessário criar uma RPC, a Edge Function faz query direta.

-- ============================================
-- VIEWS DE CONVERSÃO (analytics)
-- ============================================

-- Por convidador: total enviado, aceito, taxa de conversão.
CREATE OR REPLACE VIEW invite_conversions_by_inviter AS
SELECT
    inviter_email,
    MAX(inviter_name)                                           AS inviter_name,
    COUNT(*)                                                    AS total_sent,
    COUNT(accepted_at)                                          AS total_accepted,
    ROUND(100.0 * COUNT(accepted_at) / NULLIF(COUNT(*), 0), 1)  AS conversion_rate_pct,
    MIN(sent_at)                                                AS first_sent_at,
    MAX(sent_at)                                                AS last_sent_at
FROM game_invites
GROUP BY inviter_email
ORDER BY total_sent DESC, total_accepted DESC;

-- Por jogo: quais jogos geram mais convites e qual converte mais.
CREATE OR REPLACE VIEW invite_conversions_by_game AS
SELECT
    COALESCE(game_id, '(catálogo)')                             AS game_id,
    COUNT(*)                                                    AS total_sent,
    COUNT(accepted_at)                                          AS total_accepted,
    ROUND(100.0 * COUNT(accepted_at) / NULLIF(COUNT(*), 0), 1)  AS conversion_rate_pct
FROM game_invites
GROUP BY COALESCE(game_id, '(catálogo)')
ORDER BY total_sent DESC;

-- Resumo geral: 1 linha com os números agregados.
CREATE OR REPLACE VIEW invite_conversions_summary AS
SELECT
    COUNT(*)                                                    AS total_sent,
    COUNT(accepted_at)                                          AS total_accepted,
    COUNT(DISTINCT inviter_email)                               AS unique_inviters,
    COUNT(DISTINCT invitee_email)                               AS unique_invitees,
    ROUND(100.0 * COUNT(accepted_at) / NULLIF(COUNT(*), 0), 1)  AS conversion_rate_pct,
    MIN(sent_at)                                                AS first_sent_at,
    MAX(sent_at)                                                AS last_sent_at,
    AVG(EXTRACT(EPOCH FROM (accepted_at - sent_at)))            AS avg_seconds_to_accept
FROM game_invites;
