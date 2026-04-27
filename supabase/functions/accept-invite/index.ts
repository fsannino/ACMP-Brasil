// ============================================
// ACMP Brasil — Edge Function: accept-invite
// Marca um convite como aceito quando o convidado se identifica.
//
// Validações:
//   - invite_id é número
//   - email é válido
//   - email do payload bate com invitee_email do convite (case-insensitive)
//   - convite ainda não foi aceito
//
// Idempotente: se já foi aceito, retorna 200 sem alterar.
// Não vaza informação: respostas são intencionalmente vagas pra
// não permitir descobrir quem foi convidado.
// ============================================

// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// @ts-ignore deno
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // @ts-ignore deno
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  // @ts-ignore deno
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { ok: false });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false });
  }

  const inviteId = Number(body?.invite_id);
  const email = String(body?.email || "").trim().toLowerCase();

  if (!Number.isFinite(inviteId) || inviteId <= 0) return json(400, { ok: false });
  if (!isValidEmail(email)) return json(400, { ok: false });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Busca o convite e valida que o e-mail bate.
  const { data: invite, error: selErr } = await supa
    .from("game_invites")
    .select("id, invitee_email, accepted_at")
    .eq("id", inviteId)
    .maybeSingle();
  if (selErr) return json(500, { ok: false });
  if (!invite) return json(200, { ok: true, matched: false }); // não vaza existência

  if (String(invite.invitee_email || "").toLowerCase() !== email) {
    return json(200, { ok: true, matched: false });
  }

  if (invite.accepted_at) {
    return json(200, { ok: true, matched: true, already_accepted: true });
  }

  const { error: updErr } = await supa
    .from("game_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("accepted_at", null);
  if (updErr) return json(500, { ok: false });

  return json(200, { ok: true, matched: true, accepted: true });
});
