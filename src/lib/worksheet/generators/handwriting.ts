import { Generator, Problem, str, num } from '../types';
import { handwritingRow, handwritingHeader } from '../svg';

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');

export const handwriting: Generator = {
  id: 'handwriting',
  label: 'Handwriting practice',
  category: 'handwriting',
  description: 'Reference · Trace · Practice rows on guide lines (Century Gothic).',
  settings: [
    { key: 'content', label: 'Content', type: 'select', options: [
      { value: 'pairs', label: 'Letters (Aa Bb Cc)' }, { value: 'lower', label: 'Lowercase letters' },
      { value: 'upper', label: 'Uppercase letters' }, { value: 'digits', label: 'Numbers 0–9' },
      { value: 'words', label: 'Custom words' } ] },
    { key: 'words', label: 'Custom words (comma separated)', type: 'text', help: 'Used when Content = Custom words' },
    { key: 'repeats', label: 'Trace copies per line', type: 'number', min: 1, max: 12 },
  ],
  defaults: { content: 'pairs', words: '', repeats: 4 },
  generate({ settings, count, index = 0 }): Problem[] {
    const content = str(settings, 'content', 'pairs');
    const repeats = num(settings, 'repeats', 4);
    const words = str(settings, 'words', '').split(',').map(w => w.trim()).filter(Boolean);

    // Build the list of (reference, trace) pairs for the requested rows.
    const rowFor = (i: number): { ref: string; trace: string } => {
      if (content === 'upper') { const c = UPPER[i % 26]; return { ref: c, trace: c }; }
      if (content === 'lower') { const c = LOWER[i % 26]; return { ref: c, trace: c }; }
      if (content === 'digits') { const c = DIGITS[i % 10]; return { ref: c, trace: c }; }
      if (content === 'words') { const w = (words.length ? words : ['hello'])[i % (words.length || 1)]; return { ref: w, trace: w }; }
      const c = UPPER[i % 26], l = LOWER[i % 26]; return { ref: `${c}${l}`, trace: `${c}${l}` }; // pairs
    };
    // Cap alphabet/number content to their natural length unless words.
    const rows = content === 'digits' ? Math.min(count, 10)
      : content === 'words' ? count
      : Math.min(count, 26);

    return Array.from({ length: rows }, (_, i) => {
      const abs = index + i;
      const { ref, trace } = rowFor(abs);
      const size = content === 'words' ? 24 : 30;
      const row = handwritingRow(ref, trace, { repeats, size });
      return {
        questionHtml: (abs === 0 ? handwritingHeader() : '') + row,
        answerHtml: `<span style="font-size:16px">${ref}</span>`,
        marks: 0,
      };
    });
  },
};
