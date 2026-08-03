import { Generator } from '../types';
import { verticalArithmetic, mentalMaths, timesTables } from './arithmetic';
import { placeValueDigit, expandedForm, numberRepresentation, placeValueTable } from './placeValue';
import { compareNumbers, orderNumbers, roundingNumbers, beforeAfterBetween, oddEven } from './compare';
import { missingNumbers, skipCounting, numberPatterns } from './counting';
import { wordProblems } from './wordProblems';
import { numberLineGen, clockGen, baseTenGen, fractionsGen, pictureCountingGen } from './visual';
import { handwriting } from './handwriting';

// The full generator registry. Adding a new question type = write a module and
// add it here — nothing else in the app changes (menu, settings form, preview,
// print and answer key all read from this list).
export const GENERATORS: Generator[] = [
  verticalArithmetic, mentalMaths, timesTables,
  placeValueDigit, expandedForm, numberRepresentation, placeValueTable,
  compareNumbers, orderNumbers, roundingNumbers, beforeAfterBetween, oddEven,
  missingNumbers, skipCounting, numberPatterns,
  wordProblems,
  numberLineGen, clockGen, baseTenGen, fractionsGen, pictureCountingGen,
  handwriting,
];

export const getGenerator = (id: string): Generator | undefined =>
  GENERATORS.find(g => g.id === id);
