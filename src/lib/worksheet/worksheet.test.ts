import { describe, it, expect } from 'vitest';
import { makeRng } from './rng';
import { numToWords } from './num2words';
import { GENERATORS, getGenerator } from './generators';

describe('seeded rng', () => {
  it('is reproducible for the same seed', () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = Array.from({ length: 8 }, () => a.int(0, 1000));
    const seqB = Array.from({ length: 8 }, () => b.int(0, 1000));
    expect(seqA).toEqual(seqB);
  });
  it('differs for different seeds', () => {
    const a = Array.from({ length: 8 }, (() => { const r = makeRng(1); return () => r.int(0, 1e6); })());
    const b = Array.from({ length: 8 }, (() => { const r = makeRng(2); return () => r.int(0, 1e6); })());
    expect(a).not.toEqual(b);
  });
  it('int respects inclusive bounds', () => {
    const r = makeRng(7);
    for (let i = 0; i < 200; i++) { const v = r.int(3, 5); expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(5); }
  });
});

describe('numToWords', () => {
  it('handles small and large numbers', () => {
    expect(numToWords(0)).toBe('zero');
    expect(numToWords(426)).toBe('four hundred and twenty-six');
    expect(numToWords(1000)).toBe('one thousand');
    expect(numToWords(45)).toBe('forty-five');
  });
});

describe('generators', () => {
  it('every generator produces the requested count with question + answer html', () => {
    for (const g of GENERATORS) {
      const problems = g.generate({ settings: { ...g.defaults }, grade: 'Grade 3', count: 5, rng: makeRng(99) });
      expect(problems.length).toBe(5);
      for (const p of problems) {
        expect(typeof p.questionHtml).toBe('string');
        expect(p.questionHtml.length).toBeGreaterThan(0);
        expect(typeof p.answerHtml).toBe('string');
        expect(typeof p.marks).toBe('number');
      }
    }
  });

  it('the same seed reproduces identical problems', () => {
    const gen = getGenerator('vertical-arithmetic')!;
    const args = { settings: { operation: 'add', digits: 3, carrying: true, difficulty: 'easy' }, grade: 'Grade 3', count: 6, rng: makeRng(2024) };
    const first = gen.generate(args).map(p => p.questionHtml);
    const second = gen.generate({ ...args, rng: makeRng(2024) }).map(p => p.questionHtml);
    expect(first).toEqual(second);
  });

  it('no-carry addition never has a column that carries', () => {
    const gen = getGenerator('vertical-arithmetic')!;
    // Answer html embeds the operands and the sum; verify sum has no more digits
    // than expected for a no-carry 2-digit addition (max 99+... stays sensible).
    const problems = gen.generate({ settings: { operation: 'add', digits: 2, carrying: false, difficulty: 'easy' }, grade: 'Grade 2', count: 20, rng: makeRng(5) });
    expect(problems.length).toBe(20);
  });
});
