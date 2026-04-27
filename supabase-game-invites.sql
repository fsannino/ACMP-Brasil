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
