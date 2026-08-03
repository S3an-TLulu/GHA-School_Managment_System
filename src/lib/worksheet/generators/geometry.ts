import { Generator, Problem, str } from '../types';
import { answerLines } from '../svg';

const SHAPES: { name: string; sides: number }[] = [
  { name: 'triangle', sides: 3 }, { name: 'square', sides: 4 }, { name: 'rectangle', sides: 4 },
  { name: 'pentagon', sides: 5 }, { name: 'hexagon', sides: 6 }, { name: 'circle', sides: 0 },
];

// Draw a shape by name as inline SVG.
function shapeSvg(name: string, s = 80): string {
  const cx = s / 2, cy = s / 2, r = s / 2 - 6;
  if (name === 'circle') return `<svg width="${s}" height="${s}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="2"/></svg>`;
  if (name === 'rectangle') return `<svg width="${s + 30}" height="${s}"><rect x="4" y="${cy - r / 1.6}" width="${s + 20}" height="${r * 1.25}" fill="none" stroke="#111" stroke-width="2"/></svg>`;
  if (name === 'square') return `<svg width="${s}" height="${s}"><rect x="6" y="6" width="${s - 12}" height="${s - 12}" fill="none" stroke="#111" stroke-width="2"/></svg>`;
  const sides = SHAPES.find(x => x.name === name)?.sides || 3;
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i * 360 / sides - 90) * Math.PI / 180;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return `<svg width="${s}" height="${s}"><polygon points="${pts}" fill="none" stroke="#111" stroke-width="2"/></svg>`;
}

export const nameShape: Generator = {
  id: 'name-shape',
  label: 'Name the shape',
  category: 'geometry',
  description: 'Identify 2-D shapes.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const sh = rng.pick(SHAPES);
      return { questionHtml: `Name this shape.<br>${shapeSvg(sh.name)}${answerLines(1)}`, answerHtml: `<b>${sh.name}</b>`, marks: 1, bankQuestion: 'Name this 2-D shape (see worksheet).', bankAnswer: sh.name };
    });
  },
};

export const shapeProperties: Generator = {
  id: 'shape-properties',
  label: 'Sides & corners',
  category: 'geometry',
  description: 'Count the sides or corners of a shape.',
  bankable: true,
  settings: [
    { key: 'what', label: 'Count', type: 'select', options: [
      { value: 'sides', label: 'Sides' }, { value: 'corners', label: 'Corners' } ] },
  ],
  defaults: { what: 'sides' },
  generate({ settings, count, rng }): Problem[] {
    const what = str(settings, 'what', 'sides');
    const solid = SHAPES.filter(s => s.sides > 0);
    return Array.from({ length: count }, () => {
      const sh = rng.pick(solid);
      const q = `How many ${what} does a ${sh.name} have?`;
      return { questionHtml: q + answerLines(1), answerHtml: `${q} <b>${sh.sides}</b>`, marks: 1, bankQuestion: q, bankAnswer: String(sh.sides) };
    });
  },
};

export const perimeterArea: Generator = {
  id: 'perimeter-area',
  label: 'Perimeter & area',
  category: 'geometry',
  description: 'Perimeter or area of a rectangle / square.',
  bankable: true,
  settings: [
    { key: 'measure', label: 'Find', type: 'select', options: [
      { value: 'perimeter', label: 'Perimeter' }, { value: 'area', label: 'Area' } ] },
  ],
  defaults: { measure: 'perimeter' },
  generate({ settings, count, rng }): Problem[] {
    const measure = str(settings, 'measure', 'perimeter');
    return Array.from({ length: count }, () => {
      const w = rng.int(2, 15), h = rng.bool(0.3) ? rng.int(2, 15) : w;
      const ans = measure === 'area' ? w * h : 2 * (w + h);
      const unit = measure === 'area' ? 'cm²' : 'cm';
      const fig = `<svg width="180" height="82"><rect x="4" y="4" width="120" height="66" fill="none" stroke="#111" stroke-width="1.5"/><text x="64" y="80" font-size="12" text-anchor="middle" font-family="Arial">${w} cm</text><text x="130" y="41" font-size="12" font-family="Arial">${h} cm</text></svg>`;
      const q = `Find the ${measure} of a rectangle ${w} cm by ${h} cm.`;
      return { questionHtml: `Find the ${measure}.<br>${fig}${answerLines(1)}`, answerHtml: `${q} <b>${ans} ${unit}</b>`, marks: 1, bankQuestion: q, bankAnswer: `${ans} ${unit}` };
    });
  },
};

export const angles: Generator = {
  id: 'angles',
  label: 'Types of angles',
  category: 'geometry',
  description: 'Identify right, acute and obtuse angles.',
  bankable: true,
  settings: [],
  defaults: {},
  generate({ count, rng }): Problem[] {
    return Array.from({ length: count }, () => {
      const deg = rng.pick([30, 45, 60, 90, 90, 120, 135, 150]);
      const kind = deg === 90 ? 'right' : deg < 90 ? 'acute' : 'obtuse';
      const a = (-deg) * Math.PI / 180;
      const x2 = 20 + Math.cos(a) * 60, y2 = 70 + Math.sin(a) * 60;
      const svg = `<svg width="100" height="80"><line x1="20" y1="70" x2="90" y2="70" stroke="#111" stroke-width="2"/><line x1="20" y1="70" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#111" stroke-width="2"/></svg>`;
      return { questionHtml: `Is this angle right, acute or obtuse?<br>${svg}${answerLines(1)}`, answerHtml: `<b>${kind}</b>`, marks: 1, bankQuestion: 'Right, acute or obtuse? (see worksheet)', bankAnswer: kind };
    });
  },
};
