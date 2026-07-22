import { QuizQuestion, SchoolBranding } from '../context/AppContext';

const esc = (s: string) => (s || '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Print a test / quiz paper from a set of questions. `withAnswers` produces the
// marking key (correct option highlighted / answer shown).
export function printTestPaper(opts: {
  title: string; subject: string; grade?: string; instructions?: string;
  questions: QuizQuestion[]; branding: SchoolBranding; withAnswers: boolean;
}) {
  const { title, subject, grade, instructions, questions, branding, withAnswers } = opts;
  const totalMarks = questions.reduce((a, q) => a + (q.marks ?? 1), 0);
  const body = questions.map((q, i) => {
    const opts = q.options.length > 0
      ? `<div style="margin:4px 0 0 18px">${q.options.map((o, j) => {
          const correct = withAnswers && q.correctIndex === j;
          return `<div style="${correct ? 'font-weight:700;color:#15803d' : ''}">${LETTERS[j]}. ${esc(o)} ${correct ? ' ✓' : ''}</div>`;
        }).join('')}</div>`
      : (withAnswers
          ? `<div style="margin-left:18px;color:#15803d;font-weight:600">Answer: ${esc(String(q.correctIndex ?? '')) || '__________'}</div>`
          : `<div style="margin:6px 0 0 18px;border-bottom:1px solid #cbd5e1;height:20px"></div><div style="margin-left:18px;border-bottom:1px solid #cbd5e1;height:20px"></div>`);
    return `<div style="margin-bottom:12px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between"><span><b>${i + 1}.</b> ${esc(q.question)}</span><span style="color:#6b7280;font-size:11px">[${q.marks ?? 1}]</span></div>
      ${opts}
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><title>${esc(title)}${withAnswers ? ' — Answer Key' : ''}</title><style>
    @page{size:A4;margin:16mm}*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;font-size:13px;line-height:1.5}
    .hd{text-align:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px}
    .meta{display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px;flex-wrap:wrap;gap:6px}
    @media print{button{display:none}}
  </style></head><body>
    <div class="hd">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
      <div style="font-size:18px;font-weight:800">${esc(branding.schoolName) || 'School'}</div>
      <div style="font-size:14px;font-weight:700;margin-top:2px">${esc(title)}${withAnswers ? ' — MARKING KEY' : ''}</div>
      <div style="font-size:12px;color:#374151">${esc(subject)}${grade ? ' · ' + esc(grade) : ''} · Total marks: ${totalMarks}</div>
    </div>
    ${!withAnswers ? `<div class="meta"><span>Name: ______________________________</span><span>Class: ____________</span><span>Date: ____________</span></div>` : ''}
    ${instructions ? `<p style="font-style:italic;color:#374151;margin-bottom:10px">${esc(instructions)}</p>` : ''}
    ${body || '<p style="color:#9ca3af">No questions selected.</p>'}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
