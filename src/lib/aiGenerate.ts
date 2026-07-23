import { getClient } from './supabase';

// Calls the gha-generate Supabase Edge Function to turn a topic into a teaching
// resource. Requires the school's Supabase project to be configured (Settings →
// Cloud Sync) and the function deployed with an ANTHROPIC_API_KEY secret. If it
// isn't set up, we return a friendly error rather than throwing.

export interface GenQuestion { question: string; options: string[]; correctIndex: number; marks: number; }
export interface GenQuiz { questions: GenQuestion[]; }
export interface GenLesson { title: string; objectives: string; steps: string[]; resources: string; notes: string; }
export interface GenTopic { title: string; content: string; }

type Kind = 'quiz' | 'lesson' | 'topic';
type DataFor<K extends Kind> = K extends 'quiz' ? GenQuiz : K extends 'lesson' ? GenLesson : GenTopic;

export async function generateResource<K extends Kind>(
  kind: K,
  opts: { subject: string; grade?: string; topic: string; count?: number },
): Promise<{ ok: true; data: DataFor<K> } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Connect your school’s cloud project first (Settings → Cloud Sync) to use AI generation.' };
  try {
    const { data, error } = await client.functions.invoke('gha-generate', {
      body: { kind, subject: opts.subject, grade: opts.grade, topic: opts.topic, count: opts.count },
    });
    if (error) return { ok: false, error: error.message || 'The generator could not be reached. Is the gha-generate function deployed?' };
    if (!data?.ok) return { ok: false, error: data?.error || 'Generation failed.' };
    return { ok: true, data: data.data as DataFor<K> };
  } catch (e) {
    return { ok: false, error: String((e as Error).message) };
  }
}
