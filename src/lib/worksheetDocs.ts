import { Worksheet, SchoolBranding } from '../context/AppContext';
import { esc, printHtml, exportPdf } from './print';
import { getGenerator } from './worksheet/generators';
import { makeRng } from './worksheet/rng';
import { Problem } from './worksheet/types';

// Generate the problems for one worksheet section (seeded → reproducible).
export function sectionProblems(section: Worksheet['sections'][number], grade: string): Problem[] {
  const gen = getGenerator(section.generatorId);
  if (!gen) return [];
  try {
    return gen.generate({ settings: section.settings, grade, count: Math.max(1, section.count), rng: makeRng(section.seed >>> 0) });
  } catch {
    return [];
  }
}

// Build the printable worksheet (or its answer key) as a self-contained A4 HTML
// document, then route to print or Save-as-PDF. Mirrors the shared *Docs.ts idiom.
export function printWorksheet(worksheet: Worksheet, branding: SchoolBranding, opts: { withAnswers?: boolean; pdf?: boolean } = {}) {
  const { withAnswers = false, pdf = false } = opts;
  const L = worksheet.layout;
  const accent = L.bw ? '#111' : '#12274a';

  let n = 0;               // running question number across the sheet
  let totalMarks = 0;
  const sectionsHtml = worksheet.sections.map(section => {
    const gen = getGenerator(section.generatorId);
    const problems = sectionProblems(section, worksheet.grade);
    const cells = problems.map(p => {
      n += 1;
      totalMarks += p.marks || 0;
      const body = withAnswers ? p.answerHtml : p.questionHtml;
      const markTag = (p.marks || 0) > 1 ? `<span style="float:right;color:#6b7280;font-size:11px">[${p.marks}]</span>` : '';
      return `<div style="break-inside:avoid;page-break-inside:avoid;padding:6px 4px">
        <span style="font-weight:700;margin-right:6px">${n}.</span>${markTag}
        <div style="margin-top:4px">${body}</div>
      </div>`;
    }).join('');
    const heading = section.heading || gen?.label || 'Questions';
    return `<section style="margin-bottom:14px;break-inside:avoid">
      <div style="font-weight:700;color:${accent};border-bottom:1px solid ${accent};margin-bottom:6px;padding-bottom:2px">${esc(heading)}</div>
      <div style="display:grid;grid-template-columns:repeat(${L.columns},1fr);gap:${L.spacing}px">${cells || '<em style="color:#9ca3af">No questions.</em>'}</div>
    </section>`;
  }).join('');

  const metaBits = [
    worksheet.subject && `Subject: <b>${esc(worksheet.subject)}</b>`,
    worksheet.grade && `Class: <b>${esc(worksheet.grade)}</b>`,
    worksheet.teacher && `Teacher: ${esc(worksheet.teacher)}`,
    worksheet.timeAllowed && `Time: ${esc(worksheet.timeAllowed)}`,
    `Total marks: <b>${totalMarks}</b>`,
    worksheet.dateLabel && `Date: ${esc(worksheet.dateLabel)}`,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const pupilRow = !withAnswers
    ? `<div class="pupil"><span>Name: ______________________________</span><span>Class: ____________</span><span>Score: ______ / ${totalMarks}</span></div>`
    : '';

  const foot = L.pageNumbers
    ? `<div class="foot">${esc(branding.schoolName || 'School')} · ${esc(worksheet.title)}${withAnswers ? ' — Answer Key' : ''}</div>` : '';

  const html = `<!DOCTYPE html><html><head><title>${esc(worksheet.title)}${withAnswers ? ' — Answer Key' : ''}</title><style>
    @page{size:A4 ${L.orientation};margin:14mm}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;font-size:${L.fontSize}px;line-height:1.45;${foot ? 'padding-bottom:14mm' : ''}}
    .hd{text-align:center;border-bottom:2px solid ${accent};padding-bottom:8px;margin-bottom:8px}
    .hd .name{font-size:18px;font-weight:800;color:${accent}}
    .hd .motto{font-size:11px;color:#6b7280;font-style:italic}
    .hd .title{font-size:15px;font-weight:700;margin-top:3px}
    .meta{font-size:12px;color:#374151;margin-top:3px}
    .pupil{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;margin:8px 0;border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px}
    .instr{font-style:italic;color:#374151;margin:6px 0}
    .foot{position:fixed;bottom:4mm;left:0;right:0;text-align:center;font-size:10px;color:#9ca3af}
    @media print{button{display:none}}
  </style></head><body>
    <div class="hd">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
      <div class="name">${esc(branding.schoolName) || 'School'}</div>
      ${branding.motto ? `<div class="motto">${esc(branding.motto)}</div>` : ''}
      <div class="title">${esc(worksheet.title)}${withAnswers ? ' — MARKING KEY' : ''}</div>
      <div class="meta">${metaBits}</div>
    </div>
    ${pupilRow}
    ${worksheet.instructions ? `<div class="instr">${esc(worksheet.instructions)}</div>` : ''}
    ${sectionsHtml || '<p style="color:#9ca3af">Add a section to build the worksheet.</p>'}
    ${foot}
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`;

  const filename = `${worksheet.title || 'Worksheet'}${withAnswers ? '_Answer_Key' : ''}`;
  if (pdf) exportPdf(html, filename); else printHtml(html);
}
