// Receipt numbers in the existing `RCP-######` format (six digits taken from
// the clock). Generating one per payment inside a loop, as bulk fee
// collection used to, gives every payment in the batch the same number
// because the whole loop runs within one millisecond. This hands out
// consecutive numbers from a single clock seed and skips any number already
// on record.
//
// This does not give a gap-free sequential series. That needs a school
// decision on numbering policy (see docs/TECHNICAL_DEBT.md).

const SPACE = 1_000_000;
const format = (n: number) => `RCP-${String(n).padStart(6, '0')}`;

export function nextReceiptNumbers(count: number, existing: Iterable<string | undefined>, seed = Date.now()): string[] {
  const taken = new Set<string>();
  for (const r of existing) if (r) taken.add(r);
  const out: string[] = [];
  let n = Math.abs(Math.trunc(seed)) % SPACE;
  // Bounded so a (practically impossible) full number space can't loop forever.
  for (let tries = 0; out.length < count && tries < SPACE; tries++, n = (n + 1) % SPACE) {
    const candidate = format(n);
    if (taken.has(candidate)) continue;
    taken.add(candidate);
    out.push(candidate);
  }
  return out;
}
