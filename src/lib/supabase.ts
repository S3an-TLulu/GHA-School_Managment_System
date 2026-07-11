import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cloud sync stores the whole school dataset as one JSON document in the
// gha_backups table of the school's Supabase project. Config lives in
// localStorage so it survives reloads and is included in local backups.

export const DEFAULT_SUPABASE_URL = 'https://tlcehbvzniujzjxiyokl.supabase.co';
// Anon/publishable key — safe to ship in the client; data access is governed
// by Row Level Security policies on the Supabase project.
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY2VoYnZ6bml1anpqeGl5b2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjYyNjksImV4cCI6MjA5OTMwMjI2OX0.uul0JYS7sJiuZb3jk5BN4fQtcHe_NvAzY6Yg539b0LU';
const URL_KEY = 'gha_supabase_url';
const ANON_KEY = 'gha_supabase_key';
const AUTO_KEY = 'gha_supabase_auto';
const LAST_SYNC_KEY = 'gha_supabase_last_sync';

export const BACKUP_ROW_ID = 'school-data';

/** SQL the user runs once in the Supabase SQL editor to provision the table. */
export const SETUP_SQL = `create table if not exists public.gha_backups (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.gha_backups enable row level security;
drop policy if exists "gha anon access" on public.gha_backups;
create policy "gha anon access" on public.gha_backups
  for all using (true) with check (true);`;

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

export function getClient(): SupabaseClient | null {
  const { url, key } = getCloudConfig();
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
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
