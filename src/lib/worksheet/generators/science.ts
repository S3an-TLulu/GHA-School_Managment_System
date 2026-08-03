import { Generator, Problem } from '../types';
import { answerLines } from '../svg';

const LIVING = ['a dog', 'a tree', 'a fish', 'a bird', 'a flower', 'a person', 'grass', 'a goat'];
const NONLIVING = ['a rock', 'a chair', 'a car', 'a spoon', 'a book', 'water', 'a cloud', 'a stone'];
const ANIMALS: [string, string][] = [['dog', 'mammal'], ['cow', 'mammal'], ['goat', 'mammal'], ['eagle', 'bird'], ['chicken', 'bird'], ['shark', 'fish'], ['tilapia', 'fish'], ['snake', 'reptile'], ['crocodile', 'reptile'], ['bee', 'insect'], ['ant', 'insect']];
const FACTS: [string, boolean][] = [['The sun gives us light and heat', true], ['Plants make their own food using sunlight', true], ['Fish breathe using lungs', false], ['Ice is frozen water', true], ['The moon makes its own light', false], ['We breathe in oxygen', true], ['A spider has six legs', false], ['Water can be a solid, liquid or gas', true]];
const PLANT: [string, string][] = [['take in water from the soil', 'roots'], ['make food for the plant', 'leaves'], ['hold the plant up', 'stem'], ['make seeds', 'flower']];

const line = '<span style="display:inline-block;border-bottom:1px solid #111;min-width:120px">&nbsp;</span>';

export const livingNonLiving: Generator = {
  id: 'living-nonliving',
  label: 'Living or non-living',
  category: 'science',
  description: 'Decide whether something is living or non-living.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const living = rng.bool();
      const item = rng.pick(living ? LIVING : NONLIVING);
      const q = `Is ${item} living or non-living?`;
      return { questionHtml: `${q} ${line}`, answerHtml: `${q} <b>${living ? 'living' : 'non-living'}</b>`, marks: 1, bankQuestion: q, bankAnswer: living ? 'living' : 'non-living' };
    });
  },
};

export const classifyAnimals: Generator = {
  id: 'classify-animals',
  label: 'Animal groups',
  category: 'science',
  description: 'Classify animals as mammal, bird, fish, reptile or insect.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const [animal, group] = rng.pick(ANIMALS);
      const q = `Which group does a ${animal} belong to (mammal, bird, fish, reptile or insect)?`;
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${group}</b>`, marks: 1, bankQuestion: q, bankAnswer: group };
    });
  },
};

export const trueFalseScience: Generator = {
  id: 'true-false-science',
  label: 'Science: true or false',
  category: 'science',
  description: 'Decide whether a science statement is true or false.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const [stmt, val] = rng.pick(FACTS);
      const q = `True or false: ${stmt}.`;
      return { questionHtml: `${q} ${line}`, answerHtml: `${q} <b>${val ? 'True' : 'False'}</b>`, marks: 1, bankQuestion: q, bankAnswer: val ? 'True' : 'False' };
    });
  },
};

export const plantParts: Generator = {
  id: 'plant-parts',
  label: 'Parts of a plant',
  category: 'science',
  description: 'Name the part of a plant that does each job.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const [job, part] = rng.pick(PLANT);
      const q = `Which part of a plant helps to ${job}?`;
      return { questionHtml: `${q}${answerLines(1)}`, answerHtml: `<b>${part}</b>`, marks: 1, bankQuestion: q, bankAnswer: part };
    });
  },
};
