import { describe, it, expect } from 'vitest';
import { roundMoney, sumMoney, parseMoneyInput, formatMoney } from './money';

describe('roundMoney', () => {
  it('fixes the classic float rounding case', () => {
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('fixes 0.1 + 0.2 style drift', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('rounds to the nearest cent', () => {
    expect(roundMoney(2900.004)).toBe(2900);
    expect(roundMoney(2900.006)).toBe(2900.01);
  });

  it('passes through whole numbers and negatives unchanged', () => {
    expect(roundMoney(2900)).toBe(2900);
    expect(roundMoney(-50.005)).toBe(-50);
  });

  it('treats non-finite input as 0', () => {
    expect(roundMoney(NaN)).toBe(0);
    expect(roundMoney(Infinity)).toBe(0);
  });
});

describe('sumMoney', () => {
  it('sums a list of amounts without compounding float drift', () => {
    expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
  });

  it('ignores non-finite entries rather than poisoning the total', () => {
    expect(sumMoney([100, NaN, 50])).toBe(150);
  });

  it('returns 0 for an empty list', () => {
    expect(sumMoney([])).toBe(0);
  });
});

describe('parseMoneyInput', () => {
  it('parses a plain numeric string', () => {
    expect(parseMoneyInput('2900')).toBe(2900);
    expect(parseMoneyInput('12.5')).toBe(12.5);
  });

  it('treats an empty or non-numeric string as 0, matching `parseFloat(x) || 0`', () => {
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('abc')).toBe(0);
  });

  it('preserves a negative value rather than clamping it — callers clamp when that matters', () => {
    expect(parseMoneyInput('-5')).toBe(-5);
  });
});

describe('formatMoney', () => {
  it('formats a whole amount with the Kwacha prefix and grouping', () => {
    expect(formatMoney(2900)).toBe('K2,900');
  });

  it('rounds before formatting, so display and stored value never drift apart', () => {
    expect(formatMoney(1.005)).toBe('K1.01');
  });

  it('accepts a different currency prefix', () => {
    expect(formatMoney(100, '$')).toBe('$100');
  });
});
