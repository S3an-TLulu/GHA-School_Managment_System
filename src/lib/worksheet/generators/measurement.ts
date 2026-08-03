import { Generator, Problem, str, num } from '../types';
import { gradeTier } from '../grades';
import { answerLines } from '../svg';
import { RNG } from '../rng';

// ---- Unit conversion ----
type UnitFamily = { name: string; units: { u: string; per: number }[] };
const FAMILIES: Record<string, UnitFamily> = {
  length: { name: 'length', units: [{ u: 'cm', per: 1 }, { u: 'm', per: 100 }, { u: 'km', per: 100000 }] },
  mass: { name: 'mass', units: [{ u: 'g', per: 1 }, { u: 'kg', per: 1000 }] },
  capacity: { name: 'capacity', units: [{ u: 'ml', per: 1 }, { u: 'L', per: 1000 }] },
};

export const measurementConvert: Generator = {
  id: 'measurement-convert',
  label: 'Unit conversion',
  category: 'measurement',
  description: 'Convert between metric units of length, mass or capacity.',
  bankable: true,
  settings: [
    { key: 'family', label: 'Measure', type: 'select', options: [
      { value: 'length', label: 'Length' }, { value: 'mass', label: 'Mass' }, { value: 'capacity', label: 'Capacity' } ] },
  ],
  defaults: { family: 'length' },
  generate({ settings, grade, count, rng }): Problem[] {
    const fam = FAMILIES[str(settings, 'family', 'length')] || FAMILIES.length;
    const big = gradeTier(grade).max >= 1000;
    return Array.from({ length: count }, () => {
      // convert from a larger unit down to the base, keeping whole numbers
      const from = big ? fam.units[fam.units.length - 1] : fam.units[1];
      const to = fam.units[0];
      const val = rng.int(1, 9) * (big ? rng.int(1, 9) : 1);
      const ans = val * (from.per / to.per);
      const q = `${val} ${from.u} = ______ ${to.u}`;
      return { questionHtml: `<span style="font-size:16px">${q}</span>`, answerHtml: `<span style="font-size:16px">${val} ${from.u} = <b>${ans} ${to.u}</b></span>`, marks: 1, bankQuestion: q, bankAnswer: `${ans} ${to.u}` };
    });
  },
};

// ---- Money (Kwacha): totals & change ----
export const money: Generator = {
  id: 'money',
  label: 'Money (Kwacha)',
  category: 'measurement',
  description: 'Add up money or work out change, in Kwacha.',
  bankable: true,
  settings: [
    { key: 'mode', label: 'Task', type: 'select', options: [
      { value: 'total', label: 'Add up the money' }, { value: 'change', label: 'Work out the change' } ] },
  ],
  defaults: { mode: 'total' },
  generate({ settings, grade, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'total');
    const cap = Math.min(500, gradeTier(grade).max);
    return Array.from({ length: count }, () => {
      if (mode === 'change') {
        const cost = rng.int(2, cap);
        const paid = cost + rng.int(1, cap);
        const q = `An item costs K${cost}. You pay K${paid}. How much change do you get?`;
        return { questionHtml: q + answerLines(1), answerHtml: `${q} <b>K${paid - cost}</b>`, marks: 1, bankQuestion: q, bankAnswer: `K${paid - cost}` };
      }
      const notes = Array.from({ length: rng.int(2, 4) }, () => rng.pick([1, 2, 5, 10, 20, 50, 100]));
      const q = `Add up the money: ${notes.map(n => `K${n}`).join(' + ')} = ______`;
      return { questionHtml: `<span style="font-size:15px">${q}</span>`, answerHtml: `<span style="font-size:15px">${notes.map(n => `K${n}`).join(' + ')} = <b>K${notes.reduce((a, b) => a + b, 0)}</b></span>`, marks: 1, bankQuestion: q, bankAnswer: `K${notes.reduce((a, b) => a + b, 0)}` };
    });
  },
};

// ---- Elapsed time ----
const fmt = (h: number, m: number) => `${((h - 1) % 12) + 1}:${String(m).padStart(2, '0')}`;
export const timeWord: Generator = {
  id: 'time-word',
  label: 'Time word problems',
  category: 'measurement',
  description: 'Work out finishing times and elapsed time.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    const acts = ['A lesson', 'The assembly', 'Break time', 'The test', 'The film', 'Sports practice'];
    return Array.from({ length: count }, () => {
      const startH = rng.int(7, 15), startM = rng.pick([0, 15, 30, 45]);
      const dur = rng.pick([10, 15, 20, 30, 40, 45, 60]);
      const total = startH * 60 + startM + dur;
      const eh = Math.floor(total / 60), em = total % 60;
      const q = `${rng.pick(acts)} starts at ${fmt(startH, startM)} and lasts ${dur} minutes. What time does it end?`;
      return { questionHtml: q + answerLines(1), answerHtml: `${q} <b>${fmt(eh, em)}</b>`, marks: 1, bankQuestion: q, bankAnswer: fmt(eh, em) };
    });
  },
};
