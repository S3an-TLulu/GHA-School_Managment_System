import { describe, it, expect } from 'vitest';
import { entryPoints, leaderboard } from './scoring';
import type { Competition, CompetitionEntry, House } from '../context/AppContext';

const houses: House[] = [
  { id: 'red', name: 'Red', colour: '#dc2626' },
  { id: 'blue', name: 'Blue', colour: '#2563eb' },
];

const positionComp: Competition = {
  id: 'c1', name: 'Sports Day', type: 'Sports', date: '2026-01-01',
  scoringMode: 'position',
  places: [{ label: '1st', points: 10 }, { label: '2nd', points: 8 }, { label: '3rd', points: 6 }, { label: '4th', points: 4 }],
  status: 'active',
};

const entry = (id: string, houseId: string, extra: Partial<CompetitionEntry>): CompetitionEntry =>
  ({ id, competitionId: 'c1', houseId, ...extra });

describe('entryPoints — position mode', () => {
  it('awards place points for distinct positions', () => {
    const all = [entry('a', 'red', { position: 1 }), entry('b', 'blue', { position: 2 })];
    expect(entryPoints(all[0], all, positionComp)).toBe(10);
    expect(entryPoints(all[1], all, positionComp)).toBe(8);
  });

  it('splits a tie for 1st equally: (10+8)/2 = 9 each', () => {
    const all = [entry('a', 'red', { position: 1 }), entry('b', 'blue', { position: 1 })];
    expect(entryPoints(all[0], all, positionComp)).toBe(9);
    expect(entryPoints(all[1], all, positionComp)).toBe(9);
  });

  it('splits a tie for 3rd equally: (6+4)/2 = 5 each', () => {
    const all = [
      entry('a', 'red', { position: 1 }), entry('b', 'blue', { position: 2 }),
      entry('c', 'red', { position: 3 }), entry('d', 'blue', { position: 3 }),
    ];
    expect(entryPoints(all[2], all, positionComp)).toBe(5);
    expect(entryPoints(all[3], all, positionComp)).toBe(5);
  });

  it('gives 0 points once the slot runs past the configured places', () => {
    // Five distinct places: the 5th entry occupies slot 5, beyond the 4 places.
    const all = [1, 2, 3, 4, 5].map((pos, i) => entry(`e${i}`, 'red', { position: pos }));
    expect(entryPoints(all[4], all, positionComp)).toBe(0);
    expect(entryPoints(all[3], all, positionComp)).toBe(4); // 4th slot still scores
  });

  it('gives 0 when no position is set', () => {
    const all = [entry('a', 'red', {})];
    expect(entryPoints(all[0], all, positionComp)).toBe(0);
  });
});

describe('entryPoints — raw points mode', () => {
  const pointsComp: Competition = { ...positionComp, scoringMode: 'points' };
  it('returns rawPoints directly', () => {
    const e = entry('a', 'red', { rawPoints: 42 });
    expect(entryPoints(e, [e], pointsComp)).toBe(42);
  });
  it('treats a missing rawPoints as 0', () => {
    const e = entry('a', 'red', {});
    expect(entryPoints(e, [e], pointsComp)).toBe(0);
  });
});

describe('leaderboard', () => {
  it('totals per house, ranks descending and flags the winner', () => {
    const entries = [
      entry('a', 'red', { position: 1 }),   // 10
      entry('b', 'blue', { position: 2 }),  // 8
      entry('c', 'red', { position: 3 }),   // 6  → Red 16
    ];
    const board = leaderboard(entries, houses, positionComp);
    expect(board[0].house.id).toBe('red');
    expect(board[0].total).toBe(16);
    expect(board[0].rank).toBe(1);
    expect(board[0].winner).toBe(true);
    expect(board[1].house.id).toBe('blue');
    expect(board[1].total).toBe(8);
    expect(board[1].winner).toBe(false);
  });

  it('flags both houses as winners on a tie for 1st and shares the rank', () => {
    const entries = [entry('a', 'red', { position: 1 }), entry('b', 'blue', { position: 1 })];
    const board = leaderboard(entries, houses, positionComp);
    // Tie for 1st → 9 each
    expect(board[0].total).toBe(9);
    expect(board[1].total).toBe(9);
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(1);
    expect(board.every(r => r.winner)).toBe(true);
  });

  it('flags no winner when every house has zero', () => {
    const board = leaderboard([], houses, positionComp);
    expect(board.every(r => r.winner)).toBe(false);
  });
});
