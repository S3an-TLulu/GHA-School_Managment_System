---
name: supabase-live-sync
description: Use when working on this repo's Supabase Cloud Sync, Live Sync, or Messaging outbox — adding a new synced AppContext field, debugging a sync/auth failure, changing RLS/setup SQL, or touching src/lib/supabase.ts, src/lib/messaging.ts, or the live-sync effects in src/context/AppContext.tsx. Also load it before changing anything about Supabase Auth, gha_authorized_emails, or how a device links its cloud account.
---

# Supabase Cloud Sync / Live Sync

This app has no backend — Supabase is used only as an optional cloud mirror
of `localStorage`. There are **two independent sync mechanisms** plus a
message outbox, all gated by the same auth model. Get the auth model wrong
and you either lock everyone out or reopen the security hole fixed in
`docs/ARCHITECTURE_AUDIT.md` §0 — read that section before changing RLS or the
auth flow.

## The three tables

| Table | Purpose | Shape |
|---|---|---|
| `gha_backups` | "Cloud Sync" — whole dataset as one JSON document | one row, `id = 'school-data'` |
| `gha_kv` | "Live Sync" — one row per synced `localStorage` key, Realtime-enabled | `key`, `data`, `device`, `updated_at` |
| `gha_outbox` | Messaging queue, Realtime-enabled | one row per queued message |

All three, plus the allow-list table below, are provisioned by the SQL
constants in `src/lib/supabase.ts` (`SETUP_SQL`, `SETUP_SQL_LIVE`) and
`src/lib/messaging.ts` (`SETUP_SQL_OUTBOX`) — shown to the admin under
Settings → Cloud Sync / Messaging → Setup. **Edit those constants, not the
database directly** — they're what the admin actually runs, and they must
stay idempotent (`drop policy if exists` + re-`create`) so re-running an
upgraded version on an already-provisioned project is safe.

## Auth model — read before touching RLS

Every policy on these tables requires **both**:
1. `to authenticated` — a valid Supabase Auth session, and
2. the session's email present in `gha_authorized_emails` — a table only an
   admin can write to via the Supabase SQL editor (RLS-enabled, zero
   policies on it = default-deny to every client role).

`to authenticated` alone is **not enough** — Supabase's email/password
sign-up is open to anyone with the (intentionally public) anon key, so
without the allow-list check a stranger could self-register and still pass
RLS. Never simplify a policy back to just `to authenticated` or, worse,
`using (true)`.

A local app login (`AuthContext`) has no relationship to Supabase on its
own. `ensureCloudAccount()` in `src/lib/supabase.ts` is what bridges them:
called non-blocking from `AuthContext.login()` with a derived email
(`deriveCloudEmail()` — the user's `email` field, or `${username}@gha.local`)
and the same plaintext password, it signs in or self-provisions the
Supabase Auth account. It must **never be awaited on the login path** — a
slow or unreachable cloud project must not affect local sign-in, which is
otherwise fully self-contained. `logout()` calls `signOutCloud()`. A
self-password-change calls `updateCloudPassword()` (an admin resetting
*someone else's* password can't propagate to Supabase client-side — no
service-role key belongs in the browser — so that account just falls out
of sync until its own next local login re-links it).

Live UI state for this lives in `getCloudAuthStatus()` /
`gha-cloud-auth` window event, rendered in Settings → Cloud Sync's "Cloud
Account" card.

## Two sync mechanisms — don't confuse them

**Cloud Sync (`gha_backups`)** — manual Push/Pull, or auto-push 10s after
the last change if enabled (`Settings.tsx` cloud tab; the debounce timer is
in `AppContext.tsx` near `syncTimer`). Whole-document, **last push wins**
for the entire dataset. This is the only mechanism most installs use.

**Live Sync (`gha_kv`)** — opt-in, per-key, near-real-time via Supabase
Realtime. Last-write-wins **per key**, not per-record — two people editing
different fields of the same section on two devices at the same time still
means whoever's debounced push lands second overwrites the other's version
of that whole key. This is a real limitation for finance data especially;
don't present Live Sync as solving concurrent-edit conflicts.

## The 3-part pattern — every synced field needs all three

Adding a new piece of state to `AppContext` that should sync means touching
**three places together**, or it silently half-works:

1. **Load default**: `useState<T>(() => loadFromStorage('gha_x', default))`
2. **Persist + queue**: a `useEffect` that does
   `localStorage.setItem('gha_x', JSON.stringify(x)); queueLiveSync('gha_x');`
3. **Apply remote**: an entry in the `SETTERS` map inside the "Apply changes
   arriving from other devices" effect — `gha_x: setX`

Miss (2) and the field saves locally but never reaches other devices. Miss
(3) and it pushes fine but a remote device's incoming change for that key
is silently dropped (no error — `applyRemote` just no-ops on an unknown
key). Grep the existing ~45 entries in `AppContext.tsx` for the pattern
before adding a new one, and keep the key name identical across all three
places and in `EXPORT_KEYS`/`WIPE_SECTIONS` wiring nearby if the field
should be included in backup/restore or the Settings wipe UI.

`queueLiveSync` itself debounces 2.5s per key and uses a `liveSuppress` set
so applying a remote change doesn't echo straight back to the cloud
(ping-pong). If you add a new setter path that bypasses the normal
`setX(...)` call (e.g. a bulk import), make sure it still goes through the
same state setter so the persistence effect (and therefore the sync queue)
actually fires.

## Client — always use `getClient()`

`getClient()` in `src/lib/supabase.ts` is a singleton, keyed by
`(url, key)`. **Never call `createClient(...)` directly elsewhere** — a
second client instance means a Supabase Auth session established on one
doesn't exist on the other (multiple GoTrueClient instances, races on
token refresh). Every read/write/auth call in this app — Cloud Sync, Live
Sync, Messaging, and cloud auth — goes through this one function.

## Debugging a sync failure

1. Settings → Cloud Sync → "Cloud Account" card: is the device actually
   signed in (`getCloudAuthStatus().linked`)? If not, check the shown
   error — most often "needs email confirmation" (the Supabase project's
   Authentication → Providers → Email → "Confirm email" must be off for
   this internal tool) or a genuine credential mismatch.
2. Is that email actually in `gha_authorized_emails`? Being signed in to
   Supabase Auth is necessary but not sufficient — an admin has to have run
   the generated "authorize my current staff" SQL block (Settings → Cloud
   Sync → setup SQL) for that specific email.
3. Check the browser network tab for the actual Supabase response — a 401
   means not authenticated, a 403 with an empty result usually means RLS
   denied it (authenticated but not authorized), neither is a generic
   "Cloud sync failed" the UI can distinguish on its own.
4. For Live Sync specifically: is Realtime actually enabled on `gha_kv` /
   `gha_outbox` (`alter publication supabase_realtime add table ...` in the
   setup SQL) — a project that only ran the base `SETUP_SQL` for backups
   won't have this.

## Never

- Reintroduce `using (true)` / drop the `gha_authorized_emails` check on
  any of these tables.
- Await `ensureCloudAccount()` (or anything cloud-related) on the local
  login path.
- Create a second Supabase client instance instead of using `getClient()`.
- Add a new synced `AppContext` field without all three parts of the
  pattern above.
