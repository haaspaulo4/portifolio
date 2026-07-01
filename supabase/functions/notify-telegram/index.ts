// =====================================================
// notify-telegram
// Edge Function: recebe { title, body, fields? } e envia
// mensagem formatada ao Telegram via bot token.
//
// Chamada esperada:
//   POST { title: "Novo agendamento", body: "Paulo fez X", fields: { Email: "a@b" } }
//
// Secrets (set via `supabase secrets set`):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID
// =====================================================
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ error: 'missing_secrets' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: { title?: string; body?: string; fields?: Record<string, string> };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const title = (payload.title || 'Notificação').slice(0, 200);
  const body = (payload.body || '').slice(0, 1000);
  const fields = payload.fields || {};

  // Texto plano com labels em maiúsculas. Sem parse_mode para evitar
  // problemas de escape de caracteres especiais (acentos, etc).
  const lines: string[] = [];
  lines.push(`▶ ${title}`);
  if (body) lines.push(body);
  if (Object.keys(fields).length) {
    for (const [k, v] of Object.entries(fields)) {
      lines.push(`${k}: ${v}`);
    }
  }
  const text = lines.join('\n');

  const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    });
    const tgBody = await tgRes.text();
    return new Response(JSON.stringify({ ok: tgRes.ok, status: tgRes.status, body: tgBody }), {
      status: tgRes.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'tg_fetch_failed', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
