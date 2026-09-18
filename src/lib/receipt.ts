import { Payment, Student, SchoolBranding } from '../context/AppContext';
import { esc, printHtml, exportPdf, DOC_FONT } from './print';

const money = (n: number) => `K${Math.round(n || 0).toLocaleString()}`;
const dateStr = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

// Whole-kwacha amount in words for the receipt (e.g. "One thousand five hundred").
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + under1000(n % 100) : '');
}
export function amountInWords(n: number): string {
  n = Math.round(n || 0);
  if (n === 0) return 'Zero kwacha';
  const parts: string[] = [];
  const scales: [number, string][] = [[1_000_000, 'million'], [1_000, 'thousand'], [1, '']];
  for (const [value, name] of scales) {
    const chunk = Math.floor(n / value);
    if (chunk > 0) { parts.push(under1000(chunk) + (name ? ' ' + name : '')); n -= chunk * value; }
  }
  const s = parts.join(' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1) + ' kwacha';
}

function letterhead(b: SchoolBranding) {
  return `<div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid var(--c,#1d4ed8);padding-bottom:12px;margin-bottom:16px">
    ${b.logoUrl ? `<img src="${b.logoUrl}" style="height:60px;width:60px;object-fit:contain" />` : ''}
    <div>
      <div style="font-size:20pt;font-weight:800;color:#1d4ed8">${esc(b.schoolName || 'School')}</div>
      ${b.motto ? `<div style="font-size:10pt;color:#555;font-style:italic">${esc(b.motto)}</div>` : ''}
      <div style="font-size:9pt;color:#666">${[b.address, b.phone, b.email].filter(Boolean).map(esc).join(' · ')}</div>
    </div>
  </div>`;
}

function emit(html: string, filename: string, pdf: boolean) {
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(filename)}</title>
    <style>@page{size:A4;margin:14mm}body{font-family:${DOC_FONT};color:#111;margin:0}table{border-collapse:collapse;width:100%}@media print{button{display:none}}</style>
    </head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`;
  if (pdf) exportPdf(doc, filename); else printHtml(doc);
}

// A single payment receipt.
export function printReceipt(payment: Payment, student: Student, branding: SchoolBranding, pdf = false) {
  const gross = payment.grossAmount ?? payment.amount;
  const hasDiscount = !!payment.discount && payment.discount > 0;
  const html = `
    <div style="max-width:720px;margin:0 auto">
      ${letterhead(branding)}
      <div style="text-align:center;font-size:15pt;font-weight:700;letter-spacing:2px;margin-bottom:14px">OFFICIAL RECEIPT</div>
      <table style="font-size:11pt;margin-bottom:14px">
        <tr><td style="padding:4px 0;color:#666;width:130px">Receipt No.</td><td style="font-weight:700">${esc(payment.receiptNumber || payment.id)}</td>
            <td style="padding:4px 0;color:#666;width:90px">Date</td><td style="font-weight:700">${dateStr(payment.paidDate || payment.createdDate)}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Received from</td><td style="font-weight:700">${esc(student.guardianName || '—')}</td>
            <td style="padding:4px 0;color:#666">Term</td><td style="font-weight:700">${esc(payment.term || '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Pupil</td><td style="font-weight:700">${esc(student.name)}${student.admissionNumber ? ` (${esc(student.admissionNumber)})` : ''}</td>
            <td style="padding:4px 0;color:#666">Class</td><td style="font-weight:700">${esc(student.grade)}</td></tr>
      </table>
      <table style="font-size:11pt;border:1px solid #ccc;margin-bottom:12px">
        <thead><tr style="background:#f0f0f0"><th style="text-align:left;padding:8px;border-bottom:1px solid #ccc">Being payment for</th><th style="text-align:right;padding:8px;border-bottom:1px solid #ccc">Amount</th></tr></thead>
        <tbody>
          <tr><td style="padding:8px">${esc(payment.type)}${payment.notes ? ` — ${esc(payment.notes)}` : ''}</td><td style="padding:8px;text-align:right">${money(gross)}</td></tr>
          ${hasDiscount ? `<tr><td style="padding:8px;color:#b45309">Less discount${payment.discountReason ? ` (${esc(payment.discountReason)})` : ''}</td><td style="padding:8px;text-align:right;color:#b45309">−${money(payment.discount!)}</td></tr>` : ''}
        </tbody>
        <tfoot><tr style="background:#f7f7f7;font-weight:800"><td style="padding:8px;border-top:1px solid #ccc">Total paid (${esc(payment.paymentMethod || 'Cash')})</td><td style="padding:8px;text-align:right;border-top:1px solid #ccc">${money(payment.amount)}</td></tr></tfoot>
      </table>
      <div style="font-size:10pt;color:#444;margin-bottom:24px"><em>Amount in words: ${esc(amountInWords(payment.amount))}</em></div>
      <div style="display:flex;justify-content:space-between;margin-top:36px;font-size:10pt;color:#666">
        <div style="border-top:1px solid #333;padding-top:6px;width:220px">Received by / Signature</div>
        <div style="border-top:1px solid #333;padding-top:6px;width:220px;text-align:right">Official Stamp</div>
      </div>
      <p style="font-size:9pt;color:#999;text-align:center;margin-top:20px">Thank you. Keep this receipt as proof of payment.</p>
    </div>`;
  emit(html, `Receipt_${payment.receiptNumber || payment.id}_${student.name.replace(/\s+/g, '_')}`, pdf);
}

// A full account statement (fees ledger) for one pupil.
export function printStatement(student: Student, payments: Payment[], branding: SchoolBranding, pdf = false) {
  const ps = [...payments].sort((a, b) => (a.paidDate || a.dueDate || a.createdDate || '').localeCompare(b.paidDate || b.dueDate || b.createdDate || ''));
  const charged = ps.reduce((s, p) => s + p.amount, 0);
  const paid = ps.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const outstanding = ps.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  const terms = [...new Set(ps.map(p => p.term || '—'))];
  const termRows = terms.map(t => {
    const tp = ps.filter(p => (p.term || '—') === t);
    const c = tp.reduce((s, p) => s + p.amount, 0);
    const pd = tp.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    return `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(t)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${money(c)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:#15803d">${money(pd)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:${c - pd > 0 ? '#b91c1c' : '#6b7280'}">${money(c - pd)}</td></tr>`;
  }).join('');

  const ledger = ps.length ? ps.map(p => `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${dateStr(p.paidDate || p.dueDate)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(p.type)}${p.discount ? ` <span style="color:#b45309">(−${money(p.discount)})</span>` : ''}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(p.term || '—')}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(p.receiptNumber || '—')}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee"><span style="text-transform:capitalize">${esc(p.status)}</span></td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${money(p.amount)}</td>
    </tr>`).join('') : `<tr><td colspan="6" style="padding:12px;text-align:center;color:#999">No payment records</td></tr>`;

  const html = `
    <div style="max-width:760px;margin:0 auto">
      ${letterhead(branding)}
      <div style="text-align:center;font-size:14pt;font-weight:700;letter-spacing:1px;margin-bottom:14px">STUDENT ACCOUNT STATEMENT</div>
      <table style="font-size:11pt;margin-bottom:14px">
        <tr><td style="padding:3px 0;color:#666;width:120px">Pupil</td><td style="font-weight:700">${esc(student.name)}</td>
            <td style="padding:3px 0;color:#666;width:110px">Admission No.</td><td style="font-weight:700">${esc(student.admissionNumber || '—')}</td></tr>
        <tr><td style="padding:3px 0;color:#666">Class</td><td style="font-weight:700">${esc(student.grade)}</td>
            <td style="padding:3px 0;color:#666">Guardian</td><td style="font-weight:700">${esc(student.guardianName || '—')}</td></tr>
        <tr><td style="padding:3px 0;color:#666">Statement date</td><td style="font-weight:700">${dateStr(new Date().toISOString())}</td>
            <td style="padding:3px 0;color:#666">Phone</td><td style="font-weight:700">${esc(student.guardianPhone || '—')}</td></tr>
      </table>

      <div style="display:flex;gap:10px;margin-bottom:16px">
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center"><div style="font-size:9pt;color:#666">Total charged</div><div style="font-size:15pt;font-weight:800">${money(charged)}</div></div>
        <div style="flex:1;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:10px;text-align:center"><div style="font-size:9pt;color:#15803d">Total paid</div><div style="font-size:15pt;font-weight:800;color:#166534">${money(paid)}</div></div>
        <div style="flex:1;border:1px solid ${outstanding > 0 ? '#fecaca' : '#e5e7eb'};background:${outstanding > 0 ? '#fef2f2' : '#fff'};border-radius:8px;padding:10px;text-align:center"><div style="font-size:9pt;color:#666">Balance due</div><div style="font-size:15pt;font-weight:800;color:${outstanding > 0 ? '#b91c1c' : '#111'}">${money(outstanding)}</div></div>
      </div>

      <div style="font-size:11pt;font-weight:700;margin:6px 0">By term</div>
      <table style="font-size:10pt;border:1px solid #eee;margin-bottom:16px">
        <thead><tr style="background:#f6f6f6"><th style="text-align:left;padding:6px 8px">Term</th><th style="text-align:right;padding:6px 8px">Charged</th><th style="text-align:right;padding:6px 8px">Paid</th><th style="text-align:right;padding:6px 8px">Balance</th></tr></thead>
        <tbody>${termRows}</tbody>
      </table>

      <div style="font-size:11pt;font-weight:700;margin:6px 0">Payment ledger</div>
      <table style="font-size:10pt;border:1px solid #eee">
        <thead><tr style="background:#f6f6f6"><th style="text-align:left;padding:6px 8px">Date</th><th style="text-align:left;padding:6px 8px">Type</th><th style="text-align:left;padding:6px 8px">Term</th><th style="text-align:left;padding:6px 8px">Receipt</th><th style="text-align:left;padding:6px 8px">Status</th><th style="text-align:right;padding:6px 8px">Amount</th></tr></thead>
        <tbody>${ledger}</tbody>
      </table>

      <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:10pt;color:#666">
        <div style="border-top:1px solid #333;padding-top:6px;width:220px">Bursar / Signature</div>
        <div style="border-top:1px solid #333;padding-top:6px;width:220px;text-align:right">Date: ${dateStr(new Date().toISOString())}</div>
      </div>
    </div>`;
  emit(html, `Statement_${student.name.replace(/\s+/g, '_')}`, pdf);
}
