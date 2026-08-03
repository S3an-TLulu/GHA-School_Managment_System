import { Generator, Problem, num, str } from '../types';
import { gradeTier } from '../grades';
import { RNG } from '../rng';

const blank = '<span style="display:inline-block;border-bottom:1px solid #111;min-width:52px;text-align:center">&nbsp;</span>';

// Render a sequence, replacing hidden positions with a blank; bold the answers.
function seqHtml(seq: number[], hidden: Set<number>, reveal: boolean): string {
  return `<span style="font-size:17px;letter-spacing:1px">` + seq.map((v, i) =>
    hidden.has(i) ? (reveal ? `<b>${v}</b>` : blank) : String(v)
  ).join('&nbsp;&nbsp;&nbsp;') + `</span>`;
}

function hiddenPositions(len: number, rng: RNG): Set<number> {
  const h = new Set<number>();
  const howMany = Math.max(1, Math.round(len / 3));
  while (h.size < howMany) h.add(rng.int(1, len - 1)); // never hide the first
  return h;
}

export const missingNumbers: Generator = {
  id: 'missing-numbers',
  label: 'Missing numbers',
  category: 'counting',
  description: 'Consecutive runs with blanks to fill.',
  settings: [
    { key: 'length', label: 'Numbers in the run', type: 'number', min: 4, max: 10 },
  ],
  defaults: { length: 6 },
  generate({ settings, grade, count, rng }): Problem[] {
    const length = num(settings, 'length', 6);
    return Array.from({ length: count }, () => {
      const start = rng.int(1, Math.max(2, gradeTier(grade).max - length));
      const seq = Array.from({ length }, (_, i) => start + i);
      const hidden = hiddenPositions(length, rng);
      return { questionHtml: seqHtml(seq, hidden, false), answerHtml: seqHtml(seq, hidden, true), marks: 1 };
    });
  },
};

export const skipCounting: Generator = {
  id: 'skip-counting',
  label: 'Skip counting',
  category: 'counting',
  description: 'Count in 2s, 3s, 5s, 10s, 25s, 50s or 100s.',
  settings: [
    { key: 'step', label: 'Count in', type: 'select', options: [2, 3, 5, 10, 25, 50, 100].map(v => ({ value: String(v), label: `${v}s` })) },
    { key: 'length', label: 'Numbers in the run', type: 'number', min: 4, max: 10 },
  ],
  defaults: { step: '5', length: 6 },
  generate({ settings, grade, count, rng }): Problem[] {
    const step = num(settings, 'step', 5);
    const length = num(settings, 'length', 6);
    return Array.from({ length: count }, () => {
      const maxStart = Math.max(step, gradeTier(grade).max - step * length);
      const start = step * rng.int(0, Math.max(1, Math.floor(maxStart / step)));
      const seq = Array.from({ length }, (_, i) => start + i * step);
      const hidden = hiddenPositions(length, rng);
      return { questionHtml: seqHtml(seq, hidden, false), answerHtml: seqHtml(seq, hidden, true), marks: 1 };
    });
  },
};

export const numberPatterns: Generator = {
  id: 'number-patterns',
  label: 'Number patterns',
  category: 'counting',
  description: 'Increasing, decreasing or mixed step patterns.',
  settings: [
    { key: 'direction', label: 'Pattern', type: 'select', options: [
      { value: 'up', label: 'Increasing' }, { value: 'down', label: 'Decreasing' }, { value: 'mixed', label: 'Mixed' } ] },
    { key: 'length', label: 'Numbers in the run', type: 'number', min: 4, max: 8 },
  ],
  defaults: { direction: 'up', length: 5 },
  generate({ settings, grade, count, rng }): Problem[] {
    const direction = str(settings, 'direction', 'up');
    const length = num(settings, 'length', 5);
    return Array.from({ length: count }, () => {
      const step = rng.pick([2, 3, 4, 5, 10, 25, 50, 100].filter(s => s <= Math.max(2, gradeTier(grade).max / 4)));
      const dir = direction === 'mixed' ? (rng.bool() ? 1 : -1) : direction === 'down' ? -1 : 1;
      const base = dir === -1 ? step * rng.int(length, length + 20) : rng.int(0, Math.max(1, Math.floor(gradeTier(grade).max / 2)));
      const seq = Array.from({ length }, (_, i) => base + dir * step * i);
      const hidden = hiddenPositions(length, rng);
      return { questionHtml: seqHtml(seq, hidden, false), answerHtml: seqHtml(seq, hidden, true), marks: 1 };
    });
  },
};
