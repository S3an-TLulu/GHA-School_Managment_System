import { Student, SchoolBranding } from '../context/AppContext';
import { esc, printHtml, exportPdf } from './print';

// Print a blank monthly attendance register for a class — a grid of student
// names down the side and day columns across, ready to tick by hand. Landscape.
export function printClassRegister(className: string, students: Student[], branding: SchoolBranding, monthLabel: string, opts?: { pdf?: boolean }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const rows = students.map((s, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="name">${esc(s.name)}</td>
      ${days.map(() => '<td></td>').join('')}
      <td></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>Register — ${esc(className)}</title><style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111827; padding: 8px; }
    .hd { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #12274a; padding-bottom: 6px; margin-bottom: 8px; }
    .logo { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
    .school { font-size: 16px; font-weight: 800; color: #12274a; }
    .meta { font-size: 11px; color: #6b7280; }
    .title { margin-left: auto; text-align: right; font-size: 12px; font-weight: 700; color: #12274a; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; height: 22px; font-size: 10px; text-align: center; }
    th { background: #eef2f7; font-weight: 700; }
    td.num { width: 22px; color: #6b7280; }
    td.name { text-align: left; padding-left: 6px; white-space: nowrap; width: 150px; font-size: 11px; }
    th.name { text-align: left; padding-left: 6px; }
    @media print { button { display: none; } }
  </style></head><body>
    <div class="hd">
      ${branding.logoUrl ? `<img class="logo" src="${branding.logoUrl}" alt="" />` : ''}
      <div>
        <div class="school">${esc(branding.schoolName) || 'School'}</div>
        <div class="meta">${esc(branding.address || '')}</div>
      </div>
      <div class="title">CLASS ATTENDANCE REGISTER<br>${esc(className)} — ${esc(monthLabel)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th><th class="name">Student Name</th>
          ${days.map(d => `<th>${d}</th>`).join('')}
          <th>Tot</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="34" style="padding:12px;color:#9ca3af">No students in this class.</td></tr>`}</tbody>
    </table>
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;

  if (opts?.pdf) exportPdf(html, `Register_${className}_${monthLabel}`);
  else printHtml(html);
}
