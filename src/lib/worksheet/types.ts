import { RNG } from './rng';

// A single generated problem. `questionHtml` / `answerHtml` are ready-to-print
// HTML fragments (may embed inline SVG) so the document builder stays generic
// and never needs to know about individual question types.
export interface Problem {
  questionHtml: string;
  answerHtml: string;
  marks: number;
  // Optional plain-text forms so a bankable generator's problems can be pushed
  // into the Quiz Builder question bank.
  bankQuestion?: string;
  bankAnswer?: string;
}

// Declarative schema for one setting — drives an auto-rendered settings form in
// the builder UI, so adding a new generator never means writing bespoke form JSX.
export interface SettingSpec {
  key: string;
  label: string;
  type: 'number' | 'select' | 'toggle' | 'multiselect' | 'text';
  options?: { value: string; label: string }[];   // select / multiselect
  min?: number;
  max?: number;
  help?: string;
}

export type GeneratorCategory =
  | 'arithmetic' | 'numberSense' | 'counting' | 'wordProblems' | 'measurement'
  | 'geometry' | 'reasoning' | 'visual' | 'handwriting' | 'english' | 'science' | 'social';

export const CATEGORY_LABELS: Record<GeneratorCategory, string> = {
  arithmetic: 'Arithmetic',
  numberSense: 'Number sense',
  counting: 'Counting & patterns',
  wordProblems: 'Word problems',
  measurement: 'Measurement & money',
  geometry: 'Geometry',
  reasoning: 'Reasoning',
  visual: 'Visual maths',
  handwriting: 'Handwriting',
  english: 'English',
  science: 'Science',
  social: 'Social Studies',
};

export interface GenerateArgs {
  settings: Record<string, unknown>;
  grade: string;
  count: number;
  rng: RNG;
}

// A question-type generator. Register one and the whole app (menu, settings form,
// preview, print, answer key) picks it up — no other file changes ("future
// expansion without modifying existing code").
export interface Generator {
  id: string;
  label: string;
  category: GeneratorCategory;
  description?: string;
  settings: SettingSpec[];
  defaults: Record<string, unknown>;
  generate(args: GenerateArgs): Problem[];
  // When true, this generator's problems are plain-text Q&A and can be pushed
  // into the Quiz Builder question bank.
  bankable?: boolean;
}

// Small typed helpers for reading loosely-typed settings inside generators.
export const num = (s: Record<string, unknown>, k: string, d: number): number => {
  const v = s[k];
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : d;
};
export const str = (s: Record<string, unknown>, k: string, d: string): string => {
  const v = s[k];
  return v == null || v === '' ? d : String(v);
};
export const bool = (s: Record<string, unknown>, k: string, d: boolean): boolean => {
  const v = s[k];
  return typeof v === 'boolean' ? v : v == null ? d : v === 'true' || v === '1';
};
export const list = (s: Record<string, unknown>, k: string, d: string[]): string[] => {
  const v = s[k];
  return Array.isArray(v) ? v.map(String) : d;
};
