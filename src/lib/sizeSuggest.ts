import { UniformSize, StudentMeasurement } from '../context/AppContext';

// AI-assisted (heuristic) size recommendation.
//
// Rather than matching on chest alone, we score every size in the master chart
// by a weighted distance across the measurements we have, then pick the closest.
// Weights reflect how strongly each dimension drives fit. Confidence is derived
// from how tight the best match is versus the runner-up, so the UI can flag a
// borderline case for a human to double-check. No model call — fully offline.

interface Dim { key: keyof StudentMeasurement & keyof UniformSize; weight: number }
const DIMS: Dim[] = [
  { key: 'chest', weight: 1.0 },
  { key: 'waist', weight: 0.8 },
  { key: 'hip', weight: 0.6 },
  { key: 'shoulder', weight: 0.5 },
  { key: 'neck', weight: 0.3 },
];

export interface SizeSuggestion {
  sizeCode: string;
  confidence: 'high' | 'medium' | 'low';
  score: number;        // weighted RMS difference (lower is better)
  usedDims: number;     // how many measurements contributed
}

export function suggestSize(m: Partial<StudentMeasurement>, sizes: UniformSize[]): SizeSuggestion | null {
  if (sizes.length === 0) return null;

  const scored = sizes.map(size => {
    let sumW = 0, sumWDiff2 = 0, used = 0;
    for (const d of DIMS) {
      const mv = m[d.key] as number | undefined;
      const sv = size[d.key] as number | undefined;
      if (typeof mv === 'number' && typeof sv === 'number') {
        const diff = mv - sv;
        sumWDiff2 += d.weight * diff * diff;
        sumW += d.weight;
        used++;
      }
    }
    if (used === 0) return null;
    return { size, score: Math.sqrt(sumWDiff2 / sumW), used };
  }).filter((x): x is { size: UniformSize; score: number; used: number } => x !== null);

  if (scored.length === 0) return null;
  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];
  const runnerUp = scored[1];

  // Confidence: tight absolute fit AND clear separation from the next size.
  const gap = runnerUp ? runnerUp.score - best.score : Infinity;
  let confidence: SizeSuggestion['confidence'] = 'low';
  if (best.score <= 3 && gap >= 2) confidence = 'high';
  else if (best.score <= 6) confidence = 'medium';

  return { sizeCode: best.size.sizeCode, confidence, score: Math.round(best.score * 10) / 10, usedDims: best.used };
}

// Trend across a student's measurement history — are they growing? Useful hint
// for whether to size up. Returns the chest change per record if available.
export function growthHint(current: Partial<StudentMeasurement>, history: StudentMeasurement[]): string | null {
  const chests = history.map(h => h.chest).filter((c): c is number => typeof c === 'number');
  const cur = current.chest;
  if (typeof cur !== 'number' || chests.length === 0) return null;
  const prev = chests[0]; // history is newest-first
  const delta = cur - prev;
  if (delta >= 3) return `Chest up ${delta.toFixed(0)}cm since last time — consider sizing up.`;
  if (delta <= -3) return `Chest down ${Math.abs(delta).toFixed(0)}cm since last time — re-check the measurement.`;
  return null;
}
