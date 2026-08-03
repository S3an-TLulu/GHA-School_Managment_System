import { Generator, Problem, str, num } from '../types';
import { gradeTier } from '../grades';
import { answerLines } from '../svg';
import { RNG } from '../rng';

const range = (grade: string, rng: RNG) => rng.int(Math.max(1, Math.floor(gradeTier(grade).max / 10)), gradeTier(grade).max);
const box = '<span style="display:inline-block;border:1px solid #111;width:26px;height:26px;vertical-align:middle;margin:0 6px"></span>';

export const compareNumbers: Generator = {
  id: 'compare-numbers',
  label: 'Compare numbers (> < =)',
  category: 'numberSense',
  description: 'Fill in the correct comparison symbol.',
  settings: [],
  defaults: {},
  generate({ grade, count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const a = range(grade, rng);
      const b = rng.bool(0.2) ? a : range(grade, rng);
      const sym = a > b ? '>' : a < b ? '<' : '=';
      return {
        questionHtml: `<span style="font-size:18px">${a} ${box} ${b}</span>`,
        answerHtml: `<span style="font-size:18px">${a} <b>${sym}</b> ${b}</span>`,
        marks: 1,
      };
    });
  },
};

export const orderNumbers: Generator = {
  id: 'order-numbers',
  label: 'Order & compare a set',
  category: 'numberSense',
  description: 'Ascending / descending order, or largest / smallest.',
  settings: [
    { key: 'mode', label: 'Task', type: 'select', options: [
      { value: 'asc', label: 'Ascending order' }, { value: 'desc', label: 'Descending order' },
      { value: 'largest', label: 'Largest number' }, { value: 'smallest', label: 'Smallest number' } ] },
    { key: 'howMany', label: 'Numbers per question', type: 'number', min: 3, max: 6 },
  ],
  defaults: { mode: 'asc', howMany: 4 },
  generate({ settings, grade, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'asc');
    const howMany = num(settings, 'howMany', 4);
    return Array.from({ length: count }, () => {
      const set: number[] = [];
      while (set.length < howMany) { const v = range(grade, rng); if (!set.includes(v)) set.push(v); }
      const sorted = [...set].sort((x, y) => x - y);
      let prompt = '', answer = '';
      if (mode === 'asc') { prompt = 'Write in ascending order.'; answer = sorted.join(', '); }
      else if (mode === 'desc') { prompt = 'Write in descending order.'; answer = [...sorted].reverse().join(', '); }
      else if (mode === 'largest') { prompt = 'Circle the largest number.'; answer = String(sorted[sorted.length - 1]); }
      else { prompt = 'Circle the smallest number.'; answer = String(sorted[0]); }
      return {
        questionHtml: `${prompt}<br><span style="font-size:17px;letter-spacing:1px">${set.join('&nbsp;&nbsp;&nbsp;')}</span>${mode === 'asc' || mode === 'desc' ? answerLines(1) : ''}`,
        answerHtml: `<b>${answer}</b>`,
        marks: 1,
      };
    });
  },
};

export const roundingNumbers: Generator = {
  id: 'rounding',
  label: 'Rounding numbers',
  category: 'numberSense',
  description: 'Round to the nearest 10, 100 or 1000.',
  settings: [
    { key: 'nearest', label: 'Round to nearest', type: 'select', options: [
      { value: '10', label: '10' }, { value: '100', label: '100' }, { value: '1000', label: '1000' } ] },
  ],
  defaults: { nearest: '10' },
  generate({ settings, grade, count, rng }): Problem[] {
    const nearest = num(settings, 'nearest', 10);
    return Array.from({ length: count }, () => {
      const n = rng.int(nearest, Math.max(nearest * 10, gradeTier(grade).max));
      const rounded = Math.round(n / nearest) * nearest;
      return {
        questionHtml: `Round <b>${n}</b> to the nearest ${nearest}.${answerLines(1)}`,
        answerHtml: `${n} → <b>${rounded}</b>`,
        marks: 1,
      };
    });
  },
};

export const beforeAfterBetween: Generator = {
  id: 'before-after-between',
  label: 'Before, after & between',
  category: 'counting',
  description: 'Fill the number before, after or between.',
  settings: [
    { key: 'mode', label: 'Task', type: 'select', options: [
      { value: 'before', label: 'Number before' }, { value: 'after', label: 'Number after' },
      { value: 'between', label: 'Number between' }, { value: 'both', label: 'Before and after' } ] },
  ],
  defaults: { mode: 'both' },
  generate({ settings, grade, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'both');
    const blank = '<span style="display:inline-block;border-bottom:1px solid #111;min-width:60px">&nbsp;</span>';
    return Array.from({ length: count }, () => {
      const n = rng.int(2, gradeTier(grade).max);
      if (mode === 'before') return { questionHtml: `<span style="font-size:18px">${blank} ${n}</span>`, answerHtml: `<span style="font-size:18px"><b>${n - 1}</b> ${n}</span>`, marks: 1 };
      if (mode === 'after') return { questionHtml: `<span style="font-size:18px">${n} ${blank}</span>`, answerHtml: `<span style="font-size:18px">${n} <b>${n + 1}</b></span>`, marks: 1 };
      if (mode === 'between') return { questionHtml: `<span style="font-size:18px">${n} ${blank} ${n + 2}</span>`, answerHtml: `<span style="font-size:18px">${n} <b>${n + 1}</b> ${n + 2}</span>`, marks: 1 };
      return { questionHtml: `<span style="font-size:18px">${blank} ${n} ${blank}</span>`, answerHtml: `<span style="font-size:18px"><b>${n - 1}</b> ${n} <b>${n + 1}</b></span>`, marks: 1 };
    });
  },
};

export const oddEven: Generator = {
  id: 'odd-even',
  label: 'Odd & even numbers',
  category: 'numberSense',
  description: 'Circle the even, or tick the odd, numbers.',
  settings: [
    { key: 'target', label: 'Find', type: 'select', options: [
      { value: 'even', label: 'Even numbers' }, { value: 'odd', label: 'Odd numbers' } ] },
    { key: 'howMany', label: 'Numbers per question', type: 'number', min: 4, max: 10 },
  ],
  defaults: { target: 'even', howMany: 6 },
  generate({ settings, grade, count, rng }): Problem[] {
    const target = str(settings, 'target', 'even');
    const howMany = num(settings, 'howMany', 6);
    return Array.from({ length: count }, () => {
      const set = Array.from({ length: howMany }, () => rng.int(1, Math.min(999, gradeTier(grade).max)));
      const hits = set.filter(v => (target === 'even' ? v % 2 === 0 : v % 2 === 1));
      return {
        questionHtml: `${target === 'even' ? 'Circle' : 'Tick'} all the <b>${target}</b> numbers.<br><span style="font-size:17px;letter-spacing:2px">${set.join('&nbsp;&nbsp;&nbsp;')}</span>`,
        answerHtml: `<b>${hits.join(', ') || 'none'}</b>`,
        marks: 1,
      };
    });
  },
};
