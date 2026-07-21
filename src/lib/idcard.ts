import { Student, SchoolBranding } from '../context/AppContext';

// Escape user text before injecting into the printable HTML.
const esc = (s: string) => (s || '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// Open a print window with one or more student ID cards (two per row). No
// external dependencies — a clean, branded card the school can laminate.
export function printIdCards(students: Student[], branding: SchoolBranding) {
  if (students.length === 0) return;
  const year = new Date().getFullYear();
  const card = (s: Student) => `
    <div class="card">
      <div class="strip"></div>
      <div class="hd">
        ${branding.logoUrl ? `<img class="logo" src="${branding.logoUrl}" alt="" />` : ''}
        <div>
          <div class="school">${esc(branding.schoolName) || 'School'}</div>
          <div class="tag">STUDENT IDENTITY CARD</div>
        </div>
      </div>
      <div class="body">
        ${s.photoUrl ? `<img class="photo" src="${s.photoUrl}" alt="" />` : `<div class="photo ph">${esc((s.name || '?').charAt(0))}</div>`}
        <div class="fields">
          <div class="name">${esc(s.name)}</div>
          <div class="row"><span>Class</span><b>${esc(s.grade)}</b></div>
          <div class="row"><span>Adm No.</span><b>${esc(s.admissionNumber || s.id.slice(-8).toUpperCase())}</b></div>
          <div class="row"><span>Guardian</span><b>${esc(s.guardianName || '—')}</b></div>
          <div class="row"><span>Contact</span><b>${esc(s.guardianPhone || '—')}</b></div>
        </div>
      </div>
      <div class="ft">
        <span>Valid ${year}</span>
        <span>${esc(branding.phone || '')}</span>
      </div>
    </div>`;

  const html = `<!DOCTYPE html><html><head><title>Student ID Cards</title><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #eef2f7; padding: 16px; display: flex; flex-wrap: wrap; gap: 14px; }
    .card { width: 320px; height: 200px; background: #fff; border-radius: 14px; overflow: hidden; position: relative;
      box-shadow: 0 2px 10px rgba(0,0,0,.12); border: 1px solid #e5e7eb; display: flex; flex-direction: column; }
    .strip { height: 8px; background: ${branding.logoUrl ? '#1d4ed8' : 'var(--c,#1d4ed8)'}; }
    .hd { display: flex; align-items: center; gap: 8px; padding: 8px 12px 4px; }
    .logo { width: 34px; height: 34px; object-fit: cover; border-radius: 8px; }
    .school { font-size: 14px; font-weight: 800; color: #12274a; line-height: 1.1; }
    .tag { font-size: 8.5px; letter-spacing: .12em; color: #6b7280; font-weight: 700; }
    .body { display: flex; gap: 12px; padding: 6px 12px; flex: 1; }
    .photo { width: 74px; height: 90px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb; flex-shrink: 0; }
    .photo.ph { display: flex; align-items: center; justify-content: center; background: #eef2ff; color: #6366f1; font-size: 34px; font-weight: 800; }
    .fields { flex: 1; min-width: 0; }
    .name { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .row { display: flex; justify-content: space-between; font-size: 10.5px; padding: 1.5px 0; border-bottom: 1px solid #f3f4f6; }
    .row span { color: #6b7280; } .row b { color: #111827; font-weight: 700; }
    .ft { display: flex; justify-content: space-between; padding: 5px 12px; background: #f8fafc; font-size: 9px; color: #6b7280; border-top: 1px solid #eef2f7; }
    @media print { body { background: #fff; } .card { box-shadow: none; page-break-inside: avoid; } button { display: none; } }
  </style></head><body>
    ${students.map(card).join('')}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
