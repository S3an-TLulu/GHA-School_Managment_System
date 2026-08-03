import { Generator, Problem } from '../types';
import { answerLines } from '../svg';

const WORDS = ['cat', 'dog', 'sun', 'book', 'tree', 'house', 'water', 'friend', 'school', 'happy', 'apple', 'chair', 'green', 'river', 'mango', 'zebra', 'plant', 'bread', 'cloud', 'table'];
const PLURALS: [string, string][] = [['cat', 'cats'], ['box', 'boxes'], ['baby', 'babies'], ['man', 'men'], ['child', 'children'], ['leaf', 'leaves'], ['bus', 'buses'], ['dish', 'dishes'], ['foot', 'feet'], ['mouse', 'mice'], ['book', 'books'], ['lady', 'ladies']];
const OPPOSITES: [string, string][] = [['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['happy', 'sad'], ['fast', 'slow'], ['open', 'closed'], ['day', 'night'], ['old', 'new'], ['full', 'empty'], ['light', 'dark'], ['high', 'low'], ['wet', 'dry']];
const SENTENCES = ['the dog is running', 'i like to read books', 'the sun is very hot', 'we go to school', 'she has a red hat', 'birds can fly high', 'my friend is kind', 'the cat drinks milk'];

const line = '<span style="display:inline-block;border-bottom:1px solid #111;min-width:120px">&nbsp;</span>';

export const spelling: Generator = {
  id: 'spelling',
  label: 'Spelling (missing letters)',
  category: 'english',
  description: 'Fill in the missing letters to spell the word.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const w = rng.pick(WORDS);
      const shown = w.split('').map(c => 'aeiou'.includes(c) ? '_' : c).join(' ');
      const q = `Fill in the missing letters:  ${shown}`;
      return { questionHtml: `<span style="font-size:16px;letter-spacing:2px">${q}</span>`, answerHtml: `<span style="font-size:16px">${shown} → <b>${w}</b></span>`, marks: 1, bankQuestion: `Fill in the missing letters: ${shown}`, bankAnswer: w };
    });
  },
};

export const alphabeticalOrder: Generator = {
  id: 'alphabetical-order',
  label: 'Alphabetical order',
  category: 'english',
  description: 'Put the words in alphabetical order.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const set: string[] = [];
      while (set.length < 4) { const w = rng.pick(WORDS); if (!set.includes(w)) set.push(w); }
      const shuffled = rng.shuffle(set);
      const sorted = [...set].sort();
      const q = `Put in alphabetical order: ${shuffled.join(', ')}`;
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${sorted.join(', ')}</b>`, marks: 1, bankQuestion: q, bankAnswer: sorted.join(', ') };
    });
  },
};

export const plurals: Generator = {
  id: 'plurals',
  label: 'Singular & plural',
  category: 'english',
  description: 'Write the plural of each noun.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const [s, p] = rng.pick(PLURALS);
      const q = `Write the plural of “${s}”.`;
      return { questionHtml: `${q} ${line}`, answerHtml: `${q} <b>${p}</b>`, marks: 1, bankQuestion: q, bankAnswer: p };
    });
  },
};

export const opposites: Generator = {
  id: 'opposites',
  label: 'Opposites',
  category: 'english',
  description: 'Write the opposite (antonym) of each word.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const pair = rng.pick(OPPOSITES);
      const [a, b] = rng.bool() ? pair : [pair[1], pair[0]];
      const q = `Write the opposite of “${a}”.`;
      return { questionHtml: `${q} ${line}`, answerHtml: `${q} <b>${b}</b>`, marks: 1, bankQuestion: q, bankAnswer: b };
    });
  },
};

export const sentenceUnscramble: Generator = {
  id: 'sentence-unscramble',
  label: 'Build a sentence',
  category: 'english',
  description: 'Arrange the jumbled words into a correct sentence.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const s = rng.pick(SENTENCES);
      const words = s.split(' ');
      let jumbled = rng.shuffle(words);
      if (jumbled.join(' ') === s && words.length > 1) jumbled = [...jumbled].reverse();
      const cap = s.charAt(0).toUpperCase() + s.slice(1) + '.';
      const q = `Arrange the words into a sentence:  ${jumbled.join(' / ')}`;
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${cap}</b>`, marks: 1, bankQuestion: q, bankAnswer: cap };
    });
  },
};
