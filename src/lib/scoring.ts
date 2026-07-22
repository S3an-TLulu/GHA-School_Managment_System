import { Competition, CompetitionEntry, House } from '../context/AppContext';

// Competition scoring engine (pure — no React, easy to reason about).
//
// Two modes:
//  • 'position' — each entry has a place (1st, 2nd, …). Place points come from
//    competition.places (default 1st=10, 2nd=8, 3rd=6, 4th=4). Draws split the
//    combined points of the slots the tied entries occupy, equally. So two tied
//    at 1st occupy slots 1 & 2 → (10+8)/2 = 9 each; two tied at 3rd occupy slots
//    3 & 4 → (6+4)/2 = 5 each. This matches the school's judges-sheet rule.
//  • 'points' — each entry carries rawPoints entered directly by the judges.

// Points a single entry earns (position mode, with draw splitting applied).
export function entryPoints(entry: CompetitionEntry, all: CompetitionEntry[], comp: Competition): number {
  if (comp.scoringMode === 'points') return entry.rawPoints ?? 0;
  if (!entry.position) return 0;
  const placePts = (slot: number) => comp.places[slot - 1]?.points ?? 0; // slot is 1-based
  // Slot where this entry's group starts = 1 + number of entries strictly better.
  const better = all.filter(e => e.position && e.position < entry.position!).length;
  const tied = all.filter(e => e.position === entry.position);
  const start = better + 1;
  const sum = tied.reduce((acc, _e, i) => acc + placePts(start + i), 0);
  return Math.round((sum / tied.length) * 100) / 100;
}

export interface HouseScore { house: House; total: number; entries: number; rank: number; winner: boolean }

// Totals per house, ranked, with the winner(s) flagged (ties for 1st all win).
export function leaderboard(entries: CompetitionEntry[], houses: House[], comp: Competition): HouseScore[] {
  const totals = new Map<string, { total: number; entries: number }>();
  houses.forEach(h => totals.set(h.id, { total: 0, entries: 0 }));
  entries.forEach(e => {
    const t = totals.get(e.houseId);
    if (!t) return;
    t.total += entryPoints(e, entries, comp);
    t.entries += 1;
  });
  const rows = houses.map(h => ({ house: h, total: Math.round((totals.get(h.id)!.total) * 100) / 100, entries: totals.get(h.id)!.entries }));
  rows.sort((a, b) => b.total - a.total);
  const top = rows.length ? rows[0].total : 0;
  let lastTotal: number | null = null, lastRank = 0;
  return rows.map((r, i) => {
    const rank = r.total === lastTotal ? lastRank : i + 1;
    lastTotal = r.total; lastRank = rank;
    return { ...r, rank, winner: top > 0 && r.total === top };
  });
}
