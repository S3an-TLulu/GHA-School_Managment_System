# AI teaching-resource generation (`gha-generate`)

The **Subjects** hub can turn a topic into a worksheet, a lesson plan, or topic
notes. Because the app is a static site with no backend, the AI call runs in a
small Supabase **Edge Function** so the API key stays on the server — the
browser only ever sends the subject/topic and receives the finished JSON.

The **AI Generate** panel appears in Subjects → *Question Bank* (and the Topics /
Lesson Plans tabs). It can produce **multiple-choice** or **short-answer**
questions (with the correct answers captured into the marking key). Until the
function below is deployed the panel shows a friendly "connect your cloud
project" message — everything else in the hub works without it.

## One-time setup

You need the school's Supabase project (the same one used for Cloud Sync) and a
**fresh** Anthropic API key from <https://console.anthropic.com>. Never paste the
key into the app or share it in chat — it lives only in the function secret below.

### Option A — Supabase dashboard (no CLI needed)

1. Open your project → **Edge Functions** → **Create a new function**, name it
   `gha-generate`.
2. Paste the contents of `index.ts` (this folder) and **Deploy**. Disable
   "Verify JWT" for this function so the app can call it.
3. Go to **Project Settings → Edge Functions → Secrets** and add
   `ANTHROPIC_API_KEY` = your key. (Optional: `GHA_GENERATE_MODEL`, default
   `claude-opus-4-8`.)

### Option B — Supabase CLI

```sh
npm i -g supabase && supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy gha-generate --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional — override the model (defaults to claude-opus-4-8):
supabase secrets set GHA_GENERATE_MODEL=claude-opus-4-8
```

Finally, make sure the app's **Settings → Cloud Sync** points at the same
project URL/anon key, then open Subjects → Question Bank → **AI Generate**.

## Cost & privacy

- The key is billed to your Anthropic account; each generation is a single
  request. Pick a cheaper model via `GHA_GENERATE_MODEL` if you prefer.
- Only the subject, grade and topic you type are sent — no pupil data.
