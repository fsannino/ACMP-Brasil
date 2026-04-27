// ============================================
// ACMP Brasil — Edge Function: send-invite
// Envia e-mail de convite para um amigo via Resend.
//
// Validações (em ordem):
//   1. Payload mínimo (inviter_email, invitee_email)
//   2. Turnstile (se TURNSTILE_SECRET_KEY estiver configurado)
//   3. Rate limit: 3 convites/dia por IP (sha256 do IP)
//   4. Inviter precisa ter ≥ 1 partida em game_scores
//   5. Anti-self: inviter != invitee
//
// Secrets esperados (supabase secrets set ...):
//   - RESEND_API_KEY                (obrigatório)
//   - INVITE_FROM                   (default: "ACMP Brasil <onboarding@resend.dev>")
//   - INVITE_REPLY_TO               (default: nenhum)
//   - TURNSTILE_SECRET_KEY          (opcional — se ausente, captcha é pulado)
//   - SUPABASE_URL                  (auto-injetado)
//   - SUPABASE_SERVICE_ROLE_KEY     (auto-injetado)
// ============================================

// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RATE_LIMIT_PER_DAY = 3;

const GAME_LABELS: Record<string, string> = {
  "quiz-cm": "Quiz: Gestão de Mudanças",
  "acmp-quest": "ACMP Quest",
  "linha-do-tempo": "Linha do Tempo da GM",
  "change-manager-simulator": "Change Manager Simulator",
};

const GAME_PATHS: Record<string, string> = {
  "quiz-cm": "/jogos/quiz-cm",
  "acmp-quest": "/jogos/acmp-quest",
  "linha-do-tempo": "/jogos/linha-do-tempo",
  "change-manager-simulator": "/jogos/change-manager-simulator",
};

const SITE_URL = "https://www.acmpbrasil.org.br";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isValidEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  // @ts-ignore deno
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true; // captcha desativado quando secret não está configurado
  if (!token) return false;
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: form });
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}

function buildEmailHtml(opts: {
  inviterName: string;
  gameId?: string;
  gameLabel?: string;
  gameUrl: string;
  message?: string;
}): string {
  const safe = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const gameLine = opts.gameLabel
    ? `<p style="margin:0 0 18px;">e quer te ver no ranking do jogo <strong>${safe(opts.gameLabel)}</strong>.</p>`
    : `<p style="margin:0 0 18px;">e quer te ver no ranking dos jogos da ACMP Brasil.</p>`;

  const messageBlock = opts.message?.trim()
    ? `<div style="background:#f8f9fc;border-left:3px solid #1a3a5c;padding:14px 18px;margin:18px 0;border-radius:4px;font-style:italic;color:#4a4a5a;">${safe(opts.message.trim())}</div>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f4f5f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:14px;padding:34px 32px;box-shadow:0 2px 14px rgba(0,0,0,0.05);">
      <div style="font-size:11px;letter-spacing:0.18em;color:#1a3a5c;font-weight:700;text-transform:uppercase;margin-bottom:8px;">ACMP Brasil · Jogos Educativos</div>
      <h1 style="margin:0 0 14px;font-size:22px;color:#1a3a5c;font-weight:800;line-height:1.25;">${safe(opts.inviterName)} desafiou você 🎯</h1>
      ${gameLine}
      ${messageBlock}
      <div style="margin:26px 0 12px;">
        <a href="${opts.gameUrl}" style="display:inline-block;background:#1a3a5c;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:700;font-size:14px;">Aceitar desafio →</a>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280;line-height:1.55;">Os jogos da ACMP Brasil são gratuitos e baseados no Standard ACMP. Você pode jogar sem se cadastrar — mas se identificar entra para o ranking.</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#a0a8b3;margin:18px 0 0;line-height:1.5;">Você recebeu este e-mail porque <strong>${safe(opts.inviterName)}</strong> enviou um convite pelos jogos da ACMP Brasil.<br>Se não conhece esta pessoa, é só ignorar — não enviaremos novamente.</p>
  </div>
</body>
</html>`;
}

function buildEmailText(opts: {
  inviterName: string;
  gameLabel?: string;
  gameUrl: string;
  message?: string;
}): string {
  const lines = [
    `${opts.inviterName} desafiou você nos jogos da ACMP Brasil.`,
    "",
  ];
  if (opts.gameLabel) lines.push(`Jogo: ${opts.gameLabel}`);
  if (opts.message?.trim()) {
    lines.push("");
    lines.push(`Mensagem: "${opts.message.trim()}"`);
  }
  lines.push("");
  lines.push(`Aceitar: ${opts.gameUrl}`);
  return lines.join("\n");
}

// @ts-ignore deno
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // @ts-ignore deno
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return json(500, { error: "Servidor não configurado (RESEND_API_KEY ausente)." });
  }
  // @ts-ignore deno
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  // @ts-ignore deno
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { error: "Servidor não configurado (Supabase env ausente)." });
  }
  // @ts-ignore deno
  const FROM = Deno.env.get("INVITE_FROM") || "ACMP Brasil <onboarding@resend.dev>";
  // @ts-ignore deno
  const REPLY_TO = Deno.env.get("INVITE_REPLY_TO") || "";

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "JSON inválido." });
  }

  const inviterEmail = String(body?.inviter_email || "").trim().toLowerCase();
  const inviterName = String(body?.inviter_name || "").trim();
  const inviteeEmail = String(body?.invitee_email || "").trim().toLowerCase();
  const gameId = body?.game_id ? String(body.game_id) : null;
  const message = body?.message ? String(body.message).slice(0, 280) : "";
  const turnstileToken = body?.turnstile_token ? String(body.turnstile_token) : "";

  if (!isValidEmail(inviterEmail)) return json(400, { error: "E-mail do remetente inválido." });
  if (!isValidEmail(inviteeEmail)) return json(400, { error: "E-mail do amigo inválido." });
  if (inviterEmail === inviteeEmail) return json(400, { error: "Você não pode se autoconvidar." });
  if (inviterName.length < 2) return json(400, { error: "Nome do remetente é obrigatório." });
  if (gameId && !GAME_LABELS[gameId]) return json(400, { error: "game_id desconhecido." });

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";

  // 1) Captcha
  const captchaOk = await verifyTurnstile(turnstileToken, ip);
  if (!captchaOk) return json(429, { error: "Falha na verificação anti-bot." });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const ipHash = await sha256Hex(ip);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // 2) Rate limit por IP
  const { count: ipCount, error: ipErr } = await supa
    .from("game_invites")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("sent_at", since);
  if (ipErr) return json(500, { error: "Erro ao verificar rate limit." });
  if ((ipCount || 0) >= RATE_LIMIT_PER_DAY) {
    return json(429, { error: `Limite de ${RATE_LIMIT_PER_DAY} convites/dia por IP atingido. Tente novamente amanhã.` });
  }

  // 3) Anti-spam por inviter (mesmo limite)
  const { count: inviterCount } = await supa
    .from("game_invites")
    .select("id", { count: "exact", head: true })
    .eq("inviter_email", inviterEmail)
    .gte("sent_at", since);
  if ((inviterCount || 0) >= RATE_LIMIT_PER_DAY) {
    return json(429, { error: `Você atingiu o limite de ${RATE_LIMIT_PER_DAY} convites/dia.` });
  }

  // 4) Inviter precisa ter jogado pelo menos 1 vez
  const { count: playedCount } = await supa
    .from("game_scores")
    .select("id", { count: "exact", head: true })
    .eq("player_email", inviterEmail);
  if ((playedCount || 0) === 0) {
    return json(403, { error: "Jogue pelo menos uma partida antes de convidar amigos." });
  }

  // 5) Envio via Resend
  const gameLabel = gameId ? GAME_LABELS[gameId] : undefined;
  const gamePath = gameId ? GAME_PATHS[gameId] : "/jogos/";
  const gameUrl = SITE_URL + gamePath;

  const emailPayload: any = {
    from: FROM,
    to: [inviteeEmail],
    subject: `${inviterName} te desafiou${gameLabel ? ` em ${gameLabel}` : " nos jogos da ACMP Brasil"}`,
    html: buildEmailHtml({ inviterName, gameId: gameId || undefined, gameLabel, gameUrl, message }),
    text: buildEmailText({ inviterName, gameLabel, gameUrl, message }),
  };
  if (REPLY_TO) emailPayload.reply_to = REPLY_TO;

  const resendRes = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("Resend error", resendRes.status, detail);
    return json(502, { error: "Falha ao enviar e-mail (provedor)." });
  }

  // 6) Registra envio (anti-abuso + analytics)
  await supa.from("game_invites").insert({
    inviter_email: inviterEmail,
    inviter_name: inviterName,
    invitee_email: inviteeEmail,
    game_id: gameId,
    message: message || null,
    ip_hash: ipHash,
  });

  return json(200, { ok: true });
});
