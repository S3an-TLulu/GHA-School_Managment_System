// Inline-SVG builders for the visual maths generators plus shared "answer space"
// helpers. Everything returns a self-contained HTML/SVG string (no external
// assets, CSP-safe) that drops straight into a printable document.

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---- Answer / working-out boxes ----
export type BoxSize = 'small' | 'medium' | 'large' | 'custom';
const BOX_DIMS: Record<Exclude<BoxSize, 'custom'>, { w: number; h: number }> = {
  small: { w: 200, h: 36 },
  medium: { w: 300, h: 80 },
  large: { w: 340, h: 150 },
};
export function answerBox(size: BoxSize = 'medium', width?: number, height?: number): string {
  const dim = size === 'custom'
    ? { w: width || 300, h: height || 80 }
    : BOX_DIMS[size];
  return `<div style="border:1.5px solid #111;border-radius:4px;width:${dim.w}px;max-width:100%;height:${dim.h}px;margin-top:6px"></div>`;
}

// A blank ruled line (or two) for a written short answer.
export function answerLines(n = 1): string {
  return Array.from({ length: n }, () =>
    `<div style="border-bottom:1px solid #94a3b8;height:20px;margin-top:8px"></div>`).join('');
}

// ---- Number line ----
// values: the tick labels (use null for a blank/missing tick the pupil fills).
export function numberLine(values: (number | null)[], opts: { width?: number } = {}): string {
  const w = opts.width ?? 520, h = 60, padX = 20;
  const n = values.length;
  const step = n > 1 ? (w - padX * 2) / (n - 1) : 0;
  const y = 26;
  const ticks = values.map((v, i) => {
    const x = padX + step * i;
    const label = v == null
      ? `<rect x="${x - 12}" y="${y + 8}" width="24" height="18" fill="none" stroke="#111" rx="3"/>`
      : `<text x="${x}" y="${y + 22}" font-size="13" text-anchor="middle" font-family="Arial">${v}</text>`;
    return `<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 4}" stroke="#111" stroke-width="1.5"/>${label}`;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%">
    <line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="#111" stroke-width="1.5"/>
    ${ticks}
  </svg>`;
}

// ---- Analogue clock ----
export function analogueClock(hour: number, minute: number, opts: { blank?: boolean; size?: number } = {}): string {
  const s = opts.size ?? 110, r = s / 2 - 4, cx = s / 2, cy = s / 2;
  const marks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    const x1 = cx + Math.cos(a) * (r - 8), y1 = cy + Math.sin(a) * (r - 8);
    const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
    const nx = cx + Math.cos(a) * (r - 18), ny = cy + Math.sin(a) * (r - 18);
    return `<line x1="${round2(x1)}" y1="${round2(y1)}" x2="${round2(x2)}" y2="${round2(y2)}" stroke="#111" stroke-width="1.5"/>
      <text x="${round2(nx)}" y="${round2(ny + 4)}" font-size="11" text-anchor="middle" font-family="Arial">${i === 0 ? 12 : i}</text>`;
  }).join('');
  let hands = '';
  if (!opts.blank) {
    const ha = ((hour % 12) * 30 + minute * 0.5 - 90) * Math.PI / 180;
    const ma = (minute * 6 - 90) * Math.PI / 180;
    hands = `<line x1="${cx}" y1="${cy}" x2="${round2(cx + Math.cos(ha) * r * 0.5)}" y2="${round2(cy + Math.sin(ha) * r * 0.5)}" stroke="#111" stroke-width="3" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy}" x2="${round2(cx + Math.cos(ma) * r * 0.78)}" y2="${round2(cy + Math.sin(ma) * r * 0.78)}" stroke="#111" stroke-width="2" stroke-linecap="round"/>`;
  }
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="2"/>
    ${marks}${hands}<circle cx="${cx}" cy="${cy}" r="2.5" fill="#111"/>
  </svg>`;
}

// ---- Base-ten blocks (hundreds flats, tens rods, ones cubes) ----
export function baseTenBlocks(value: number): string {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;
  const flat = `<svg width="46" height="46" style="margin:2px"><rect width="45" height="45" fill="none" stroke="#111"/>${
    [1, 2, 3, 4].map(i => `<line x1="${i * 9}" y1="0" x2="${i * 9}" y2="45" stroke="#111" stroke-width="0.5"/><line x1="0" y1="${i * 9}" x2="45" y2="${i * 9}" stroke="#111" stroke-width="0.5"/>`).join('')
  }</svg>`;
  const rod = `<svg width="12" height="46" style="margin:2px"><rect width="11" height="45" fill="none" stroke="#111"/>${
    [1, 2, 3, 4].map(i => `<line x1="0" y1="${i * 9}" x2="11" y2="${i * 9}" stroke="#111" stroke-width="0.5"/>`).join('')
  }</svg>`;
  const cube = `<svg width="12" height="12" style="margin:2px"><rect width="11" height="11" fill="none" stroke="#111"/></svg>`;
  const group = (html: string, n: number) => Array.from({ length: n }, () => html).join('');
  return `<div style="display:flex;align-items:flex-end;flex-wrap:wrap;gap:2px">${group(flat, hundreds)}${group(rod, tens)}<span style="display:inline-flex;flex-wrap:wrap;max-width:60px;align-items:flex-end">${group(cube, ones)}</span></div>`;
}

// ---- Fractions (bar or circle) ----
export function fractionShape(numerator: number, denominator: number, kind: 'bar' | 'circle' = 'bar', shade = true): string {
  const d = Math.max(1, denominator);
  if (kind === 'circle') {
    const s = 90, cx = s / 2, cy = s / 2, r = s / 2 - 4;
    const wedges = Array.from({ length: d }, (_, i) => {
      const a0 = (i * 360 / d - 90) * Math.PI / 180;
      const a1 = ((i + 1) * 360 / d - 90) * Math.PI / 180;
      const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
      const large = (360 / d) > 180 ? 1 : 0;
      const fill = shade && i < numerator ? '#111' : '#fff';
      return `<path d="M${cx},${cy} L${round2(x0)},${round2(y0)} A${r},${r} 0 ${large} 1 ${round2(x1)},${round2(y1)} Z" fill="${fill}" stroke="#111" stroke-width="1"/>`;
    }).join('');
    return `<svg width="${s}" height="${s}">${wedges}</svg>`;
  }
  const w = 220, h = 44, cw = w / d;
  const cells = Array.from({ length: d }, (_, i) =>
    `<rect x="${round2(i * cw)}" y="0" width="${round2(cw)}" height="${h}" fill="${shade && i < numerator ? '#111' : '#fff'}" stroke="#111"/>`).join('');
  return `<svg width="${w}" height="${h}" style="max-width:100%">${cells}</svg>`;
}

// ---- Picture counting (repeat an emoji/icon) ----
export function pictureRow(emoji: string, count: number): string {
  return `<div style="font-size:22px;line-height:1.4;max-width:100%">${Array.from({ length: count }, () => emoji).join(' ')}</div>`;
}

// Rounded, child-friendly handwriting font stack (falls back gracefully). These
// fonts are commonly present on teachers' machines; no external download needed.
export const HANDWRITING_FONT = "'Century Gothic','Comic Sans MS','Comic Neue','Chalkboard SE','Segoe Print',cursive";

// ---- Handwriting practice row: Reference | Trace (light) | Practice (blank) ----
// One row on 3 guide lines (top, dashed mid-line, solid baseline): a bold
// reference glyph on the left, light glyphs to trace over, then blank practice.
export function handwritingRow(reference: string, trace: string, opts: { repeats?: number; size?: number } = {}): string {
  const size = opts.size ?? 30;
  const repeats = opts.repeats ?? 5;
  const rowH = Math.round(size * 1.7);
  const mid = Math.round(rowH * 0.34), base = Math.round(rowH * 0.72);
  const light = Array.from({ length: repeats }, () => trace).join('&nbsp;&nbsp;');
  const guides = `
    <div style="position:absolute;left:0;right:0;top:2px;border-top:1px solid #cbd5e1"></div>
    <div style="position:absolute;left:0;right:0;top:${mid}px;border-top:1px dashed #cbd5e1"></div>
    <div style="position:absolute;left:0;right:0;top:${base}px;border-top:1.5px solid #9ca3af"></div>`;
  return `<div style="display:flex;align-items:stretch;border-bottom:1px solid #e5e7eb">
    <div style="width:62px;flex:none;display:flex;align-items:center;font-family:${HANDWRITING_FONT};font-size:${size}px;color:#111;padding-left:2px">${reference}</div>
    <div style="width:52%;position:relative;height:${rowH}px;border-left:1px solid #e5e7eb">
      ${guides}
      <div style="position:absolute;left:8px;top:1px;font-family:${HANDWRITING_FONT};font-size:${size}px;color:#d9dee6;white-space:nowrap;overflow:hidden">${light}</div>
    </div>
    <div style="flex:1;position:relative;height:${rowH}px;border-left:1px solid #e5e7eb">${guides}</div>
  </div>`;
}

// A REFERENCE · TRACE · PRACTICE column header for the top of a handwriting block.
export function handwritingHeader(): string {
  return `<div style="display:flex;font-size:9px;letter-spacing:1px;color:#9ca3af;text-transform:uppercase;font-family:Arial;border-bottom:1px solid #9ca3af;padding-bottom:2px">
    <div style="width:62px;flex:none">Ref.</div><div style="width:52%">Trace</div><div style="flex:1;padding-left:4px">Practice</div>
  </div>`;
}
