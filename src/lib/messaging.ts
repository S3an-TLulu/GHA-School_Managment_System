// Outbound messaging — Phase 0 foundation.
//
// The app is 100% client-side, so it never talks to WhatsApp/SMS/email
// providers directly (that would leak secrets). Instead it drops a message into
// a Supabase "outbox" table (gha_outbox). A separate server-side "sender" then
// picks up queued rows and delivers them, writing the status back. That sender
// can be anything: a free Supabase Edge Function (recommended — see
// docs/messaging/), an n8n workflow, or even a person. The app only ever reads
// and writes gha_outbox, so the delivery backend is fully swappable.
//
// This module is the app-side client for that table: queue one or many
// messages, watch their status live (Supabase Realtime), and retry failures.

import { getClient } from './supabase';
import { logAudit } from './audit';

export type MsgChannel = 'telegram' | 'whatsapp' | 'sms' | 'email';
export type MsgStatus = 'queued' | 'sending' | 'sent' | 'failed';

export interface OutboxMessage {
  id?: string;
  channel: MsgChannel;
  recipient: string;        // phone (whatsapp/sms), email address, or Telegram chat/channel id
  recipient_name?: string;
  subject?: string;         // used by email
  body: string;
  status?: MsgStatus;
  error?: string;
  meta?: Record<string, unknown>;  // e.g. { kind: 'fee-reminder', studentId }
  created_at?: string;
  updated_at?: string;
}

export const CHANNEL_LABELS: Record<MsgChannel, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
};

// SQL the user runs once in their Supabase SQL editor (same style as the
// cloud-sync tables in supabase.ts). Realtime is enabled so the app sees status
// changes the moment the sender updates a row.
export const SETUP_SQL_OUTBOX = `create table if not exists public.gha_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  recipient text not null,
  recipient_name text,
  subject text,
  body text not null,
  status text not null default 'queued',
  error text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.gha_outbox enable row level security;
drop policy if exists "gha outbox anon access" on public.gha_outbox;
create policy "gha outbox anon access" on public.gha_outbox
  for all using (true) with check (true);
alter publication supabase_realtime add table public.gha_outbox;`;

// ---- Channel configuration (which channels are switched on) ----
const CHAN_KEY = 'gha_msg_channels';
const TG_KEY = 'gha_msg_telegram_channel';

export function getEnabledChannels(): Record<MsgChannel, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAN_KEY) || '{}');
    return { telegram: false, whatsapp: false, sms: false, email: false, ...saved };
  } catch {
    return { telegram: false, whatsapp: false, sms: false, email: false };
  }
}
export function setEnabledChannels(v: Record<MsgChannel, boolean>) {
  localStorage.setItem(CHAN_KEY, JSON.stringify(v));
}

// The default Telegram broadcast channel/chat id (e.g. "@gha_parents" or a
// numeric id). Individual parents don't have chat ids, so Telegram is used as a
// one-to-many broadcast channel.
export function getTelegramChannel(): string { return localStorage.getItem(TG_KEY) || ''; }
export function setTelegramChannel(v: string) { localStorage.setItem(TG_KEY, v.trim()); }

export function isMessagingReady(): boolean {
  return !!getClient();
}

// ---- Queue operations ----
function toRow(m: OutboxMessage) {
  return {
    channel: m.channel,
    recipient: m.recipient,
    recipient_name: m.recipient_name ?? null,
    subject: m.subject ?? null,
    body: m.body,
    status: 'queued',
    meta: m.meta ?? null,
  };
}

export async function queueMessage(m: OutboxMessage): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Cloud is not configured — set up Cloud Sync first (Settings → Cloud Sync).' };
  const { error } = await client.from('gha_outbox').insert(toRow(m));
  if (error) return { ok: false, error: error.message };
  logAudit('message-queued', `${CHANNEL_LABELS[m.channel]} → ${m.recipient_name || m.recipient}`);
  return { ok: true };
}

// Queue a batch (a broadcast). Returns how many rows were accepted.
export async function queueMany(list: OutboxMessage[]): Promise<{ ok: boolean; count: number; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, count: 0, error: 'Cloud is not configured — set up Cloud Sync first (Settings → Cloud Sync).' };
  if (list.length === 0) return { ok: true, count: 0 };
  const { error } = await client.from('gha_outbox').insert(list.map(toRow));
  if (error) return { ok: false, count: 0, error: error.message };
  logAudit('message-broadcast', `${list.length} × ${CHANNEL_LABELS[list[0].channel]}`);
  return { ok: true, count: list.length };
}

export async function getOutbox(limit = 100): Promise<OutboxMessage[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('gha_outbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as OutboxMessage[];
}

export async function retryMessage(id: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  const { error } = await client.from('gha_outbox')
    .update({ status: 'queued', error: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteOutboxMessage(id: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  const { error } = await client.from('gha_outbox').delete().eq('id', id);
  return !error;
}

// Watch the outbox for any insert/update/delete so the UI reflects delivery
// status in real time. Returns an unsubscribe function.
export function subscribeOutbox(onChange: () => void): () => void {
  const client = getClient();
  if (!client) return () => {};
  const channel = client
    .channel('gha-outbox-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gha_outbox' }, () => onChange())
    .subscribe();
  return () => { channel.unsubscribe(); };
}
