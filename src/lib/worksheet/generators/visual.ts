import { Generator, Problem, str, num } from '../types';
import { gradeTier } from '../grades';
import { numberLine, analogueClock, baseTenBlocks, fractionShape, pictureRow, answerLines } from '../svg';

export const numberLineGen: Generator = {
  id: 'number-line',
  label: 'Number line',
  category: 'visual',
  description: 'Fill the missing numbers on a number line.',
  settings: [
    { key: 'step', label: 'Interval', type: 'select', options: [1, 2, 5, 10, 25, 100].map(v => ({ value: String(v), label: String(v) })) },
    { key: 'ticks', label: 'Ticks', type: 'number', min: 5, max: 11 },
  ],
  defaults: { step: '2', ticks: 7 },
  generate({ settings, grade, count, rng }): Problem[] {
    const step = num(settings, 'step', 2);
    const ticks = num(settings, 'ticks', 7);
    return Array.from({ length: count }, () => {
      const start = step * rng.int(0, Math.max(1, Math.floor(gradeTier(grade).max / step / 2)));
      const full = Array.from({ length: ticks }, (_, i) => start + i * step);
      const hide = new Set<number>();
      while (hide.size < Math.max(2, Math.floor(ticks / 3))) hide.add(rng.int(1, ticks - 1));
      const q = full.map((v, i) => (hide.has(i) ? null : v));
      return {
        questionHtml: `Fill in the missing numbers.<br>${numberLine(q)}`,
        answerHtml: numberLine(full),
        marks: 1,
      };
    });
  },
};

export const clockGen: Generator = {
  id: 'clock',
  label: 'Clock (tell the time)',
  category: 'visual',
  description: 'Read an analogue clock, or draw the hands.',
  settings: [
    { key: 'mode', label: 'Task', type: 'select', options: [
      { value: 'read', label: 'What time is shown?' }, { value: 'draw', label: 'Draw the hands' } ] },
    { key: 'precision', label: 'Minutes', type: 'select', options: [
      { value: '60', label: "O'clock only" }, { value: '30', label: 'Half past' }, { value: '15', label: 'Quarters' }, { value: '5', label: '5 minutes' } ] },
  ],
  defaults: { mode: 'read', precision: '30' },
  generate({ settings, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'read');
    const precision = num(settings, 'precision', 30);
    const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;
    return Array.from({ length: count }, () => {
      const h = rng.int(1, 12);
      const m = precision >= 60 ? 0 : rng.int(0, Math.floor(59 / precision)) * precision;
      if (mode === 'draw') {
        return {
          questionHtml: `Draw the hands to show <b>${fmt(h, m)}</b>.<br>${analogueClock(h, m, { blank: true })}`,
          answerHtml: analogueClock(h, m),
          marks: 1,
        };
      }
      return {
        questionHtml: `What time is shown?<br>${analogueClock(h, m)}${answerLines(1)}`,
        answerHtml: `<b>${fmt(h, m)}</b>`,
        marks: 1,
      };
    });
  },
};

export const baseTenGen: Generator = {
  id: 'base-ten',
  label: 'Base-ten blocks',
  category: 'visual',
  description: 'Write the number shown by hundreds / tens / ones blocks.',
  settings: [
    { key: 'maxHundreds', label: 'Max hundreds', type: 'number', min: 0, max: 9 },
  ],
  defaults: { maxHundreds: 3 },
  generate({ settings, count, rng }): Problem[] {
    const maxH = num(settings, 'maxHundreds', 3);
    return Array.from({ length: count }, () => {
      const n = rng.int(maxH > 0 ? 10 : 1, maxH * 100 + 99);
      return {
        questionHtml: `Write the number shown.<br>${baseTenBlocks(n)}${answerLines(1)}`,
        answerHtml: `<b>${n}</b>`,
        marks: 1,
      };
    });
  },
};

export const fractionsGen: Generator = {
  id: 'fractions',
  label: 'Fractions',
  category: 'visual',
  description: 'Shade or identify a fraction of a shape.',
  settings: [
    { key: 'mode', label: 'Task', type: 'select', options: [
      { value: 'identify', label: 'Write the fraction shown' }, { value: 'shade', label: 'Shade the fraction' } ] },
    { key: 'shape', label: 'Shape', type: 'select', options: [
      { value: 'bar', label: 'Bar' }, { value: 'circle', label: 'Circle' } ] },
  ],
  defaults: { mode: 'identify', shape: 'bar' },
  generate({ settings, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'identify');
    const shape = str(settings, 'shape', 'bar') as 'bar' | 'circle';
    return Array.from({ length: count }, () => {
      const den = rng.int(2, 8);
      const numr = rng.int(1, den - 1);
      const frac = `<b>${numr}/${den}</b>`;
      if (mode === 'shade') {
        return {
          questionHtml: `Shade ${frac} of the shape.<br>${fractionShape(numr, den, shape, false)}`,
          answerHtml: fractionShape(numr, den, shape, true),
          marks: 1,
        };
      }
      return {
        questionHtml: `Write the fraction that is shaded.<br>${fractionShape(numr, den, shape, true)}${answerLines(1)}`,
        answerHtml: frac,
        marks: 1,
      };
    });
  },
};

export const pictureCountingGen: Generator = {
  id: 'picture-counting',
  label: 'Picture counting',
  category: 'visual',
  description: 'Count the pictures and write how many.',
  settings: [
    { key: 'max', label: 'Max count', type: 'number', min: 3, max: 20 },
  ],
  defaults: { max: 10 },
  generate({ settings, count, rng }): Problem[] {
    const max = num(settings, 'max', 10);
    const emojis = ['🍎', '🍌', '⭐', '🐟', '🌸', '🚗', '⚽', '🍊'];
    const names: Record<string, string> = { '🍎': 'apples', '🍌': 'bananas', '⭐': 'stars', '🐟': 'fish', '🌸': 'flowers', '🚗': 'cars', '⚽': 'balls', '🍊': 'oranges' };
    return Array.from({ length: count }, () => {
      const e = rng.pick(emojis);
      const n = rng.int(3, max);
      return {
        questionHtml: `${pictureRow(e, n)}How many ${names[e]}?${answerLines(1)}`,
        answerHtml: `<b>${n}</b>`,
        marks: 1,
      };
    });
  },
};
