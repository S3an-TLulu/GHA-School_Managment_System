# Messaging — free setup guide (no n8n, no paid subscription)

The app can send announcements and reminders to parents over **Telegram, email,
WhatsApp and SMS**. It never talks to those services directly (that would expose
secrets in the browser). Instead it works like a mailbox:

1. The app **queues** a message into a Supabase table (`gha_outbox`).
2. A small **free Supabase Edge Function** (`gha-sender`) picks up queued rows and
   delivers them, then writes the result back.
3. The app shows delivery status **live** on **Messaging → Outbox**.

This means **no n8n and no paid subscription are required** — everything runs
inside the Supabase project you already use for Cloud Sync. (If you ever *do*
want n8n, it can drain the same table instead; nothing in the app changes.)

---

## Step 1 — Create the outbox table

In the Supabase dashboard → **SQL editor**, paste and run the SQL shown in the
app under **Messaging → Setup → step 1** (creates `gha_outbox` and turns on
Realtime).

## Step 2 — Deploy the sender

Install the Supabase CLI, then from the repo root:

```bash
supabase functions deploy gha-sender --no-verify-jwt
```

The function lives at `supabase/functions/gha-sender/index.ts`. It uses the
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` that Supabase injects
automatically — you don't set those yourself.

## Step 3 — Add the secrets for the channels you want

Only set the ones you'll use:

**Telegram (100% free, easiest):**
1. Open Telegram, message **@BotFather**, send `/newbot`, follow the prompts, copy
   the bot token.
2. Create a channel, add your bot as an **admin**.
3. Set the secret and put the channel handle in the app (Setup tab):
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN=123456:AA...
   ```
   In the app, enable **Telegram** and enter your channel id (e.g. `@gha_parents`).

**Email (free tier):**
```bash
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="Great Highway Academy <no-reply@yourdomain.com>"
```
(Sign up at resend.com for a free API key, or swap the `sendEmail` function for
your own SMTP provider.)

**WhatsApp (free tier, needs Meta business verification — add later):**
```bash
supabase secrets set WHATSAPP_TOKEN=xxx WHATSAPP_PHONE_ID=xxx
```
Note: outside a 24-hour window WhatsApp requires an **approved message template**.

**SMS:** wire your Twilio (or local gateway) call into the `sendSms` branch of the
function.

## Step 4 — Run the sender every minute

Supabase dashboard → **Database → Cron** (or the `pg_cron`/`pg_net` extensions):

```sql
select cron.schedule(
  'gha-sender-drain', '* * * * *',
  $$ select net.http_post(
       'https://<your-project-ref>.functions.supabase.co/gha-sender',
       '{}'::jsonb, 'application/json'::text) $$
);
```

That's it. Queue a message in the app, and within a minute the sender delivers it
and the Outbox tab flips it to **sent** (or **failed**, with the error, and a
retry button).

---

## How the pieces map

| Piece | Where | Cost |
|---|---|---|
| Queue + status UI | this app (`src/components/Messaging.tsx`) | free |
| Outbox table | Supabase (`gha_outbox`) | free tier |
| Sender/bot | Supabase Edge Function (`gha-sender`) | free tier |
| Telegram | @BotFather bot | free |
| Email | Resend/SMTP | free tier |
| WhatsApp | Meta WhatsApp Cloud API | free tier + verification |
| SMS | Twilio / local gateway | per message |

## Security notes

- Provider secrets live only in Supabase Edge Function secrets — never in the app.
- `gha_outbox` currently uses the same open RLS as the other GHA tables. Before
  going live with real parent contacts, tighten its policy (e.g. require a shared
  key) so a leaked anon key can't be used to blast messages.
- Keep an opt-out flag per guardian and honour STOP replies once two-way is added.
