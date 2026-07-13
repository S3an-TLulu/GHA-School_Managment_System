import { useState, useRef } from 'react';
import { FileText, Printer, Receipt, CreditCard, Award, ClipboardList, Users, X, GraduationCap, Pencil } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

type TemplateType = 'receipt' | 'statement' | 'admission' | 'idcard' | 'certificate' | 'attendance-report' | 'financial-report' | 'report-card' | 'quotation';

interface TemplateConfig {
  id: TemplateType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TEMPLATES: TemplateConfig[] = [
  { id: 'receipt',           label: 'Payment Receipt',       description: 'Official receipt for any recorded payment', icon: <Receipt className="h-6 w-6" />,    color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'statement',         label: 'Family Statement',       description: 'Full payment statement for a guardian',     icon: <FileText className="h-6 w-6" />,    color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'admission',         label: 'Admission Letter',       description: 'Formal admission acceptance letter',        icon: <Award className="h-6 w-6" />,       color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'idcard',            label: 'Student ID Card',        description: 'Printable student identity card',           icon: <CreditCard className="h-6 w-6" />,  color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'certificate',       label: 'Certificate',            description: 'Certificate of enrolment or completion',    icon: <Award className="h-6 w-6" />,       color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'attendance-report', label: 'Attendance Report',      description: 'Per-student or class attendance summary',   icon: <ClipboardList className="h-6 w-6" />,color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { id: 'financial-report',  label: 'Financial Report',       description: 'Term income, expenses and net summary',     icon: <Users className="h-6 w-6" />,            color: 'bg-red-50 border-red-200 text-red-700' },
  { id: 'report-card',       label: 'Academic Report Card',   description: 'Printable term report card with grades',    icon: <GraduationCap className="h-6 w-6" />,     color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'quotation',         label: 'Quotation Form',         description: 'Blank quotation with items table & bank details', icon: <FileText className="h-6 w-6" />,   color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
];

export function DocumentTemplates() {
  const { students, payments, expenses, attendance, results, branding, currentTerm } = useAppContext();
  const tc = useThemeClasses();
  const [selected, setSelected] = useState<TemplateType | null>(null);
  const [studentId, setStudentId] = useState('');
  const [termFilter, setTermFilter] = useState(currentTerm);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const allTerms = [...new Set([...payments.map(p => p.term), ...expenses.map(e => e.term)].filter(Boolean))].sort().reverse() as string[];
  const resultTerms = [...new Set(results.map(r => r.term))].sort().reverse();

  const B = branding;

  // GHA document design language (matches official school document set):
  // navy #12274a, muted #5a6b85, light-blue panel #eef3fa, borders #c9d4e6
  const NAVY = '#12274a';
  const MUTED = '#5a6b85';
  const PANEL = '#eef3fa';
  const BORDER = '#c9d4e6';
  const LINE = '#b7c2d6';

  function schoolHeader(docLabel = '') {
    return `
      <div style="display:flex;align-items:center;gap:18px;border-bottom:3px solid ${NAVY};padding-bottom:14px;margin-bottom:20px">
        ${B.logoUrl ? `<img src="${B.logoUrl}" style="width:62px;height:62px;object-fit:contain;flex-shrink:0" />` : `<div style="width:62px;height:62px;background:${NAVY};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:bold;flex-shrink:0">${B.schoolName.charAt(0)}</div>`}
        <div style="flex:1">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:23px;font-weight:700;color:${NAVY};letter-spacing:0.01em">${B.schoolName}</div>
          <div style="font-size:12px;color:${MUTED};margin-top:2px">${B.address} &nbsp;·&nbsp; ${B.phone}</div>
          ${B.motto ? `<div style="font-size:11.5px;color:${NAVY};font-style:italic;margin-top:2px">${B.motto}</div>` : ''}
        </div>
        ${docLabel ? `<div style="text-align:right">
          <div style="font-size:12px;font-weight:700;color:${NAVY};letter-spacing:0.08em;text-transform:uppercase">${docLabel}</div>
        </div>` : ''}
      </div>`;
  }

  function buildDocHTML(html: string, title: string, editable: boolean) {
    return `<!DOCTYPE html><html><head><title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { font-family: Inter, Arial, sans-serif; margin: 24px; color: #1a2332; background: #fff; }
        .gha-doc { position: relative; z-index: 0; border: 2px solid ${NAVY}; border-radius: 10px; padding: 26px 30px; }
        .gha-watermark { position: absolute; top: 50%; left: 50%; width: 85%; max-width: 520px; transform: translate(-50%, -50%); opacity: 0.14; z-index: -1; pointer-events: none; }
        .gha-panel { border: 1px solid ${BORDER}; border-radius: 8px; padding: 16px 18px; margin-bottom: 18px; }
        .gha-section-bar { background: ${PANEL}; color: ${NAVY}; font-weight: 700; font-size: 13px; letter-spacing: 0.04em; padding: 7px 14px; border-radius: 3px; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: ${NAVY}; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 600; }
        td { padding: 7px 10px; border-bottom: 1px solid #dde4ef; font-size: 12px; }
        tbody tr:nth-child(odd) td { background: ${PANEL}; }
        .gha-motto { text-align: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: ${NAVY}; font-size: 13px; margin-top: 24px; }
        ${editable ? `
        [contenteditable]:focus { outline: 2px dashed #f59e0b; outline-offset: 2px; }
        .gha-doc:hover { cursor: text; }
        ` : ''}
        @media print { button { display: none; } body { margin: 0; } }
      </style></head><body>
      <div class="gha-doc"${editable ? ' contenteditable="true" spellcheck="false"' : ''}>
        ${B.logoUrl ? `<img src="${B.logoUrl}" class="gha-watermark" alt="" />` : ''}
        ${html}
      </div></body></html>`;
  }

  // Opens the preview & edit modal instead of printing straight away
  const [preview, setPreview] = useState<{ html: string; title: string } | null>(null);
  const previewFrame = useRef<HTMLIFrameElement>(null);

  function printDoc(html: string, title: string) {
    setPreview({ html: buildDocHTML(html, title, true), title });
  }

  function printPreviewFrame() {
    previewFrame.current?.contentWindow?.print();
  }

  function printReceipt() {
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const studentPayments = payments.filter(p => p.studentId === studentId && p.status === 'paid');
    if (studentPayments.length === 0) { alert('No paid payments for this student.'); return; }
    const latest = studentPayments.sort((a, b) => new Date(b.paidDate || b.createdDate).getTime() - new Date(a.paidDate || a.createdDate).getTime())[0];
    const html = `
      ${schoolHeader('Official Receipt')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
        <div style="background:#f9fafb;border-radius:6px;padding:12px">
          <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase">Student Details</p>
          <p style="margin:2px 0;font-weight:600">${student.name}</p>
          <p style="margin:2px 0;font-size:12px;color:#374151">${student.grade}</p>
          ${student.admissionNumber ? `<p style="margin:2px 0;font-size:11px;color:#6b7280">${student.admissionNumber}</p>` : ''}
          <p style="margin:4px 0 0;font-size:12px">${student.guardianName} · ${student.guardianPhone}</p>
        </div>
        <div style="background:#f9fafb;border-radius:6px;padding:12px">
          <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase">Receipt Details</p>
          <p style="margin:2px 0;font-weight:600">${latest.receiptNumber || `RCP-${latest.id.slice(-5)}`}</p>
          <p style="margin:2px 0;font-size:12px">${new Date(latest.paidDate || latest.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style="margin:2px 0;font-size:12px">Term: ${latest.term || '—'}</p>
        </div>
      </div>
      <table style="margin:16px 0">
        <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>${latest.type}${latest.notes ? ' — ' + latest.notes : ''}</td><td style="text-align:right;font-weight:bold">K${latest.amount.toLocaleString()}</td></tr>
        </tbody>
        <tfoot>
          <tr style="background:#f9fafb"><td style="font-weight:bold;font-size:14px">TOTAL PAID</td><td style="text-align:right;font-weight:bold;font-size:16px;color:#166534">K${latest.amount.toLocaleString()}</td></tr>
        </tfoot>
      </table>
      <div style="display:flex;justify-content:space-between;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb">
        <div>
          <div style="width:160px;border-bottom:1px solid #374151;margin-bottom:4px"></div>
          <p style="font-size:11px;color:#6b7280">Cashier Signature</p>
        </div>
        <div style="text-align:right">
          <div style="width:160px;border-bottom:1px solid #374151;margin-bottom:4px;margin-left:auto"></div>
          <p style="font-size:11px;color:#6b7280">${B.principalName} — Principal</p>
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:10px;margin-top:20px">This is an official receipt from ${B.schoolName}. Please retain for your records.</p>`;
    printDoc(html, `Receipt — ${student.name}`);
  }

  function printStatement() {
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const sp = payments.filter(p => p.studentId === studentId);
    const paid = sp.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending = sp.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const overdue = sp.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    const rows = sp.map(p => `<tr>
      <td>${p.type}</td><td>${p.term || '—'}</td>
      <td style="text-align:right">K${p.amount.toLocaleString()}</td>
      <td style="text-align:center;color:${p.status === 'paid' ? '#166534' : p.status === 'overdue' ? '#991b1b' : '#92400e'};font-weight:600">${p.status.toUpperCase()}</td>
      <td>${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
    </tr>`).join('');
    const html = `
      ${schoolHeader('Statement of Account')}
      <p style="color:#6b7280;margin:0 0 12px;font-size:13px">Generated: ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
      <div style="background:#f9fafb;border-radius:6px;padding:12px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-weight:600;font-size:14px">${student.name}</p>
        <p style="margin:1px 0;color:#374151;font-size:13px">${student.grade} ${student.admissionNumber ? '· ' + student.admissionNumber : ''}</p>
        <p style="margin:1px 0;color:#6b7280;font-size:12px">Guardian: ${student.guardianName} · ${student.guardianPhone}</p>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:16px">
        <div style="flex:1;background:#dcfce7;border-radius:6px;padding:10px;text-align:center"><div style="font-size:11px;color:#166534">Paid</div><div style="font-size:18px;font-weight:bold;color:#166534">K${paid.toLocaleString()}</div></div>
        <div style="flex:1;background:#fef9c3;border-radius:6px;padding:10px;text-align:center"><div style="font-size:11px;color:#92400e">Pending</div><div style="font-size:18px;font-weight:bold;color:#92400e">K${pending.toLocaleString()}</div></div>
        <div style="flex:1;background:#fee2e2;border-radius:6px;padding:10px;text-align:center"><div style="font-size:11px;color:#991b1b">Overdue</div><div style="font-size:18px;font-weight:bold;color:#991b1b">K${overdue.toLocaleString()}</div></div>
        <div style="flex:1;background:#dbeafe;border-radius:6px;padding:10px;text-align:center"><div style="font-size:11px;color:#1e40af">Balance</div><div style="font-size:18px;font-weight:bold;color:#1e40af">K${(pending+overdue).toLocaleString()}</div></div>
      </div>
      <table><thead><tr><th>Type</th><th>Term</th><th style="text-align:right">Amount</th><th style="text-align:center">Status</th><th>Paid Date</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="color:#9ca3af;font-size:10px;margin-top:24px;text-align:center">Official statement from ${B.schoolName} — ${new Date().toLocaleString()}</p>`;
    printDoc(html, `Statement — ${student.name}`);
  }

  function printAdmission() {
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const html = `
      ${schoolHeader('Letter of Admission')}
      <div style="text-align:center;margin:8px 0 20px">
        <p style="color:${MUTED};font-size:12px;margin:0">Academic Year 2026</p>
      </div>
      <p style="font-size:13px;line-height:1.8">Date: <strong>${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</strong></p>
      <p style="font-size:13px;line-height:1.8">Dear <strong>${student.guardianName}</strong>,</p>
      <p style="font-size:13px;line-height:1.8">
        We are pleased to inform you that <strong>${student.name}</strong> has been successfully admitted to
        <strong>${B.schoolName}</strong> for the academic year 2026.
      </p>
      <div style="background:${PANEL};border-left:4px solid ${NAVY};padding:14px;margin:16px 0;border-radius:0 6px 6px 0">
        <p style="margin:0 0 6px;font-weight:600;color:${NAVY}">Student Details</p>
        <table style="width:auto">
          <tr><td style="padding:2px 16px 2px 0;color:#6b7280;font-size:12px">Full Name:</td><td style="font-size:12px;font-weight:600">${student.name}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#6b7280;font-size:12px">Admission No.:</td><td style="font-size:12px;font-weight:600">${student.admissionNumber || 'To be assigned'}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#6b7280;font-size:12px">Class:</td><td style="font-size:12px;font-weight:600">${student.grade}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#6b7280;font-size:12px">Gender:</td><td style="font-size:12px">${student.gender || '—'}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#6b7280;font-size:12px">Guardian:</td><td style="font-size:12px">${student.guardianName} (${student.guardianPhone})</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#6b7280;font-size:12px">Enrolment Date:</td><td style="font-size:12px">${new Date(student.enrollmentDate).toLocaleDateString('en-GB')}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;line-height:1.8">Please report to the school office with this letter and the required documents to complete the enrolment process. School fees should be settled before the start of the term.</p>
      <p style="font-size:13px;line-height:1.8">We look forward to welcoming ${student.name} into our school community.</p>
      <p style="font-size:13px;margin-top:4px">Yours sincerely,</p>
      <div style="margin-top:40px">
        <div style="width:180px;border-bottom:1px solid #374151;margin-bottom:4px"></div>
        <p style="font-size:12px;font-weight:600;margin:0">${B.principalName}</p>
        <p style="font-size:11px;color:#6b7280;margin:2px 0">Head Teacher / Principal</p>
        <p style="font-size:11px;color:#6b7280;margin:2px 0">${B.schoolName}</p>
      </div>
      <div style="margin-top:24px;padding-top:12px;border-top:1px dashed #e5e7eb;font-size:10px;color:#9ca3af;text-align:center">
        ${B.address} · ${B.phone} · ${B.email}
      </div>`;
    printDoc(html, `Admission Letter — ${student.name}`);
  }

  function printIDCard() {
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const html = `
      <div style="max-width:340px;margin:40px auto">
        <p style="text-align:center;color:#6b7280;font-size:12px;margin-bottom:12px">Cut along the dotted line</p>
        <div style="border:2px solid #1d4ed8;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif">
          <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="color:white;font-weight:bold;font-size:14px;margin:0">${B.schoolName}</p>
              <p style="color:#bfdbfe;font-size:10px;margin:2px 0;font-style:italic">${B.motto}</p>
            </div>
            <div style="background:white;border-radius:6px;padding:4px 8px">
              <p style="color:#1d4ed8;font-size:9px;font-weight:bold;margin:0">STUDENT ID</p>
            </div>
          </div>
          <div style="background:white;padding:16px;display:flex;gap:14px;align-items:center">
            <div style="width:64px;height:80px;background:#e5e7eb;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="font-size:28px;color:#9ca3af;font-weight:bold">${student.name.charAt(0)}</span>
            </div>
            <div>
              <p style="font-weight:bold;font-size:15px;margin:0 0 2px">${student.name}</p>
              <p style="color:#6b7280;font-size:12px;margin:1px 0">${student.grade}</p>
              ${student.admissionNumber ? `<p style="color:#1d4ed8;font-size:11px;font-weight:600;margin:1px 0">${student.admissionNumber}</p>` : ''}
              <p style="color:#6b7280;font-size:11px;margin:4px 0 0">Year: 2026</p>
              <p style="color:#6b7280;font-size:10px;margin:1px 0">Guardian: ${student.guardianName}</p>
              <p style="color:#6b7280;font-size:10px;margin:1px 0">${student.guardianPhone}</p>
            </div>
          </div>
          <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:8px 16px;display:flex;justify-content:space-between;align-items:center">
            <p style="font-size:9px;color:#9ca3af;margin:0">${B.phone}</p>
            <p style="font-size:9px;color:#9ca3af;margin:0">${B.email}</p>
          </div>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:10px;margin-top:16px">If found, please return to ${B.schoolName}</p>
      </div>`;
    printDoc(html, `ID Card — ${student.name}`);
  }

  function printCertificate() {
    if (!studentId) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const html = `
      <div style="border:8px double #d4af37;padding:40px;text-align:center;min-height:600px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(to bottom right,#fffef7,#fff)">
        <p style="color:#d4af37;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0">Great Highway Academy</p>
        <h1 style="color:#1d4ed8;font-size:28px;margin:8px 0;font-family:Georgia,serif">Certificate of Enrolment</h1>
        <div style="width:80px;height:3px;background:#d4af37;margin:0 auto 20px"></div>
        <p style="color:#374151;font-size:14px;margin:0">This is to certify that</p>
        <p style="color:#1d4ed8;font-size:28px;font-family:Georgia,serif;border-bottom:2px solid #d4af37;display:inline-block;padding:0 24px;margin:12px auto">${student.name}</p>
        <p style="color:#374151;font-size:14px;margin:8px 0">is a duly enrolled student of <strong>${B.schoolName}</strong></p>
        <p style="color:#374151;font-size:14px;margin:4px 0">currently studying in <strong>${student.grade}</strong></p>
        ${student.admissionNumber ? `<p style="color:#6b7280;font-size:13px;margin:4px 0">Admission Number: <strong>${student.admissionNumber}</strong></p>` : ''}
        <p style="color:#6b7280;font-size:13px;margin:4px 0">for the Academic Year <strong>2026</strong></p>
        <div style="display:flex;justify-content:space-around;margin-top:48px;padding-top:16px">
          <div>
            <div style="width:150px;border-bottom:1px solid #374151;margin-bottom:4px;margin:0 auto 4px"></div>
            <p style="font-size:11px;color:#6b7280;margin:0">Date: ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <div>
            <div style="width:150px;border-bottom:1px solid #374151;margin:0 auto 4px"></div>
            <p style="font-size:11px;color:#374151;font-weight:600;margin:0">${B.principalName}</p>
            <p style="font-size:10px;color:#6b7280;margin:1px 0">Head Teacher / Principal</p>
          </div>
        </div>
        <p style="color:#d4af37;font-size:10px;margin-top:24px;font-style:italic">${B.motto}</p>
      </div>`;
    printDoc(html, `Certificate — ${student.name}`);
  }

  function printAttendanceReport() {
    const grades = [...new Set(students.map(s => s.grade))].sort();
    const html = grades.map(grade => {
      const gradeStudents = students.filter(s => s.grade === grade && (!s.status || s.status === 'active'));
      const rows = gradeStudents.map(s => {
        const records = attendance.filter(r => r.studentId === s.id && r.classGrade === grade);
        const p = records.filter(r => r.status === 'present').length;
        const a = records.filter(r => r.status === 'absent').length;
        const l = records.filter(r => r.status === 'late').length;
        const e = records.filter(r => r.status === 'excused').length;
        const total = records.length;
        const rate = total > 0 ? Math.round(((p + l) / total) * 100) : 0;
        return `<tr>
          <td>${s.admissionNumber || '—'}</td><td style="font-weight:500">${s.name}</td>
          <td style="text-align:center;color:#166534">${p}</td>
          <td style="text-align:center;color:#991b1b">${a}</td>
          <td style="text-align:center;color:#92400e">${l}</td>
          <td style="text-align:center;color:#1e40af">${e}</td>
          <td style="text-align:center">${total}</td>
          <td style="text-align:center;font-weight:bold;color:${rate>=80?'#166534':rate>=60?'#92400e':'#991b1b'}">${total>0?rate+'%':'—'}</td>
        </tr>`;
      }).join('');
      return `<h3 style="color:#1d4ed8;margin:20px 0 8px">${grade}</h3>
        <table><thead><tr><th>Adm#</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Days</th><th>Rate</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    }).join('');

    printDoc(`${schoolHeader('Attendance Report')}<h2 style="color:#12274a;font-size:16px;margin:0 0 4px">All Classes</h2>
      <p style="color:#6b7280;font-size:12px">Generated: ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
      ${html}`, 'Attendance Report');
  }

  function printFinancialReport() {
    const termPay = termFilter ? payments.filter(p => p.term === termFilter) : payments;
    const termExp = termFilter ? expenses.filter(e => e.term === termFilter) : expenses;
    const revenue = termPay.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending = termPay.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const overdue = termPay.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    const totalExp = termExp.reduce((s, e) => s + e.amount, 0);
    const net = revenue - totalExp;

    const byType = Object.entries(
      termPay.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + p.amount; return acc; }, {} as Record<string, number>)
    );
    const byExpCat = Object.entries(
      termExp.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>)
    );

    const html = `${schoolHeader('Financial Report')}
      <h2 style="color:#12274a;font-size:16px;margin:0 0 4px">${termFilter || 'All Terms'}</h2>
      <p style="color:#6b7280;font-size:12px;margin-top:0">Generated: ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0">
        <div style="background:#dcfce7;border-radius:6px;padding:12px;text-align:center"><div style="font-size:11px;color:#166534">Revenue Collected</div><div style="font-size:20px;font-weight:bold;color:#166534">K${revenue.toLocaleString()}</div></div>
        <div style="background:#fee2e2;border-radius:6px;padding:12px;text-align:center"><div style="font-size:11px;color:#991b1b">Total Expenses</div><div style="font-size:20px;font-weight:bold;color:#991b1b">K${totalExp.toLocaleString()}</div></div>
        <div style="background:${net>=0?'#dbeafe':'#fff7ed'};border-radius:6px;padding:12px;text-align:center"><div style="font-size:11px;color:${net>=0?'#1e40af':'#c2410c'}">Net Income</div><div style="font-size:20px;font-weight:bold;color:${net>=0?'#1e40af':'#c2410c'}">K${net.toLocaleString()}</div></div>
        <div style="background:#fef9c3;border-radius:6px;padding:12px;text-align:center"><div style="font-size:11px;color:#92400e">Pending</div><div style="font-size:18px;font-weight:bold;color:#92400e">K${pending.toLocaleString()}</div></div>
        <div style="background:#fee2e2;border-radius:6px;padding:12px;text-align:center"><div style="font-size:11px;color:#991b1b">Overdue</div><div style="font-size:18px;font-weight:bold;color:#991b1b">K${overdue.toLocaleString()}</div></div>
        <div style="background:#f3f4f6;border-radius:6px;padding:12px;text-align:center"><div style="font-size:11px;color:#374151">Transactions</div><div style="font-size:18px;font-weight:bold;color:#374151">${termPay.length}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
        <div>
          <h3 style="color:#166534;margin:0 0 8px">Income by Type</h3>
          <table><thead><tr><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${byType.map(([t, a]) => `<tr><td>${t}</td><td style="text-align:right;font-weight:bold">K${(a as number).toLocaleString()}</td></tr>`).join('')}</tbody></table>
        </div>
        <div>
          <h3 style="color:#991b1b;margin:0 0 8px">Expenses by Category</h3>
          <table><thead><tr><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${byExpCat.map(([c, a]) => `<tr><td>${c}</td><td style="text-align:right;font-weight:bold;color:#991b1b">K${(a as number).toLocaleString()}</td></tr>`).join('')}</tbody></table>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:10px;margin-top:24px;text-align:center">Confidential — ${B.schoolName} Financial Report — ${new Date().toLocaleString()}</p>`;
    printDoc(html, `Financial Report — ${termFilter || 'All'}`);
  }

  function printReportCard() {
    if (!studentId || !termFilter) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const result = results.find(r => r.studentId === studentId && r.term === termFilter);
    if (!result) { alert(`No results recorded for ${student.name} in ${termFilter}.`); return; }

    const vals = Object.values(result.subjects);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const passed = avg >= 50;

    function grade(mark: number) {
      if (mark >= 80) return { letter: 'A', color: '#16a34a' };
      if (mark >= 70) return { letter: 'B', color: '#2563eb' };
      if (mark >= 60) return { letter: 'C', color: '#d97706' };
      if (mark >= 50) return { letter: 'D', color: '#ea580c' };
      return { letter: 'F', color: '#dc2626' };
    }

    const avgGrade = grade(avg);
    const subjectRows = Object.entries(result.subjects).map(([sub, mark]) => {
      const g = grade(mark);
      return `<tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb">${sub}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:600">${mark}%</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${g.color}">${g.letter}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${
          mark >= 80 ? 'Excellent' : mark >= 70 ? 'Very Good' : mark >= 60 ? 'Good' : mark >= 50 ? 'Satisfactory' : 'Needs Improvement'
        }</td>
      </tr>`;
    }).join('');

    const gradeLegend = [
      { l: 'A', r: '80–100%', d: 'Excellent' },
      { l: 'B', r: '70–79%', d: 'Very Good' },
      { l: 'C', r: '60–69%', d: 'Good' },
      { l: 'D', r: '50–59%', d: 'Satisfactory' },
      { l: 'F', r: 'Below 50%', d: 'Fail' },
    ].map(g => `<td style="border:1px solid #e5e7eb;padding:4px 8px;text-align:center;font-size:11px"><strong>${g.l}</strong> ${g.r}</td>`).join('');

    const html = `
      ${schoolHeader('Academic Report Card')}
      <div style="text-align:center;margin:8px 0 20px">
        <p style="margin:4px 0 0;color:#6b7280;font-size:12px">${termFilter}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:#f9fafb;border-radius:6px;padding:12px">
          <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase">Student</p>
          <p style="margin:0;font-weight:700;font-size:15px">${student.name}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#374151">${student.grade}${student.admissionNumber ? ' · ' + student.admissionNumber : ''}</p>
        </div>
        <div style="background:#f9fafb;border-radius:6px;padding:12px">
          <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase">Overall Result</p>
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:32px;font-weight:bold;color:${avgGrade.color}">${avgGrade.letter}</span>
            <div>
              <p style="margin:0;font-size:18px;font-weight:bold;color:${avgGrade.color}">${avg}%</p>
              <p style="margin:2px 0 0;font-size:12px;font-weight:600;color:${passed ? '#166534' : '#991b1b'};background:${passed ? '#dcfce7' : '#fee2e2'};padding:2px 8px;border-radius:9999px;display:inline-block">${passed ? 'PASSED' : 'FAILED'}</p>
            </div>
          </div>
        </div>
      </div>
      <table style="margin-bottom:16px">
        <thead><tr>
          <th style="text-align:left">Subject</th>
          <th style="text-align:center">Mark</th>
          <th style="text-align:center">Grade</th>
          <th style="text-align:left">Remark</th>
        </tr></thead>
        <tbody>${subjectRows}</tbody>
        <tfoot>
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700">Overall Average</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700">${avg}%</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${avgGrade.color}">${avgGrade.letter}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${passed ? 'Promoted to next class' : 'Remedial required'}</td>
          </tr>
        </tfoot>
      </table>
      <table style="margin-bottom:20px"><thead><tr style="background:#f3f4f6">${gradeLegend}</tr></thead></table>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:32px">
        <div>
          <div style="border-top:1px solid #374151;padding-top:4px;font-size:11px;color:#6b7280;text-align:center">Class Teacher</div>
        </div>
        <div>
          <div style="border-top:1px solid #374151;padding-top:4px;font-size:11px;color:#6b7280;text-align:center">Head Teacher / ${B.principalName}</div>
        </div>
        <div>
          <div style="border-top:1px solid #374151;padding-top:4px;font-size:11px;color:#6b7280;text-align:center">Parent / Guardian</div>
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:10px;margin-top:20px">Generated by ${B.schoolName} School Management System · ${new Date().toLocaleDateString()}</p>`;

    printDoc(html, `Report Card — ${student.name} — ${termFilter}`);
  }

  function printQuotation() {
    // Layout modelled on the school's paper quotation pad:
    // contact block left, quotation number / bill-to right, dotted date line,
    // Qty | Description | Unit Price | Amount grid, TOTAL box, bank footer.
    const quoteNo = `${Date.now().toString().slice(-5)}`;
    const dotted = `border-bottom:1.5px dotted #7d8db0;`;
    const blankRows = Array.from({ length: 16 }).map(() => `
      <tr>
        <td style="border:1px solid ${LINE};height:26px;background:#fff !important"></td>
        <td style="border:1px solid ${LINE};background:#fff !important"></td>
        <td style="border:1px solid ${LINE};background:#fff !important"></td>
        <td style="border:1px solid ${LINE};background:#fff !important"></td>
      </tr>`).join('');

    const html = `
      <div style="display:flex;align-items:center;gap:18px;border-bottom:3px solid ${NAVY};padding-bottom:14px;margin-bottom:16px">
        ${B.logoUrl ? `<img src="${B.logoUrl}" style="width:64px;height:64px;object-fit:contain;flex-shrink:0" />` : `<div style="width:64px;height:64px;background:${NAVY};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;flex-shrink:0">${B.schoolName.charAt(0)}</div>`}
        <div style="flex:1">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;font-weight:700;color:${NAVY}">${B.schoolName}</div>
          ${B.motto ? `<div style="font-size:12px;color:${NAVY};font-style:italic;margin-top:2px">${B.motto}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;color:${NAVY};letter-spacing:0.06em">QUOTATION</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:18px">
        <div style="font-size:12.5px;color:#33425e;line-height:2">
          <div>${B.address}</div>
          <div><strong style="color:${NAVY}">Phone:</strong> ${B.phone}</div>
          <div><strong style="color:${NAVY}">Email:</strong> ${B.email}</div>
          <div style="font-weight:600;color:${NAVY}">Lusaka, Zambia</div>
        </div>
        <div style="min-width:280px;border:1px solid ${BORDER};border-radius:8px;padding:12px 16px;font-size:12.5px;color:#33425e;align-self:flex-start">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px">
            <strong style="color:${NAVY}">Quotation #:</strong><span>${quoteNo}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
            <strong style="color:${NAVY};white-space:nowrap">Bill to:</strong><span style="flex:1;${dotted}height:16px"></span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <strong style="color:${NAVY};white-space:nowrap">Address:</strong><span style="flex:1;${dotted}height:16px"></span>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-bottom:14px;font-size:12.5px;color:#33425e">
        <div style="flex:1">
          <div style="${dotted}height:20px;margin-bottom:8px"></div>
          <div style="${dotted}height:20px"></div>
        </div>
        <div style="display:flex;align-items:baseline;gap:8px;min-width:220px">
          <strong style="color:${NAVY}">Date:</strong><span style="flex:1;${dotted}height:16px"></span>
        </div>
      </div>

      <table style="margin-bottom:0">
        <thead>
          <tr>
            <th style="width:56px;text-align:center;border:1px solid ${NAVY}">Qty</th>
            <th style="border:1px solid ${NAVY}">Description of Item</th>
            <th style="width:110px;text-align:right;border:1px solid ${NAVY}">Unit Price</th>
            <th style="width:110px;text-align:right;border:1px solid ${NAVY}">Amount</th>
          </tr>
        </thead>
        <tbody>${blankRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="border:none;background:#fff !important"></td>
            <td style="border:1px solid ${NAVY};background:${PANEL} !important;font-weight:700;color:${NAVY};text-align:right">TOTAL K</td>
            <td style="border:2px solid ${NAVY};background:#fff !important;height:30px"></td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align:center;margin-top:22px;font-size:12px;color:#33425e;line-height:1.9">
        <div>Please make all payments payable to</div>
        <div style="font-weight:700;color:${NAVY}">Bank Name: ${B.bankName}, Account Name: ${B.schoolName},</div>
        <div style="font-weight:700;color:${NAVY}">Account No: ${B.bankAccountNumber}, Branch: ${B.bankBranch}</div>
        <div style="margin-top:6px;color:${MUTED}">${B.email} &nbsp;|&nbsp; ${B.phone}</div>
      </div>
      <div class="gha-motto">"${B.motto}"</div>`;

    printDoc(html, `Quotation — ${B.schoolName}`);
  }

  const ACTION_MAP: Record<TemplateType, () => void> = {
    receipt: printReceipt, statement: printStatement, admission: printAdmission,
    idcard: printIDCard, certificate: printCertificate,
    'attendance-report': printAttendanceReport, 'financial-report': printFinancialReport,
    'report-card': printReportCard, quotation: printQuotation,
  };

  const needsStudent = (id: TemplateType) => ['receipt', 'statement', 'admission', 'idcard', 'certificate', 'report-card'].includes(id);
  const needsTerm = (id: TemplateType) => ['financial-report', 'report-card'].includes(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
        <p className="text-gray-600">Generate and print official school documents using your branding settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TEMPLATES.map(tpl => (
          <button key={tpl.id} onClick={() => setSelected(tpl.id)}
            className={`border-2 rounded-xl p-5 text-left transition-all hover:shadow-md ${
              selected === tpl.id ? 'border-blue-600 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-gray-400'
            }`}>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 ${tpl.color}`}>
              {tpl.icon}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{tpl.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">{TEMPLATES.find(t => t.id === selected)?.label}</p>
              <p className="text-sm text-gray-500">Configure options then click Print Preview</p>
            </div>
            <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {needsStudent(selected) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)}
                  className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="">— Choose a student —</option>
                  {activeStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.grade}</option>
                  ))}
                </select>
              </div>
            )}
            {needsTerm(selected) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selected === 'report-card' ? 'Term *' : 'Term Filter'}
                </label>
                <select value={termFilter} onChange={e => setTermFilter(e.target.value)}
                  className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  {selected !== 'report-card' && <option value="">All Terms</option>}
                  {(selected === 'report-card' ? resultTerms : allTerms).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {selected === 'report-card' && resultTerms.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No results recorded yet. Enter marks in Academic Results first.</p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={ACTION_MAP[selected]}
                disabled={(needsStudent(selected) && !studentId) || (selected === 'report-card' && !termFilter)}
                className={`flex items-center space-x-2 ${tc.btn} text-white px-5 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed`}>
                <Pencil className="h-4 w-4" />
                <span>Preview &amp; Edit</span>
              </button>
              <p className="text-xs text-gray-400">Opens an editable preview — adjust any text, then print</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <strong>Using branding from:</strong> {B.schoolName} · {B.bankName} ({B.bankAccountNumber}) · Principal: {B.principalName}
              <span className="ml-1 text-blue-600 cursor-pointer hover:underline" onClick={() => window.history.pushState({}, '', '?page=branding')}>
                — Edit in Branding Manager
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Edit modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{preview.title}</p>
                <p className="text-xs text-amber-600">✏️ Click any text in the document to edit it before printing</p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                <button onClick={printPreviewFrame}
                  className={`flex items-center space-x-1.5 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button onClick={() => setPreview(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe ref={previewFrame} srcDoc={preview.html} title="Document preview"
              className="flex-1 w-full bg-gray-100" />
          </div>
        </div>
      )}
    </div>
  );
}
