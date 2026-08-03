// Grade-based difficulty scaling. Generators read these to pick sensible
// defaults (the "complexity auto-adjusts by grade" requirement); explicit
// settings the teacher chooses always override them.

export const GRADES = [
  'Baby Class', 'Middle Class', 'Reception',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
];

export interface GradeTier {
  digits: number;    // typical digit count for arithmetic operands
  max: number;       // typical upper bound for number-sense numbers
  tables: number;    // highest times-table to practise
}

// Ordered from youngest to oldest. Index via gradeIndex().
const TIERS: GradeTier[] = [
  { digits: 1, max: 5, tables: 2 },      // Baby Class
  { digits: 1, max: 10, tables: 2 },     // Middle Class
  { digits: 1, max: 20, tables: 5 },     // Reception
  { digits: 2, max: 100, tables: 5 },    // Grade 1
  { digits: 2, max: 200, tables: 10 },   // Grade 2
  { digits: 3, max: 1000, tables: 12 },  // Grade 3
  { digits: 3, max: 10000, tables: 12 }, // Grade 4
  { digits: 4, max: 100000, tables: 12 },// Grade 5
  { digits: 5, max: 1000000, tables: 12 },// Grade 6
  { digits: 6, max: 10000000, tables: 12 },// Grade 7
];

export const gradeIndex = (grade: string) => {
  const i = GRADES.indexOf(grade);
  return i === -1 ? 3 : i; // default to Grade 1 behaviour
};

export const gradeTier = (grade: string): GradeTier => TIERS[gradeIndex(grade)];
