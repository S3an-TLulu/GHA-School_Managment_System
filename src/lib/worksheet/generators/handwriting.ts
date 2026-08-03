import { Generator, Problem, str, num } from '../types';
import { handwritingRow } from '../svg';

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');

export const handwriting: Generator = {
  id: 'handwriting',
  label: 'Handwriting practice',
  category: 'handwriting',
  description: 'Traceable rows of letters, numbers or words on guide lines.',
  settings: [
    { key: 'content', label: 'Content', type: 'select', options: [
      { value: 'lower', label: 'Lowercase letters' }, { value: 'upper', label: 'Uppercase letters' },
      { value: 'digits', label: 'Numbers 0–9' }, { value: 'words', label: 'Custom words' } ] },
    { key: 'words', label: 'Custom words (comma separated)', type: 'text', help: 'Used when Content = Custom words' },
    { key: 'repeats', label: 'Repeats per line', type: 'number', min: 1, max: 12 },
  ],
  defaults: { content: 'lower', words: '', repeats: 4 },
  generate({ settings, count, rng }): Problem[] {
    const content = str(settings, 'content', 'lower');
    const repeats = num(settings, 'repeats', 4);
    let source: string[];
    if (content === 'upper') source = UPPER;
    else if (content === 'digits') source = DIGITS;
    else if (content === 'words') source = str(settings, 'words', '').split(',').map(w => w.trim()).filter(Boolean);
    else source = LOWER;
    if (!source.length) source = LOWER;
    return Array.from({ length: count }, (_, i) => {
      const glyph = source[i % source.length] ?? rng.pick(source);
      return {
        questionHtml: handwritingRow(glyph, { repeats, size: content === 'words' ? 26 : 34 }),
        answerHtml: `<span style="font-size:16px">${glyph}</span>`,
        marks: 0,
      };
    });
  },
};
