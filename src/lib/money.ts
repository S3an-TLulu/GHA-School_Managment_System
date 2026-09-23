// Centralized money math. Plain JavaScript floats still hold Kwacha amounts
// throughout the app (see docs/ARCHITECTURE_AUDIT.md §3/§7 — moving to integer
// minor units is a bigger, separate data-model change) but every rounding
// and summing operation should go through here instead of being reinvented
// per call site, since a naive `Math.round(n * 100) / 100` gets classic
// float-representation edge cases wrong (e.g. 1.005) and a hand-rolled
// `parseFloat(x) || 0` is easy to get subtly wrong (NaN, Infinity, '-').

/** Round to the nearest cent, correcting for float representation error (e.g. 1.005 → 1.01, not 1). */
export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Sum a list of amounts, rounding once at the end rather than compounding rounding error per line. */
export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((total, v) => total + (Number.isFinite(v) ? v : 0), 0));
}

/** Parse a form input into a money amount — a safe drop-in for the `parseFloat(x) || 0` pattern used across the app. */
export function parseMoneyInput(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Format an amount for display, e.g. `formatMoney(2900)` → "K2,900". Rounds first, so display and stored value never drift apart. */
export function formatMoney(n: number, currency = 'K'): string {
  return `${currency}${roundMoney(n).toLocaleString()}`;
}
