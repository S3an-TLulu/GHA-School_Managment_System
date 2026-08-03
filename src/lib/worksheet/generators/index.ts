import { Generator } from '../types';
import { verticalArithmetic, mentalMaths, timesTables } from './arithmetic';
import { placeValueDigit, expandedForm, numberRepresentation, placeValueTable } from './placeValue';
import { compareNumbers, orderNumbers, roundingNumbers, beforeAfterBetween, oddEven } from './compare';
import { missingNumbers, skipCounting, numberPatterns } from './counting';
import { wordProblems } from './wordProblems';
import { measurementConvert, money, timeWord } from './measurement';
import { nameShape, shapeProperties, perimeterArea, angles } from './geometry';
import { explainCompare, showWorking, trueFalseMaths } from './reasoning';
import { numberLineGen, clockGen, baseTenGen, fractionsGen, pictureCountingGen } from './visual';
import { handwriting } from './handwriting';
import { spelling, alphabeticalOrder, plurals, opposites, sentenceUnscramble } from './english';
import { livingNonLiving, classifyAnimals, trueFalseScience, plantParts } from './science';
import { daysMonths, compassDirections, communityHelpers, zambiaFacts } from './socialStudies';

// The full generator registry. Adding a new question type = write a module and
// add it here — nothing else in the app changes (menu, settings form, preview,
// print and answer key all read from this list).
export const GENERATORS: Generator[] = [
  verticalArithmetic, mentalMaths, timesTables,
  placeValueDigit, expandedForm, numberRepresentation, placeValueTable,
  compareNumbers, orderNumbers, roundingNumbers, beforeAfterBetween, oddEven,
  missingNumbers, skipCounting, numberPatterns,
  wordProblems,
  measurementConvert, money, timeWord,
  nameShape, shapeProperties, perimeterArea, angles,
  explainCompare, showWorking, trueFalseMaths,
  numberLineGen, clockGen, baseTenGen, fractionsGen, pictureCountingGen,
  handwriting,
  spelling, alphabeticalOrder, plurals, opposites, sentenceUnscramble,
  livingNonLiving, classifyAnimals, trueFalseScience, plantParts,
  daysMonths, compassDirections, communityHelpers, zambiaFacts,
];

export const getGenerator = (id: string): Generator | undefined =>
  GENERATORS.find(g => g.id === id);
