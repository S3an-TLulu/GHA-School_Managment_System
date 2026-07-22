import { useState } from 'react';
import { Wallet, Printer, TrendingUp, TrendingDown, FileDown } from 'lucide-react';
import { printHtml, exportPdf } from '../lib/print';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

const today = () => new Date().toISOString().split('T')[0];
const sameDay = (iso: string | undefined, day: string) => !!iso && iso.split('T')[0] === day;

// Daily cashbook — an end-of-day reconciliation of the office cash drawer for a
// chosen date. Cash in is derived from payments taken that day (Cash method, or
// any paid that day if no method is recorded); cash out from expenses dated that
// day. The opening float is remembered per date; the counted amount is entered
// to reveal any variance.
export function CashBook() {
  const { payments, expenses, students, branding } = useAppContext();
  const tc = useThemeClasses();
  const [date, setDate] = useState(today);
  const [opening, setOpening] = useState(() => localStorage.getItem(`gha_cashfloat_${today()}`) || '');
  const [counted, setCounted] = useState('');

  const setDay = (d: string) => { setDate(d); setOpening(localStorage.getItem(`gha_cashfloat_${d}`) || ''); setCounted(''); };
  const saveFloat = (v: string) => { setOpening(v); localStorage.setItem(`gha_cashfloat_${date}`, v); };

  const cashPayments = payments.filter(p => p.status === 'paid' && sameDay(p.paidDate, date) && (!p.paymentMethod || p.paymentMethod === 'Cash'));
  const dayExpenses = expenses.filter(e => sameDay(e.date, date));
  const cashIn = cashPayments.reduce((a, p) => a + p.amount, 0);
  const cashOut = dayExpenses.reduce((a, e) => a + e.amount, 0);
  const open = parseFloat(opening) || 0;
  const expected = open + cashIn - cashOut;
  const countedN = counted === '' ? null : parseFloat(counted) || 0;
  const variance = countedN === null ? null : countedN - expected;
  const nameOf = (sid: string) => students.find(s => s.id === sid)?.name || sid;

  const print = (pdf = false) => {
    const rows = (title: string, items: string[][]) => `<h3 style="margin:12px 0 4px">${title}</h3><table style="width:100%;border-collapse:collapse">${items.map(r => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${r[0]}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">K${r[1]}</td></tr>`).join('') || '<tr><td style="padding:4px 8px;color:#9ca3af">None</td></tr>'}</table>`;
    const html = `<!DOCTYPE html><html><head><title>Cashbook ${date}</title><style>@media print{button{display:none}}body{font-family:Arial,sans-serif;max-width:640px;margin:20px auto;color:#1a2332}</style></head><body>
      <div style="text-align:center;border-bottom:2px solid #12274a;padding-bottom:8px;margin-bottom:8px">
        ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:cover;border-radius:8px" />` : ''}
        <h2 style="margin:0;color:#12274a">${branding.schoolName || 'School'}</h2><p style="margin:0;font-size:12px;color:#6b7280">Daily Cashbook — ${new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <table style="width:100%;font-size:14px"><tr><td>Opening float</td><td style="text-align:right">K${open.toLocaleString()}</td></tr>
      <tr><td>Cash received</td><td style="text-align:right;color:#16a34a">+ K${cashIn.toLocaleString()}</td></tr>
      <tr><td>Cash paid out</td><td style="text-align:right;color:#dc2626">− K${cashOut.toLocaleString()}</td></tr>
      <tr style="font-weight:700;border-top:2px solid #12274a"><td>Expected in drawer</td><td style="text-align:right">K${expected.toLocaleString()}</td></tr>
      ${countedN !== null ? `<tr><td>Counted</td><td style="text-align:right">K${countedN.toLocaleString()}</td></tr><tr style="font-weight:700;color:${variance === 0 ? '#16a34a' : '#dc2626'}"><td>Variance</td><td style="text-align:right">${variance! >= 0 ? '' : '−'}K${Math.abs(variance!).toLocaleString()}</td></tr>` : ''}</table>
      ${rows('Cash received', cashPayments.map(p => [`${nameOf(p.studentId)} — ${p.type}`, p.amount.toLocaleString()]))}
      ${rows('Cash paid out', dayExpenses.map(e => [`${e.description} (${e.category})`, e.amount.toLocaleString()]))}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:40px"><div style="border-top:1px solid #12274a;padding-top:4px;text-align:center;font-size:11px;color:#6b7280">Cashier</div><div style="border-top:1px solid #12274a;padding-top:4px;text-align:center;font-size:11px;color:#6b7280">Verified By</div></div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`;
    if (pdf) exportPdf(html, `Cashbook_${date}`);
    else printHtml(html);
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">Daily Cashbook</h1><p className="text-gray-600">Reconcile the office cash drawer at the end of the day</p></div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDay(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <button onClick={() => print()} className={`flex items-center gap-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}><Printer className="h-4 w-4" />Print</button>
          <button title="Export cashbook to PDF" onClick={() => print(true)} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium"><FileDown className="h-4 w-4" />PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-3">
          <p className="font-semibold text-gray-900">Reconciliation</p>
          <div><label className="text-xs text-gray-500">Opening float (cash in drawer at start)</label><input type="number" className={inp} value={opening} onChange={e => saveFloat(e.target.value)} placeholder="0" /></div>
          <div className="flex justify-between text-sm py-1"><span className="text-gray-600 flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500" />Cash received</span><span className="font-semibold text-green-600">+ K{cashIn.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-gray-600 flex items-center gap-1"><TrendingDown className="h-4 w-4 text-red-500" />Cash paid out</span><span className="font-semibold text-red-600">− K{cashOut.toLocaleString()}</span></div>
          <div className="flex justify-between text-base py-2 border-t border-gray-200 font-bold"><span className="text-gray-900">Expected in drawer</span><span className={tc.text}>K{expected.toLocaleString()}</span></div>
          <div><label className="text-xs text-gray-500">Counted (actual cash in drawer)</label><input type="number" className={inp} value={counted} onChange={e => setCounted(e.target.value)} placeholder="Count and enter…" /></div>
          {variance !== null && (
            <div className={`rounded-lg p-3 text-center font-semibold ${variance === 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {variance === 0 ? '✓ Balanced' : `${variance > 0 ? 'Over' : 'Short'} by K${Math.abs(variance).toLocaleString()}`}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-green-50 text-green-800 text-xs font-semibold uppercase flex items-center gap-2"><Wallet className="h-4 w-4" />Cash received ({cashPayments.length})</div>
            <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
              {cashPayments.map(p => <div key={p.id} className="flex justify-between px-4 py-2 text-sm"><span className="text-gray-700 truncate">{nameOf(p.studentId)} · {p.type}</span><span className="font-medium text-green-600">K{p.amount.toLocaleString()}</span></div>)}
              {cashPayments.length === 0 && <p className="px-4 py-4 text-sm text-gray-400 text-center">No cash payments on this date.</p>}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-red-50 text-red-800 text-xs font-semibold uppercase flex items-center gap-2"><Wallet className="h-4 w-4" />Cash paid out ({dayExpenses.length})</div>
            <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
              {dayExpenses.map(e => <div key={e.id} className="flex justify-between px-4 py-2 text-sm"><span className="text-gray-700 truncate">{e.description} · {e.category}</span><span className="font-medium text-red-600">K{e.amount.toLocaleString()}</span></div>)}
              {dayExpenses.length === 0 && <p className="px-4 py-4 text-sm text-gray-400 text-center">No expenses on this date.</p>}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">Cash received counts payments marked paid on this date by Cash (or with no method recorded). Bank and Mobile Money payments are excluded from the drawer.</p>
    </div>
  );
}
