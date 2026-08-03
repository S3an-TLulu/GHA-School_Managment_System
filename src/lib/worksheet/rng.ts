// Tiny seeded PRNG (mulberry32) so a worksheet's stored `seed` reproduces the
// exact same problems, and "regenerate" is just a new seed. No dependencies.

export interface RNG {
  next(): number;            // float in [0, 1)
  int(min: number, max: number): number;   // inclusive both ends
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
  bool(p?: number): boolean;
}

export function makeRng(seed: number): RNG {
  let a = seed >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    if (max < min) [min, max] = [max, min];
    return Math.floor(next() * (max - min + 1)) + min;
  };
  return {
    next,
    int,
    pick: <T>(arr: T[]) => arr[Math.floor(next() * arr.length)],
    shuffle: <T>(arr: T[]) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    bool: (p = 0.5) => next() < p,
  };
}

// A fresh random seed for a new worksheet / a "regenerate" action.
export const randomSeed = () => Math.floor(Math.random() * 0xffffffff) >>> 0;
