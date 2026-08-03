import { Generator, Problem, str } from '../types';
import { answerLines } from '../svg';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DIRS = ['North', 'East', 'South', 'West'];
const HELPERS: [string, string][] = [['doctor', 'treats sick people'], ['teacher', 'teaches pupils'], ['farmer', 'grows food'], ['police officer', 'keeps us safe'], ['nurse', 'cares for the sick'], ['driver', 'drives vehicles'], ['carpenter', 'makes things from wood']];
const FACTS: [string, string][] = [['What is the capital city of Zambia?', 'Lusaka'], ['What money do we use in Zambia?', 'the Kwacha'], ['How many days are in a week?', '7'], ['How many months are in a year?', '12'], ['Which continent is Zambia in?', 'Africa']];

const line = '<span style="display:inline-block;border-bottom:1px solid #111;min-width:120px">&nbsp;</span>';

export const daysMonths: Generator = {
  id: 'days-months',
  label: 'Days & months',
  category: 'social',
  description: 'The day/month that comes before or after.',
  bankable: true,
  settings: [
    { key: 'set', label: 'Use', type: 'select', options: [
      { value: 'days', label: 'Days of the week' }, { value: 'months', label: 'Months of the year' } ] },
  ],
  defaults: { set: 'days' },
  generate({ settings, count, rng }): Problem[] {
    const useDays = str(settings, 'set', 'days') === 'days';
    const arr = useDays ? DAYS : MONTHS;
    return Array.from({ length: count }, () => {
      const i = rng.int(0, arr.length - 1);
      const after = rng.bool();
      const q = `Which ${useDays ? 'day' : 'month'} comes ${after ? 'after' : 'before'} ${arr[i]}?`;
      const ans = arr[(i + (after ? 1 : arr.length - 1)) % arr.length];
      return { questionHtml: `${q} ${line}`, answerHtml: `${q} <b>${ans}</b>`, marks: 1, bankQuestion: q, bankAnswer: ans };
    });
  },
};

export const compassDirections: Generator = {
  id: 'compass-directions',
  label: 'Compass directions',
  category: 'social',
  description: 'Opposite directions and quarter turns.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const i = rng.int(0, 3);
      if (rng.bool()) {
        const q = `What is the opposite direction of ${DIRS[i]}?`;
        return { questionHtml: `${q} ${line}`, answerHtml: `${q} <b>${DIRS[(i + 2) % 4]}</b>`, marks: 1, bankQuestion: q, bankAnswer: DIRS[(i + 2) % 4] };
      }
      const q = `You are facing ${DIRS[i]} and turn right (clockwise). Which direction do you face now?`;
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${DIRS[(i + 1) % 4]}</b>`, marks: 1, bankQuestion: q, bankAnswer: DIRS[(i + 1) % 4] };
    });
  },
};

export const communityHelpers: Generator = {
  id: 'community-helpers',
  label: 'Community helpers',
  category: 'social',
  description: 'Match a community helper to the job they do.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const [helper, job] = rng.pick(HELPERS);
      const q = rng.bool() ? `Who ${job}?` : `What does a ${helper} do?`;
      const ans = q.startsWith('Who') ? `a ${helper}` : `They ${job}.`;
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${ans}</b>`, marks: 1, bankQuestion: q, bankAnswer: ans };
    });
  },
};

export const zambiaFacts: Generator = {
  id: 'zambia-facts',
  label: 'Zambia general knowledge',
  category: 'social',
  description: 'Simple facts about Zambia and the calendar.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const [q, a] = rng.pick(FACTS);
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${a}</b>`, marks: 1, bankQuestion: q, bankAnswer: a };
    });
  },
};
