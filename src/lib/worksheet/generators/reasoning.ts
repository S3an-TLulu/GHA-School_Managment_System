import { Generator, Problem, str } from '../types';
import { gradeTier } from '../grades';
import { answerBox } from '../svg';

export const explainCompare: Generator = {
  id: 'explain-compare',
  label: 'Explain your reasoning',
  category: 'reasoning',
  description: 'Explain why one number is bigger or smaller than another.',
  settings: [],
  defaults: {},
  generate({ grade, count, rng }): Problem[] {
    const cap = gradeTier(grade).max;
    return Array.from({ length: count }, () => {
      const a = rng.int(Math.floor(cap / 10), cap);
      let b = rng.int(Math.floor(cap / 10), cap); if (b === a) b = a + rng.int(1, 9);
      const bigger = Math.max(a, b), smaller = Math.min(a, b);
      return {
        questionHtml: `Explain why <b>${bigger}</b> is larger than <b>${smaller}</b>.${answerBox('medium')}`,
        answerHtml: `${bigger} has a larger value than ${smaller} — compare the digits from the highest place value.`,
        marks: 2,
      };
    });
  },
};

export const showWorking: Generator = {
  id: 'show-working',
  label: 'Show your working',
  category: 'reasoning',
  description: 'A calculation with a large box to show all steps.',
  settings: [
    { key: 'operation', label: 'Operation', type: 'select', options: [
      { value: 'add', label: 'Addition' }, { value: 'sub', label: 'Subtraction' },
      { value: 'mul', label: 'Multiplication' } ] },
  ],
  defaults: { operation: 'add' },
  generate({ settings, grade, count, rng }): Problem[] {
    const op = str(settings, 'operation', 'add');
    const cap = gradeTier(grade).max;
    return Array.from({ length: count }, () => {
      let a: number, b: number, ans: number, sym: string;
      if (op === 'mul') { a = rng.int(11, 99); b = rng.int(2, 12); ans = a * b; sym = '×'; }
      else if (op === 'sub') { a = rng.int(Math.floor(cap / 2), cap); b = rng.int(1, a); ans = a - b; sym = '−'; }
      else { a = rng.int(1, cap); b = rng.int(1, cap); ans = a + b; sym = '+'; }
      return {
        questionHtml: `Work out <b>${a} ${sym} ${b}</b>. Show all your working.${answerBox('large')}`,
        answerHtml: `${a} ${sym} ${b} = <b>${ans}</b>`,
        marks: 2, bankQuestion: `Work out ${a} ${sym} ${b}. Show your working.`, bankAnswer: String(ans),
      };
    });
  },
};

export const trueFalseMaths: Generator = {
  id: 'true-false-maths',
  label: 'True or false',
  category: 'reasoning',
  description: 'Decide whether a number statement is true or false.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ grade, count, rng }): Problem[] {
    const cap = gradeTier(grade).max;
    return Array.from({ length: count }, () => {
      const a = rng.int(1, cap), b = rng.int(1, cap);
      const trueStmt = rng.bool();
      const sym = a > b ? '>' : a < b ? '<' : '=';
      const shownSym = trueStmt ? sym : rng.pick(['>', '<', '='].filter(s => s !== sym));
      const q = `${a} ${shownSym} ${b} — true or false?`;
      const correct = shownSym === sym ? 'True' : 'False';
      return { questionHtml: `<span style="font-size:16px">${q}</span>`, answerHtml: `<span style="font-size:16px">${a} ${shownSym} ${b} — <b>${correct}</b></span>`, marks: 1, bankQuestion: q, bankAnswer: correct };
    });
  },
};
