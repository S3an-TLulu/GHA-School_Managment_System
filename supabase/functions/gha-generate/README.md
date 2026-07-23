# AI teaching-resource generation (`gha-generate`)

The **Subjects** hub can turn a topic into a worksheet, a lesson plan, or topic
notes. Because the app is a static site with no backend, the AI call runs in a
small Supabase **Edge Function** so the API key stays on the server — the
browser only ever sends the subject/topic and receives the finished JSON.

The buttons appear in Subjects → *Topics*, *Lesson Plans*, and *Question Bank*
("✨ Generate"). Until the function below is deployed they show a friendly
"connect your cloud project" message — everything else in the hub works without
it.

## One-time setup

You need the school's Supabase project (the same one used for Cloud Sync) and
an Anthropic API key from <https://console.anthropic.com>.

1. Install the Supabase CLI and log in: `npm i -g supabase && supabase login`
2. Link the project: `supabase link --project-ref <your-project-ref>`
3. Deploy the function:

   ```sh
   supabase functions deploy gha-generate --no-verify-jwt
   ```

4. Set the API key as a function secret (never in the app):

   ```sh
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   # optional — override the model (defaults to claude-opus-4-8):
   supabase secrets set GHA_GENERATE_MODEL=claude-opus-4-8
   ```

That's it. Make sure the app's **Settings → Cloud Sync** points at the same
project URL/anon key, and the Generate buttons will work.

## Cost & privacy

- The key is billed to your Anthropic account; each generation is a single
  request. Pick a cheaper model via `GHA_GENERATE_MODEL` if you prefer.
- Only the subject, grade and topic you type are sent — no pupil data.
