// GHA Generate — Supabase Edge Function that turns a topic into a teaching
// resource (quiz questions, a lesson plan, or topic notes) using an LLM.
//
// The school app has no backend of its own, so this function is the trusted
// place to hold the API key: the browser calls it with the subject/topic, the
// function calls the LLM with the key stored as an Edge Function secret, and
// only the generated JSON comes back. The key is never shipped to the client.
//
// Deploy (free tier):
//   supabase functions deploy gha-generate --no-verify-jwt
// Set the secret (get a key from https://console.anthropic.com):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   # optional — override the model (defaults to claude-opus-4-8):
//   supabase secrets set GHA_GENERATE_MODEL=claude-opus-4-8

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MODEL = Deno.env.get('GHA_GENERATE_MODEL') ?? 'claude-opus-4-8';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

interface GenBody {
  kind: 'quiz' | 'lesson' | 'topic';
  subject: string;
  grade?: string;
  topic: string;
  count?: number;      // quiz only
}

// Prompt + the JSON shape we ask the model to return, per resource kind.
function buildPrompt(b: GenBody): string {
  const who = `for ${b.grade ? b.grade + ' ' : ''}pupils in the subject "${b.subject}"`;
  if (b.kind === 'quiz') {
    const n = Math.min(Math.max(b.count ?? 5, 1), 20);
    return `Write ${n} multiple-choice questions ${who} on the topic "${b.topic}". `
      + `Return ONLY JSON of the form {"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":number,"marks":number}]}. `
      + `Each question must have exactly 4 options, correctIndex is the 0-based index of the correct option, marks is a small integer (usually 1). No commentary, JSON only.`;
  }
  if (b.kind === 'lesson') {
    return `Write a concise lesson plan ${who} on the topic "${b.topic}". `
      + `Return ONLY JSON of the form {"title":string,"objectives":string,"steps":[string],"resources":string,"notes":string}. `
      + `"steps" is an ordered list of 4-8 short teaching steps. Keep it practical for a primary-school classroom. JSON only.`;
  }
  return `Write clear topic notes ${who} on the topic "${b.topic}", suitable to hand to pupils or use as teaching content. `
    + `Return ONLY JSON of the form {"title":string,"content":string}. "content" is a few short paragraphs in plain text. JSON only.`;
}

// Pull the first {...} block out of the model's reply and parse it.
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON found in the model response.');
  return JSON.parse(text.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
  if (!ANTHROPIC_API_KEY) return json({ ok: false, error: 'The generator is not configured yet — set the ANTHROPIC_API_KEY secret on the gha-generate function.' }, 400);

  let body: GenBody;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Invalid request body.' }, 400); }
  if (!body?.kind || !body?.subject?.trim() || !body?.topic?.trim())
    return json({ ok: false, error: 'kind, subject and topic are required.' }, 400);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: 'You are a helpful assistant for primary-school teachers. You always reply with valid JSON in exactly the shape requested, and nothing else.',
        messages: [{ role: 'user', content: buildPrompt(body) }],
      }),
    });
    if (!res.ok) return json({ ok: false, error: `LLM error ${res.status}: ${(await res.text()).slice(0, 300)}` }, 502);
    const payload = await res.json();
    const text = (payload.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
    return json({ ok: true, kind: body.kind, data: extractJson(text) });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message).slice(0, 300) }, 500);
  }
});
