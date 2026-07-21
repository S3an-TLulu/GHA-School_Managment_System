// GHA Sender — free Supabase Edge Function that delivers queued messages.
//
// This is the server-side "bot" that replaces n8n. It reads rows from the
// gha_outbox table (status = 'queued'), sends each one over the right channel,
// and writes the result back ('sent' or 'failed'). All provider secrets live in
// Supabase Edge Function secrets — never in the browser app.
//
// Deploy (free tier):
//   supabase functions deploy gha-sender --no-verify-jwt
// Set secrets (only the ones you use):
//   supabase secrets set TELEGRAM_BOT_TOKEN=123:abc
//   supabase secrets set RESEND_API_KEY=re_xxx  EMAIL_FROM="School <no-reply@yourdomain>"
//   supabase secrets set WHATSAPP_TOKEN=xxx  WHATSAPP_PHONE_ID=xxx
// Then run it on a schedule (Supabase Dashboard → Database → Cron, every minute):
//   select net.http_post('https://<project>.functions.supabase.co/gha-sender',
//                         '{}', 'application/json');
// It uses the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY that Supabase injects
// automatically, so it can read/update the outbox regardless of RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? '';
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') ?? '';
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') ?? '';

interface OutboxRow {
  id: string;
  channel: 'telegram' | 'whatsapp' | 'sms' | 'email';
  recipient: string;
  recipient_name: string | null;
  subject: string | null;
  body: string;
}

async function sendTelegram(row: OutboxRow) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not set');
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: row.recipient, text: row.body }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}

async function sendEmail(row: OutboxRow) {
  if (!RESEND_API_KEY || !EMAIL_FROM) throw new Error('RESEND_API_KEY / EMAIL_FROM not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [row.recipient],
      subject: row.subject || 'Message from your school',
      text: row.body,
    }),
  });
  if (!res.ok) throw new Error(`Email ${res.status}: ${await res.text()}`);
}

async function sendWhatsApp(row: OutboxRow) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) throw new Error('WhatsApp not configured');
  // NOTE: outside the 24-hour window WhatsApp requires an approved template.
  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: row.recipient.replace(/[^\d]/g, ''),
      type: 'text',
      text: { body: row.body },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
}

async function deliver(row: OutboxRow) {
  switch (row.channel) {
    case 'telegram': return sendTelegram(row);
    case 'email': return sendEmail(row);
    case 'whatsapp': return sendWhatsApp(row);
    case 'sms': throw new Error('SMS provider not wired yet — add Twilio here');
    default: throw new Error(`Unknown channel: ${row.channel}`);
  }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Grab a small batch of queued messages.
  const { data: rows, error } = await supabase
    .from('gha_outbox')
    .select('id, channel, recipient, recipient_name, subject, body')
    .eq('status', 'queued')
    .limit(20);

  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

  let sent = 0, failed = 0;
  for (const row of (rows ?? []) as OutboxRow[]) {
    // Mark as sending so a second run doesn't double-send.
    await supabase.from('gha_outbox').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', row.id);
    try {
      await deliver(row);
      await supabase.from('gha_outbox').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', row.id);
      sent++;
    } catch (e) {
      await supabase.from('gha_outbox').update({ status: 'failed', error: String((e as Error).message).slice(0, 500), updated_at: new Date().toISOString() }).eq('id', row.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: (rows ?? []).length, sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
