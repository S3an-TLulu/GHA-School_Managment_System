import { Generator, Problem, str, num } from '../types';
import { gradeTier } from '../grades';
import { numToWords, capitalise } from '../num2words';
import { answerLines } from '../svg';
import { RNG } from '../rng';

const PLACES = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten Thousands', 'Hundred Thousands', 'Millions'];

// Pick a number whose digit-length suits the grade (min 2 digits so place-value
// questions make sense).
function pickNumber(grade: string, rng: RNG): number {
  const maxDigits = Math.min(7, String(gradeTier(grade).max).length);
  const digits = Math.max(2, Math.min(maxDigits, rng.int(2, maxDigits)));
  const lo = Math.pow(10, digits - 1), hi = Math.pow(10, digits) - 1;
  return rng.int(lo, hi);
}

const spaced = (n: number) => String(n).split('').join(' ');

export const placeValueDigit: Generator = {
  id: 'place-value-digit',
  label: 'Place value of a digit',
  category: 'numberSense',
  description: 'Value / place of a digit, or which digit sits in a place.',
  settings: [
    { key: 'mode', label: 'Question style', type: 'select', options: [
      { value: 'value', label: 'Value of the digit' },
      { value: 'place', label: 'Place of the underlined digit' },
      { value: 'which', label: 'Which digit is in a place' } ] },
  ],
  defaults: { mode: 'value' },
  generate({ settings, grade, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'value');
    return Array.from({ length: count }, () => {
      const n = pickNumber(grade, rng);
      const digitsArr = String(n).split('').map(Number);
      const len = digitsArr.length;
      const posFromLeft = rng.int(0, len - 1);
      const posFromRight = len - 1 - posFromLeft;
      const digit = digitsArr[posFromLeft];
      const placeName = PLACES[posFromRight];
      if (mode === 'place') {
        const underlined = String(n).split('').map((c, i) =>
          i === posFromLeft ? `<u>${c}</u>` : c).join(' ');
        return {
          questionHtml: `Write the place value of the underlined digit.<br><span style="font-size:20px;letter-spacing:2px">${underlined}</span>${answerLines(1)}`,
          answerHtml: `${underlined} → <b>${placeName}</b>`,
          marks: 1,
        };
      }
      if (mode === 'which') {
        return {
          questionHtml: `Which digit is in the <b>${placeName}</b> place?<br><span style="font-size:20px;letter-spacing:2px">${spaced(n)}</span>${answerLines(1)}`,
          answerHtml: `${spaced(n)} → <b>${digit}</b>`,
          marks: 1,
        };
      }
      const value = digit * Math.pow(10, posFromRight);
      return {
        questionHtml: `Write the value of the digit <b>${digit}</b>.<br><span style="font-size:20px;letter-spacing:2px">${spaced(n)}</span>${answerLines(1)}`,
        answerHtml: `${spaced(n)} → <b>${value}</b>`,
        marks: 1,
      };
    });
  },
};

export const expandedForm: Generator = {
  id: 'expanded-form',
  label: 'Expanded form',
  category: 'numberSense',
  description: 'Write a number in expanded form, or read it back.',
  settings: [
    { key: 'direction', label: 'Direction', type: 'select', options: [
      { value: 'expand', label: 'Number → expanded' },
      { value: 'contract', label: 'Expanded → number' } ] },
  ],
  defaults: { direction: 'expand' },
  generate({ settings, grade, count, rng }): Problem[] {
    const direction = str(settings, 'direction', 'expand');
    return Array.from({ length: count }, () => {
      const n = pickNumber(grade, rng);
      const parts = String(n).split('').map((c, i, arr) => Number(c) * Math.pow(10, arr.length - 1 - i)).filter(v => v > 0);
      const expanded = parts.join(' + ');
      if (direction === 'contract') {
        return {
          questionHtml: `Write the number.<br><span style="font-size:16px">${expanded}</span>${answerLines(1)}`,
          answerHtml: `${expanded} = <b>${n}</b>`,
          marks: 1,
        };
      }
      return {
        questionHtml: `Write in expanded form.<br><span style="font-size:20px">${n}</span>${answerLines(1)}`,
        answerHtml: `${n} = <b>${expanded}</b>`,
        marks: 1,
      };
    });
  },
};

export const numberRepresentation: Generator = {
  id: 'number-representation',
  label: 'Numbers in words & figures',
  category: 'numberSense',
  description: 'Convert between figures and words.',
  settings: [
    { key: 'direction', label: 'Direction', type: 'select', options: [
      { value: 'figures', label: 'Words → figures' },
      { value: 'words', label: 'Figures → words' } ] },
  ],
  defaults: { direction: 'figures' },
  generate({ settings, grade, count, rng }): Problem[] {
    const direction = str(settings, 'direction', 'figures');
    return Array.from({ length: count }, () => {
      const n = pickNumber(grade, rng);
      const words = capitalise(numToWords(n));
      if (direction === 'words') {
        return {
          questionHtml: `Write in words.<br><span style="font-size:20px">${n}</span>${answerLines(2)}`,
          answerHtml: `${n} → <b>${words}</b>`,
          marks: 1,
        };
      }
      return {
        questionHtml: `Write in figures.<br><span style="font-size:16px">${words}</span>${answerLines(1)}`,
        answerHtml: `${words} → <b>${n}</b>`,
        marks: 1,
      };
    });
  },
};

export const placeValueTable: Generator = {
  id: 'place-value-table',
  label: 'Place value table',
  category: 'numberSense',
  description: 'Fill the table, complete a missing place, or write the number.',
  settings: [
    { key: 'mode', label: 'Question style', type: 'select', options: [
      { value: 'fill', label: 'Fill the table from a number' },
      { value: 'missing', label: 'Complete the missing place' },
      { value: 'read', label: 'Write the number shown' } ] },
  ],
  defaults: { mode: 'fill' },
  generate({ settings, grade, count, rng }): Problem[] {
    const mode = str(settings, 'mode', 'fill');
    return Array.from({ length: count }, () => {
      const n = pickNumber(grade, rng);
      const digits = String(n).split('').map(Number);
      const len = digits.length;
      const heads = digits.map((_, i) => ['O', 'T', 'H', 'TH', 'TTH', 'HTH', 'M'][len - 1 - i]);
      const table = (cells: string[]) => `<table style="border-collapse:collapse;margin-top:6px">
        <tr>${heads.map(h => `<th style="border:1px solid #111;padding:4px 12px;font-size:12px">${h}</th>`).join('')}</tr>
        <tr>${cells.map(c => `<td style="border:1px solid #111;padding:6px 12px;text-align:center;font-size:16px;min-width:24px">${c}</td>`).join('')}</tr>
      </table>`;
      if (mode === 'read') {
        return {
          questionHtml: `Write the number shown in the table.${table(digits.map(String))}${answerLines(1)}`,
          answerHtml: `<b>${n}</b>`,
          marks: 1,
        };
      }
      if (mode === 'missing') {
        const hide = rng.int(0, len - 1);
        return {
          questionHtml: `Fill in the missing digit.${table(digits.map((d, i) => i === hide ? '___' : String(d)))}`,
          answerHtml: `Missing ${heads[hide]}: <b>${digits[hide]}</b> (number ${n})`,
          marks: 1,
        };
      }
      return {
        questionHtml: `Fill the place value table for <b>${n}</b>.${table(digits.map(() => ''))}`,
        answerHtml: table(digits.map(String)),
        marks: 1,
      };
    });
  },
};
