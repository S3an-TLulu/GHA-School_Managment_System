import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Cloud sync stores the whole school dataset as one JSON document in the
// gha_backups table of the school's Supabase project. Config lives in
// localStorage so it survives reloads and is included in local backups.
//
// Access is gated by Supabase Auth + Row Level Security (see SETUP_SQL
// below): a browser must hold a valid authenticated session AND its email
// must be listed in gha_authorized_emails before it can read or write any
// of these tables. `to authenticated` alone is not enough — Supabase
// Auth's email/password sign-up is open to anyone who has the anon key
// (that's normal and expected), so without the allow-list check a stranger
// could self-register and still pass RLS. See ARCHITECTURE_AUDIT.md §0/§10.

export const DEFAULT_SUPABASE_URL = 'https://tlcehbvzniujzjxiyokl.supabase.co';
// Anon/publishable key — safe to ship in the client; data access is governed
// by Row Level Security policies on the Supabase project.
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY2VoYnZ6bml1anpqeGl5b2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjYyNjksImV4cCI6MjA5OTMwMjI2OX0.uul0JYS7sJiuZb3jk5BN4fQtcHe_NvAzY6Yg539b0LU';
const URL_KEY = 'gha_supabase_url';
const ANON_KEY = 'gha_supabase_key';
const AUTO_KEY = 'gha_supabase_auto';
const LAST_SYNC_KEY = 'gha_supabase_last_sync';

export const BACKUP_ROW_ID = 'school-data';

/**
 * SQL the admin runs once (and re-runs to upgrade) in the Supabase SQL
 * editor to provision the backup table. Safe to re-run: `drop policy if
 * exists` covers both this table's old fully-open policy and this one, so
 * an install that ran the previous open-access version just gets upgraded.
 */
export const SETUP_SQL = `-- Accounts allowed to reach the school's data. Only an admin editing this
-- from the Supabase SQL editor can change it — the app itself has no
-- permission to write to this table, by design.
create table if not exists public.gha_authorized_emails (
  email text primary key,
  added_at timestamptz default now()
);
alter table public.gha_authorized_emails enable row level security;

create table if not exists public.gha_backups (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.gha_backups enable row level security;
drop policy if exists "gha anon access" on public.gha_backups;
drop policy if exists "gha authenticated access" on public.gha_backups;
drop policy if exists "gha authorized staff access" on public.gha_backups;
create policy "gha authorized staff access" on public.gha_backups
  for all to authenticated
  using (exists (select 1 from public.gha_authorized_emails a where a.email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from public.gha_authorized_emails a where a.email = auth.jwt() ->> 'email'));`;

export function getCloudConfig() {
  return {
    url: localStorage.getItem(URL_KEY) || DEFAULT_SUPABASE_URL,
    key: localStorage.getItem(ANON_KEY) || DEFAULT_SUPABASE_KEY,
    autoSync: localStorage.getItem(AUTO_KEY) === '1',
    lastSync: localStorage.getItem(LAST_SYNC_KEY) || '',
  };
}

export function saveCloudConfig(cfg: { url?: string; key?: string; autoSync?: boolean }) {
  if (cfg.url !== undefined) localStorage.setItem(URL_KEY, cfg.url.trim());
  if (cfg.key !== undefined) localStorage.setItem(ANON_KEY, cfg.key.trim());
  if (cfg.autoSync !== undefined) localStorage.setItem(AUTO_KEY, cfg.autoSync ? '1' : '0');
}

export function markSynced() {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

// A single shared client per (url, key) pair, so a Supabase Auth session
// established on one call is actually visible to every other call — a
// fresh `createClient()` per call would spawn a separate GoTrueClient each
// time and risk racing token refreshes against itself.
let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getClient(): SupabaseClient | null {
  const { url, key } = getCloudConfig();
  if (!url || !key) return null;
  if (cachedClient && cachedUrl === url && cachedKey === key) return cachedClient;
  try {
    cachedClient = createClient(url, key);
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch {
    cachedClient = null;
    return null;
  }
}

export async function pushToCloud(json: string): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Cloud sync is not configured — paste your anon key in Settings → Cloud Sync.' };
  const { error } = await client.from('gha_backups').upsert({
    id: BACKUP_ROW_ID,
    data: JSON.parse(json),
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  markSynced();
  return { ok: true };
}

export async function pullFromCloud(): Promise<{ ok: boolean; json?: string; updatedAt?: string; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Cloud sync is not configured — paste your anon key in Settings → Cloud Sync.' };
  const { data, error } = await client.from('gha_backups').select('data, updated_at').eq('id', BACKUP_ROW_ID).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'No cloud backup found yet — push one first.' };
  markSynced();
  return { ok: true, json: JSON.stringify(data.data), updatedAt: data.updated_at };
}

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Enter both the project URL and the anon key first.' };
  const { error } = await client.from('gha_backups').select('id').limit(1);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}


// ---------------- Live sync (Phase 7) ----------------
// One row per storage key in gha_kv. Changes broadcast via Supabase Realtime,
// so edits on one computer appear on the others within seconds. Conflicts are
// per-section (last write wins for that section only), not whole-database.

const LIVE_KEY = 'gha_supabase_live';
const DEVICE_KEY = 'gha_device_id';

export const SETUP_SQL_LIVE = `create table if not exists public.gha_kv (
  key text primary key,
  data jsonb,
  updated_at timestamptz default now(),
  device text
);
alter table public.gha_kv enable row level security;
drop policy if exists "gha kv anon access" on public.gha_kv;
drop policy if exists "gha kv authenticated access" on public.gha_kv;
drop policy if exists "gha kv authorized staff access" on public.gha_kv;
create policy "gha kv authorized staff access" on public.gha_kv
  for all to authenticated
  using (exists (select 1 from public.gha_authorized_emails a where a.email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from public.gha_authorized_emails a where a.email = auth.jwt() ->> 'email'));
alter publication supabase_realtime add table public.gha_kv;`;

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function isLiveSyncEnabled(): boolean {
  return localStorage.getItem(LIVE_KEY) === '1';
}

export function setLiveSyncEnabled(on: boolean) {
  localStorage.setItem(LIVE_KEY, on ? '1' : '0');
}

// getClient() is already a singleton per (url, key) — no need for a second
// cache here.
const liveClient = getClient;

export async function pushKeyLive(key: string): Promise<boolean> {
  const client = liveClient();
  if (!client) return false;
  const raw = localStorage.getItem(key);
  let data: unknown = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  const { error } = await client.from('gha_kv').upsert({
    key, data, updated_at: new Date().toISOString(), device: getDeviceId(),
  });
  return !error;
}

export async function pullAllLive(): Promise<Record<string, unknown> | null> {
  const client = liveClient();
  if (!client) return null;
  const { data, error } = await client.from('gha_kv').select('key, data');
  if (error || !data) return null;
  const out: Record<string, unknown> = {};
  data.forEach(row => { out[row.key] = row.data; });
  return out;
}

let channel: RealtimeChannel | null = null;
export function subscribeLive(onRemoteChange: (key: string, data: unknown) => void): () => void {
  const client = liveClient();
  if (!client) return () => {};
  const myDevice = getDeviceId();
  channel = client
    .channel('gha-kv-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gha_kv' }, payload => {
      const row = payload.new as { key?: string; data?: unknown; device?: string } | null;
      if (!row?.key || row.device === myDevice) return;
      onRemoteChange(row.key, row.data);
    })
    .subscribe();
  return () => { channel?.unsubscribe(); channel = null; };
}

// ---------------- Cloud auth ----------------
// Real Supabase Auth sessions, required by RLS on every gha_* table since
// the "do it right" security fix (see ARCHITECTURE_AUDIT.md §0). A local
// app login (username + password, from AuthContext) has no relationship to
// Supabase on its own; ensureCloudAccount() is how a local sign-in also
// becomes an authenticated Supabase session, using the same credentials.
//
// This only gets a browser past `to authenticated` — actually reaching the
// data additionally requires the account's email to be listed in
// gha_authorized_emails, which only an admin can add to (see SETUP_SQL).
// So signing up here is safe to leave self-service: an uninvited stranger
// can create a Supabase Auth account, but RLS still won't let them read or
// write anything.

export interface CloudAuthStatus {
  linked: boolean;
  email?: string;
  error?: string;
  checking?: boolean;
}

let cloudAuthStatus: CloudAuthStatus = { linked: false };
function setCloudAuthStatus(next: CloudAuthStatus) {
  cloudAuthStatus = next;
  window.dispatchEvent(new CustomEvent('gha-cloud-auth'));
}
export function getCloudAuthStatus(): CloudAuthStatus {
  return cloudAuthStatus;
}

/** Deterministic Supabase Auth email for a local app user without a real one on file. */
export function deriveCloudEmail(user: { username: string; email?: string }): string {
  return (user.email?.trim() || `${user.username.trim()}@gha.local`).toLowerCase();
}

export async function signInCloud(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Cloud sync is not configured.' };
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUpCloud(email: string, password: string): Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Cloud sync is not configured.' };
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, needsConfirmation: !data.session };
}

export async function signOutCloud(): Promise<void> {
  const client = getClient();
  if (client) await client.auth.signOut();
  setCloudAuthStatus({ linked: false });
}

export async function getCloudSession() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

/** Update the currently-signed-in cloud user's own password (self-change only — see lib/auth.ts callers). */
export async function updateCloudPassword(password: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  const { error } = await client.auth.updateUser({ password });
  return !error;
}

/**
 * Best-effort, non-blocking: sign in to Supabase Auth with the given email +
 * password, self-provisioning the account on first use if it doesn't exist
 * yet. Never throws and never affects local app login — call it after local
 * auth has already succeeded, without awaiting it on the login path.
 */
export async function ensureCloudAccount(email: string, password: string): Promise<CloudAuthStatus> {
  if (!getClient()) return { linked: false };
  setCloudAuthStatus({ linked: false, email, checking: true });
  const signIn = await signInCloud(email, password);
  if (signIn.ok) {
    const status: CloudAuthStatus = { linked: true, email };
    setCloudAuthStatus(status);
    return status;
  }
  const signUp = await signUpCloud(email, password);
  if (!signUp.ok) {
    const status: CloudAuthStatus = { linked: false, email, error: signUp.error };
    setCloudAuthStatus(status);
    return status;
  }
  if (signUp.needsConfirmation) {
    const status: CloudAuthStatus = {
      linked: false, email,
      error: 'Cloud account created but needs email confirmation — in Supabase → Authentication → Providers → Email, turn off "Confirm email" for this internal tool.',
    };
    setCloudAuthStatus(status);
    return status;
  }
  const status: CloudAuthStatus = { linked: true, email };
  setCloudAuthStatus(status);
  return status;
}

/** SQL to grant one or more already-signed-up accounts access to the data (run after SETUP_SQL). */
export function authorizeEmailsSql(emails: string[]): string {
  const unique = Array.from(new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean)));
  if (unique.length === 0) return '';
  const values = unique.map(e => `('${e.replace(/'/g, "''")}')`).join(',\n  ');
  return `insert into public.gha_authorized_emails (email) values\n  ${values}\non conflict (email) do nothing;`;
}
