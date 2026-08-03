import { Generator, Problem } from '../types';
import { gradeTier } from '../grades';
import { RNG } from '../rng';

const NAMES = ['Chipo', 'Mwansa', 'Bupe', 'Mutale', 'Kunda', 'Temba', 'Luyando', 'Chanda', 'Bwalya', 'Natasha'];
const ITEMS = ['oranges', 'mangoes', 'books', 'pencils', 'sweets', 'chickens', 'bananas', 'exercise books'];

// Scale operand size to the grade so wording stays age-appropriate.
function scale(grade: string, rng: RNG, small = false): number {
  const cap = Math.min(gradeTier(grade).max, small ? 20 : 500);
  return rng.int(2, Math.max(3, cap));
}

export const wordProblems: Generator = {
  id: 'word-problems',
  label: 'Word problems',
  category: 'wordProblems',
  description: 'Story problems with local names and Kwacha, scaled by grade.',
  settings: [
    { key: 'ops', label: 'Operations', type: 'multiselect', options: [
      { value: 'add', label: 'Addition' }, { value: 'sub', label: 'Subtraction' },
      { value: 'mul', label: 'Multiplication' }, { value: 'div', label: 'Division' },
      { value: 'money', label: 'Money' } ] },
    { key: 'workingSpace', label: 'Show working space', type: 'toggle' },
  ],
  defaults: { ops: ['add', 'sub'], workingSpace: true },
  generate({ settings, grade, count, rng }): Problem[] {
    const ops = (Array.isArray(settings.ops) && settings.ops.length ? settings.ops : ['add', 'sub']).map(String);
    const working = settings.workingSpace !== false;
    const workBox = working ? '<div style="border:1px solid #94a3b8;border-radius:4px;height:70px;margin-top:6px"></div>' : '';
    return Array.from({ length: count }, () => {
      const op = rng.pick(ops);
      const name = rng.pick(NAMES), name2 = rng.pick(NAMES.filter(n => n !== NAMES[0]));
      const item = rng.pick(ITEMS);
      let text = '', ans = '';
      if (op === 'add') {
        const a = scale(grade, rng), b = scale(grade, rng);
        text = `${name} has ${a} ${item}. ${name2} gives ${name} ${b} more. How many ${item} does ${name} have altogether?`;
        ans = `${a + b} ${item}`;
      } else if (op === 'sub') {
        let a = scale(grade, rng), b = scale(grade, rng); if (b > a) [a, b] = [b, a];
        text = `${name} had ${a} ${item}. ${name} gave away ${b}. How many ${item} are left?`;
        ans = `${a - b} ${item}`;
      } else if (op === 'mul') {
        const a = rng.int(2, 9), b = scale(grade, rng, true);
        text = `There are ${a} baskets with ${b} ${item} in each. How many ${item} are there in total?`;
        ans = `${a * b} ${item}`;
      } else if (op === 'div') {
        const b = rng.int(2, 9), q = scale(grade, rng, true);
        text = `${name} shares ${b * q} ${item} equally among ${b} friends. How many ${item} does each friend get?`;
        ans = `${q} ${item}`;
      } else {
        const a = scale(grade, rng), b = scale(grade, rng);
        if (rng.bool()) {
          text = `${name} buys ${item} for K${a} and a drink for K${b}. How much does ${name} spend in total?`;
          ans = `K${a + b}`;
        } else {
          const paid = a + b, cost = a;
          text = `${name} pays K${paid} for an item costing K${cost}. How much change does ${name} get?`;
          ans = `K${paid - cost}`;
        }
      }
      return { questionHtml: `${text}${workBox}`, answerHtml: `<b>${ans}</b>`, marks: 2 };
    });
  },
};
