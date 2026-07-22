import { SchoolBranding, SubjectTopic, LessonPlan, ClassRule, ClassRole, ClassInventoryItem, WishlistItem } from '../context/AppContext';
import { esc, printHtml, exportPdf } from './print';

type DocOpts = { pdf?: boolean };
function emit(html: string, filename: string, opts?: DocOpts) {
  if (opts?.pdf) exportPdf(html, filename);
  else printHtml(html);
}

// Shared A4 shell with a branded header.
function shell(title: string, sub: string, branding: SchoolBranding, body: string) {
  return `<!DOCTYPE html><html><head><title>${esc(title)}</title><style>
    @page{size:A4;margin:16mm}*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;font-size:13px;line-height:1.5}
    .hd{text-align:center;border-bottom:2px solid #12274a;padding-bottom:8px;margin-bottom:12px}
    .hd h1{font-size:18px;color:#12274a}.hd .t{font-size:14px;font-weight:700;margin-top:2px}
    .hd .s{font-size:12px;color:#6b7280}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    th,td{border:1px solid #cbd5e1;padding:6px 8px;font-size:12px;text-align:left;vertical-align:top}
    th{background:#eef2f7}
    h2{font-size:14px;color:#12274a;margin:14px 0 4px}
    ol,ul{margin:4px 0 4px 22px}li{margin:3px 0}
    @media print{button{display:none}}
  </style></head><body>
    <div class="hd">${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
      <h1>${esc(branding.schoolName) || 'School'}</h1>
      <div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div></div>
    ${body}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;
}

export function printLessonPlan(plan: LessonPlan, branding: SchoolBranding, opts?: DocOpts) {
  const meta = [plan.grade ? `Class: ${esc(plan.grade)}` : '', plan.date ? `Date: ${new Date(plan.date).toLocaleDateString('en-GB')}` : '']
    .filter(Boolean).join(' &nbsp;·&nbsp; ');
  const steps = plan.steps.length
    ? `<ol>${plan.steps.map(s => `<li>${esc(s.text)}${s.done ? ' ✓' : ''}</li>`).join('')}</ol>`
    : '<p style="color:#9ca3af">No steps listed.</p>';
  const body = `
    ${meta ? `<p style="color:#374151">${meta}</p>` : ''}
    ${plan.objectives ? `<h2>Objectives</h2><p>${esc(plan.objectives)}</p>` : ''}
    <h2>Lesson Steps</h2>${steps}
    ${plan.resources ? `<h2>Resources</h2><p>${esc(plan.resources)}</p>` : ''}
    ${plan.notes ? `<h2>Notes</h2><p>${esc(plan.notes)}</p>` : ''}`;
  emit(shell(plan.title || 'Lesson Plan', `${esc(plan.subject)} — Lesson Plan`, branding, body), `Lesson_Plan_${plan.title || plan.subject}`, opts);
}

export function printTopics(subject: string, grade: string | undefined, topics: SubjectTopic[], branding: SchoolBranding, opts?: DocOpts) {
  const body = topics.length
    ? topics.map(t => `<div style="page-break-inside:avoid"><h2>${esc(t.title)}</h2><p style="white-space:pre-wrap">${esc(t.content)}</p></div>`).join('')
    : '<p style="color:#9ca3af">No topics recorded.</p>';
  emit(shell(`${subject} — Topic Contents`, grade ? `Class: ${grade}` : 'All classes', branding, body), `Topics_${subject}`, opts);
}

export function printClassRules(classGrade: string, rules: ClassRule[], branding: SchoolBranding, opts?: DocOpts) {
  const body = rules.length
    ? `<ol>${[...rules].sort((a, b) => a.order - b.order).map(r => `<li style="margin:6px 0">${esc(r.text)}</li>`).join('')}</ol>`
    : '<p style="color:#9ca3af">No rules recorded.</p>';
  emit(shell('Class Rules', classGrade, branding, body), `Class_Rules_${classGrade}`, opts);
}

export function printClassRoles(classGrade: string, roles: ClassRole[], branding: SchoolBranding, opts?: DocOpts) {
  const rows = roles.map(r => `<tr><td style="font-weight:600;white-space:nowrap">${esc(r.role)}</td><td>${esc(r.studentName || '—')}</td><td>${esc(r.duties)}</td></tr>`).join('');
  const body = `<table><thead><tr><th>Role</th><th>Pupil</th><th>Responsibilities</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3" style="color:#9ca3af">No roles assigned.</td></tr>'}</tbody></table>`;
  emit(shell('Class Roles & Responsibilities', classGrade, branding, body), `Class_Roles_${classGrade}`, opts);
}

export function printClassInventory(classGrade: string, items: ClassInventoryItem[], bookTitle: (id: string) => string, branding: SchoolBranding, opts?: DocOpts) {
  const rows = items.map(i => `<tr><td>${esc(i.name)}${i.bookId ? ` <span style="color:#6b7280">(Library: ${esc(bookTitle(i.bookId))})</span>` : ''}</td><td style="text-align:center">${i.quantity}</td><td>${esc(i.notes || '')}</td></tr>`).join('');
  const body = `<table><thead><tr><th>Item</th><th style="width:70px;text-align:center">Qty</th><th>Notes</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3" style="color:#9ca3af">No items recorded.</td></tr>'}</tbody></table>`;
  emit(shell('Class Inventory', classGrade, branding, body), `Class_Inventory_${classGrade}`, opts);
}

export function printWishlist(classGrade: string, items: WishlistItem[], branding: SchoolBranding, opts?: DocOpts) {
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const rows = [...items].sort((a, b) => rank[a.priority] - rank[b.priority])
    .map(i => `<tr><td style="font-weight:600">${esc(i.item)}</td><td style="text-transform:capitalize">${esc(i.priority)}</td><td style="text-transform:capitalize">${esc(i.status)}</td><td>${esc(i.reason || '')}</td></tr>`).join('');
  const body = `<p style="color:#374151;margin-bottom:6px">Items requested by ${esc(classGrade)}, in order of importance, for the attention of the school administration.</p>
    <table><thead><tr><th>Item</th><th style="width:90px">Priority</th><th style="width:100px">Status</th><th>Reason</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" style="color:#9ca3af">No requests.</td></tr>'}</tbody></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:40px"><div style="border-top:1px solid #111;padding-top:4px;text-align:center;font-size:11px">Class Teacher</div><div style="border-top:1px solid #111;padding-top:4px;text-align:center;font-size:11px">Administration</div></div>`;
  emit(shell('Class Wishlist — Request to Administration', classGrade, branding, body), `Wishlist_${classGrade}`, opts);
}
