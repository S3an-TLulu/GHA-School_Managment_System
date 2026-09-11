import { useState } from 'react';
import { Utensils, Printer, FileDown, Search, Check } from 'lucide-react';
import { useAppContext, LunchRecord } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { esc, emitDoc, DOC_FONT } from '../lib/print';

const METHODS = ['Cash', 'Mobile Money', 'Bank Transfer', 'Other'];

export function Lunch() {
  const { students, terms, currentTerm, branding, lunchRecords, addLunchRecord, updateLunchRecord, deleteLunchRecord } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();

  const [period, setPeriod] = useState(currentTerm || terms[0] || 'Term 1 2026');
  const [fee, setFee] = useState('');
  const [search, setSearch] = useState('');
  const [onlyOnLunch, setOnlyOnLunch] = useState(false);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const recordFor = (studentId: string) => lunchRecords.find(r => r.studentId === studentId && r.period === period);
  const periodRecords = lunchRecords.filter(r => r.period === period);

  const defaultFee = () => parseFloat(fee) || 0;

  const toggleLunch = (studentId: string) => {
    const existing = recordFor(studentId);
    if (existing) deleteLunchRecord(existing.id);
    else addLunchRecord({ id: `lunch-${studentId}-${Date.now()}`, studentId, period, amountDue: defaultFee(), amountPaid: 0 });
  };
  const setDue = (r: LunchRecord, v: string) => updateLunchRecord(r.id, { amountDue: parseFloat(v) || 0 });
  const setPaid = (r: LunchRecord, v: string) => {
    const paid = Math.max(0, parseFloat(v) || 0);
    updateLunchRecord(r.id, { amountPaid: paid, date: paid > 0 ? (r.date || new Date().toISOString()) : r.date });
  };
  const setMethod = (r: LunchRecord, m: string) => updateLunchRecord(r.id, { method: m });
  const setDate = (r: LunchRecord, v: string) => updateLunchRecord(r.id, { date: v ? new Date(v).toISOString() : undefined });
  const markPaid = (r: LunchRecord) => updateLunchRecord(r.id, { amountPaid: r.amountDue, date: r.date || new Date().toISOString() });
  const applyFeeToAll = () => {
    const f = defaultFee();
    if (!f) { toast('Enter a default lunch fee first.', 'warning'); return; }
    periodRecords.forEach(r => updateLunchRecord(r.id, { amountDue: f }));
    toast(`Applied K${f.toLocaleString()} to ${periodRecords.length} pupil(s) on lunch.`, 'success');
  };

  const onLunchCount = periodRecords.length;
  const collected = periodRecords.reduce((s, r) => s + (r.amountPaid || 0), 0);
  const outstanding = periodRecords.reduce((s, r) => s + Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0)), 0);

  const rows = activeStudents
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.admissionNumber || '').toLowerCase().includes(search.toLowerCase()))
    .filter(s => !onlyOnLunch || recordFor(s.id));

  const printList = (pdf = false) => {
    const list = periodRecords
      .map(r => ({ r, s: students.find(st => st.id === r.studentId) }))
      .filter(x => x.s)
      .sort((a, b) => (a.s!.name).localeCompare(b.s!.name));
    if (!list.length) { toast('No pupils on the lunch list for this period yet.', 'warning'); return; }
    const body = list.map(({ r, s }, i) => {
      const bal = Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0));
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px 8px">${i + 1}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${esc(s!.name)}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${esc(s!.grade)}</td>
        <td style="border:1px solid #ccc;padding:6px 8px;text-align:right">K${(r.amountDue || 0).toLocaleString()}</td>
        <td style="border:1px solid #ccc;padding:6px 8px;text-align:right;color:#15803d">K${(r.amountPaid || 0).toLocaleString()}</td>
        <td style="border:1px solid #ccc;padding:6px 8px;text-align:right;color:${bal > 0 ? '#b91c1c' : '#6b7280'}">K${bal.toLocaleString()}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${esc(r.method || '')}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${r.date ? new Date(r.date).toLocaleDateString('en-GB') : ''}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><title>Lunch List – ${esc(period)}</title>
      <style>@page{size:A4;margin:14mm}body{font-family:${DOC_FONT};color:#111}table{border-collapse:collapse;width:100%;font-size:12px}th{background:#f0f0f0;border:1px solid #ccc;padding:6px 8px;text-align:left}@media print{button{display:none}}</style></head>
      <body>
        <div style="text-align:center;margin-bottom:10px">
          ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
          <div style="font-size:16pt;font-weight:700">${esc(branding.schoolName) || 'School'}</div>
          <div style="font-size:12pt;font-weight:600">Lunch List — ${esc(period)}</div>
          <div style="font-size:10pt;color:#555">${list.length} pupils · Collected K${collected.toLocaleString()} · Outstanding K${outstanding.toLocaleString()}</div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Pupil</th><th>Class</th><th style="text-align:right">Fee</th><th style="text-align:right">Paid</th><th style="text-align:right">Balance</th><th>Method</th><th>Date</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
        <p style="margin-top:14px;font-size:10px;color:#888">Printed ${new Date().toLocaleDateString('en-GB')}</p>
        <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`;
    emitDoc(html, `Lunch_List_${period.replace(/\s+/g, '_')}`, pdf ? 'pdf' : 'print');
  };

  const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Utensils className="h-6 w-6" />Lunch List</h1>
          <p className="text-gray-600">Track which pupils are on lunch and the payments made each term/month</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => printList()} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Printer className="h-4 w-4" />Print list</button>
          <button title="Export lunch list to PDF" onClick={() => printList(true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm hover:bg-gray-50"><FileDown className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <label className="text-xs font-medium text-gray-500">Period
          <select value={period} onChange={e => setPeriod(e.target.value)} className={`${inp} block mt-1`}>
            {[...new Set([...(terms || []), ...lunchRecords.map(r => r.period)])].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">Default lunch fee (K)
          <input type="number" min="0" value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. 150" className={`${inp} block mt-1 w-28`} />
        </label>
        <button onClick={applyFeeToAll} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Apply fee to all on lunch</button>
        <span className="text-xs text-gray-400 ml-auto self-center">New pupils added to lunch use the default fee.</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">On lunch ({period})</p><p className="text-2xl font-bold text-gray-900">{onLunchCount}</p></div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-sm text-green-700">Collected</p><p className="text-2xl font-bold text-green-800">K{collected.toLocaleString()}</p></div>
        <div className={`rounded-lg border p-4 ${outstanding > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}><p className="text-sm text-gray-500">Outstanding</p><p className={`text-2xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-gray-900'}`}>K{outstanding.toLocaleString()}</p></div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pupil by name or admission no.…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={onlyOnLunch} onChange={e => setOnlyOnLunch(e.target.checked)} />On lunch only</label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ background: 'var(--gha-primary, #1d4ed8)' }}>
                <th className="py-3 px-4 text-left font-medium">Pupil</th>
                <th className="py-3 px-3 text-left font-medium">Class</th>
                <th className="py-3 px-3 text-center font-medium">On lunch</th>
                <th className="py-3 px-3 text-right font-medium">Fee (K)</th>
                <th className="py-3 px-3 text-right font-medium">Paid (K)</th>
                <th className="py-3 px-3 text-right font-medium">Balance</th>
                <th className="py-3 px-3 text-left font-medium">Method</th>
                <th className="py-3 px-3 text-left font-medium">Date paid</th>
                <th className="py-3 px-3 text-center font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const r = recordFor(s.id);
                const bal = r ? Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0)) : 0;
                return (
                  <tr key={s.id} className={`border-b border-gray-100 ${r ? '' : 'opacity-70'}`}>
                    <td className="py-2 px-4"><p className="font-medium text-gray-900 text-xs">{s.name}</p><p className="text-xs text-gray-400">{s.admissionNumber ?? ''}</p></td>
                    <td className="py-2 px-3 text-xs text-gray-500">{s.grade}</td>
                    <td className="py-2 px-3 text-center">
                      <input type="checkbox" checked={!!r} onChange={() => toggleLunch(s.id)} className="h-4 w-4" />
                    </td>
                    {r ? (
                      <>
                        <td className="py-2 px-3 text-right">
                          <input type="number" min="0" defaultValue={r.amountDue || 0} key={`d-${r.id}-${r.amountDue}`} onBlur={e => setDue(r, e.target.value)} className="w-20 border border-gray-200 rounded px-1.5 py-1 text-right text-xs" />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input type="number" min="0" defaultValue={r.amountPaid || 0} key={`p-${r.id}-${r.amountPaid}`} onBlur={e => setPaid(r, e.target.value)} className="w-20 border border-gray-200 rounded px-1.5 py-1 text-right text-xs" />
                        </td>
                        <td className={`py-2 px-3 text-right font-medium text-xs ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>K{bal.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <select value={r.method || ''} onChange={e => setMethod(r, e.target.value)} className="border border-gray-200 rounded px-1.5 py-1 text-xs">
                            <option value="">—</option>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input type="date" value={r.date ? r.date.split('T')[0] : ''} onChange={e => setDate(r, e.target.value)} className="border border-gray-200 rounded px-1.5 py-1 text-xs" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {bal > 0 && <button onClick={() => markPaid(r)} title="Mark fully paid" className="inline-flex items-center gap-1 text-xs text-green-700 border border-green-200 hover:bg-green-50 rounded px-2 py-1"><Check className="h-3 w-3" />Paid</button>}
                        </td>
                      </>
                    ) : (
                      <td colSpan={6} className="py-2 px-3 text-xs text-gray-400">Not on the lunch list this period</td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-gray-400">No pupils match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {periodRecords.length > 0 && <p className="text-xs text-gray-400">Tip: use “On lunch only” to see just the lunch register, then Print list for the kitchen.</p>}
    </div>
  );
}
