import { Generator, Problem, num, str, bool } from '../types';
import { gradeTier } from '../grades';
import { RNG } from '../rng';

// ---- Vertical column arithmetic (+ − × ÷) ----

const OP_CHAR: Record<string, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

// Right-aligned monospace stack: operands, a rule, then answer space.
function stackHtml(a: number, b: number, op: string, answer: string): string {
  const w = Math.max(String(a).length, String(b).length) + 1;
  const pad = (s: string) => s.padStart(w, ' ');
  const line = (prefix: string, n: string) => `${prefix} ${pad(n)}`;
  return `<div style="font-family:'Courier New',monospace;font-size:20px;white-space:pre;display:inline-block;line-height:1.35">` +
    `<div>${line(' ', String(a))}</div>` +
    `<div>${line(OP_CHAR[op], String(b))}</div>` +
    `<div style="border-top:2px solid #111;min-height:26px">${answer ? line(' ', answer) : ''}</div>` +
    `</div>`;
}

// Long-division bracket:  divisor ) dividend  with a rule for the quotient.
function divisionHtml(dividend: number, divisor: number, quotient: string): string {
  return `<div style="font-family:'Courier New',monospace;font-size:20px;display:inline-block;line-height:1.35">` +
    `<div style="margin-left:${String(divisor).length + 2}ch;border-bottom:2px solid #111;min-height:24px;min-width:${String(dividend).length + 1}ch">${quotient}</div>` +
    `<div>${divisor}&#160;)&#160;${dividend}</div>` +
    `</div>`;
}

function operands(op: string, digits: number, carrying: boolean, difficulty: string, rng: RNG): [number, number, number] {
  const lo = digits <= 1 ? 0 : Math.pow(10, digits - 1);
  const hi = Math.pow(10, digits) - 1;
  const rnd = () => rng.int(Math.max(lo, digits <= 1 ? 1 : lo), hi);
  if (op === 'add') {
    if (!carrying) {
      // build digit-by-digit so no column exceeds 9
      let a = '', b = '';
      for (let i = 0; i < digits; i++) {
        const da = rng.int(i === digits - 1 ? 1 : 0, 9);
        const db = rng.int(0, 9 - da);
        a += da; b += db;
      }
      const A = parseInt(a), B = parseInt(b);
      return [A, B, A + B];
    }
    const A = rnd(), B = rnd();
    return [A, B, A + B];
  }
  if (op === 'sub') {
    let A = rnd(), B = rnd();
    if (B > A) [A, B] = [B, A];
    if (!carrying) {
      // ensure each top digit >= bottom digit (no borrowing)
      const as = String(A).padStart(digits, '0').split('').map(Number);
      const bs = String(B).padStart(digits, '0').split('').map(Number);
      for (let i = 0; i < digits; i++) if (bs[i] > as[i]) bs[i] = rng.int(0, as[i]);
      B = parseInt(bs.join('')) || 0;
    }
    return [A, B, A - B];
  }
  if (op === 'mul') {
    const A = rnd();
    const B = difficulty === 'hard' ? rng.int(2, 99) : difficulty === 'medium' ? rng.int(2, 12) : rng.int(2, 9);
    return [A, B, A * B];
  }
  // div — exact division
  const divisor = difficulty === 'hard' ? rng.int(3, 12) : rng.int(2, 9);
  const quotient = rng.int(Math.max(2, Math.pow(10, digits - 1)), Math.pow(10, digits) - 1);
  return [divisor * quotient, divisor, quotient];
}

export const verticalArithmetic: Generator = {
  id: 'vertical-arithmetic',
  label: 'Column arithmetic (+ − × ÷)',
  category: 'arithmetic',
  description: 'Vertical sums with digits, carrying and difficulty controls.',
  settings: [
    { key: 'operation', label: 'Operation', type: 'select', options: [
      { value: 'add', label: 'Addition' }, { value: 'sub', label: 'Subtraction' },
      { value: 'mul', label: 'Multiplication' }, { value: 'div', label: 'Division' } ] },
    { key: 'digits', label: 'Digits', type: 'number', min: 1, max: 6 },
    { key: 'carrying', label: 'Allow carrying / borrowing', type: 'toggle', help: 'Addition & subtraction only' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: [
      { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' } ] },
  ],
  defaults: { operation: 'add', digits: 0, carrying: true, difficulty: 'easy' },
  generate({ settings, grade, count, rng }): Problem[] {
    const op = str(settings, 'operation', 'add');
    const digits = num(settings, 'digits', 0) || gradeTier(grade).digits;
    const carrying = bool(settings, 'carrying', true);
    const difficulty = str(settings, 'difficulty', 'easy');
    return Array.from({ length: count }, () => {
      const [a, b, ans] = operands(op, digits, carrying, difficulty, rng);
      const questionHtml = op === 'div' ? divisionHtml(a, b, '') : stackHtml(a, b, op, '');
      const answerHtml = op === 'div' ? divisionHtml(a, b, String(ans)) : stackHtml(a, b, op, String(ans));
      return { questionHtml, answerHtml, marks: 1 };
    });
  },
};

// ---- Mental maths (horizontal quick calculations) ----

export const mentalMaths: Generator = {
  id: 'mental-maths',
  label: 'Mental maths',
  category: 'arithmetic',
  description: 'Quick horizontal calculations across chosen operations.',
  settings: [
    { key: 'ops', label: 'Operations', type: 'multiselect', options: [
      { value: 'add', label: '+' }, { value: 'sub', label: '−' },
      { value: 'mul', label: '×' }, { value: 'div', label: '÷' } ] },
  ],
  defaults: { ops: ['add', 'sub'] },
  generate({ settings, grade, count, rng }): Problem[] {
    const tier = gradeTier(grade);
    const ops = (Array.isArray(settings.ops) && settings.ops.length ? settings.ops : ['add', 'sub']).map(String);
    return Array.from({ length: count }, () => {
      const op = rng.pick(ops);
      let a: number, b: number, ans: number;
      if (op === 'mul') { a = rng.int(2, tier.tables); b = rng.int(2, 12); ans = a * b; }
      else if (op === 'div') { b = rng.int(2, 9); ans = rng.int(2, 12); a = b * ans; }
      else if (op === 'sub') { a = rng.int(1, tier.max); b = rng.int(0, a); ans = a - b; }
      else { a = rng.int(1, tier.max); b = rng.int(1, tier.max); ans = a + b; }
      const expr = `${a} ${OP_CHAR[op]} ${b} =`;
      return {
        questionHtml: `<span style="font-size:16px">${expr} <span style="display:inline-block;border-bottom:1px solid #111;min-width:48px"></span></span>`,
        answerHtml: `<span style="font-size:16px">${expr} <b>${ans}</b></span>`,
        marks: 1,
      };
    });
  },
};

// ---- Multiplication tables ----

export const timesTables: Generator = {
  id: 'times-tables',
  label: 'Multiplication tables',
  category: 'arithmetic',
  description: 'Random times-table practice with fill-in answers.',
  settings: [
    { key: 'table', label: 'Table (0 = mixed)', type: 'number', min: 0, max: 12 },
  ],
  defaults: { table: 0 },
  generate({ settings, grade, count, rng }): Problem[] {
    const tier = gradeTier(grade);
    const fixed = num(settings, 'table', 0);
    return Array.from({ length: count }, () => {
      const a = fixed > 0 ? fixed : rng.int(2, tier.tables);
      const b = rng.int(1, 12);
      return {
        questionHtml: `<span style="font-size:16px">${a} × ${b} = <span style="display:inline-block;border-bottom:1px solid #111;min-width:44px"></span></span>`,
        answerHtml: `<span style="font-size:16px">${a} × ${b} = <b>${a * b}</b></span>`,
        marks: 1,
      };
    });
  },
};
