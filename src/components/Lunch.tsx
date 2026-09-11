import { useState } from 'react';
import { Utensils, Printer, FileDown, Search, Check, CalendarRange, Plus, Trash2, Pencil, ChefHat } from 'lucide-react';
import { useAppContext, LunchRecord, LunchPeriod } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { esc, emitDoc, DOC_FONT } from '../lib/print';

const METHODS = ['Cash', 'Mobile Money', 'Bank Transfer', 'Other'];

const money = (n: number) => `K${(n || 0).toLocaleString()}`;
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const dayOf = (iso?: string) => (iso || '').slice(0, 10);

// What the register is currently billing for: either a defined LunchPeriod (with
// a real date range) or a plain label carried over from terms / legacy records.
interface ActivePeriod { id?: string; label: string; startDate?: string; endDate?: string; defaultFee?: number }

export function Lunch() {
  const {
    students, terms, currentTerm, branding, expenses,
    lunchRecords, addLunchRecord, updateLunchRecord, deleteLunchRecord,
    lunchPeriods, addLunchPeriod, updateLunchPeriod, deleteLunchPeriod,
  } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();

  const sortedPeriods = [...lunchPeriods].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

  // Labels that exist only as plain strings (terms, or older records) and have no
  // defined period — still selectable so nothing gets lost.
  const definedLabels = new Set(sortedPeriods.map(p => p.label));
  const plainLabels = [...new Set([...(terms || []), ...lunchRecords.filter(r => !r.periodId).map(r => r.period)])]
    .filter(l => l && !definedLabels.has(l));

  const initialKey = sortedPeriods[0] ? `id:${sortedPeriods[0].id}` : `lbl:${currentTerm || terms[0] || 'Term 1 2026'}`;
  const [selKey, setSelKey] = useState(initialKey);
  const [fee, setFee] = useState('');
  const [search, setSearch] = useState('');
  const [onlyOnLunch, setOnlyOnLunch] = useState(false);
  const [showPeriods, setShowPeriods] = useState(false);

  // Resolve the current selection into an ActivePeriod.
  const active: ActivePeriod = (() => {
    if (selKey.startsWith('id:')) {
      const p = sortedPeriods.find(x => x.id === selKey.slice(3));
      if (p) return { id: p.id, label: p.label, startDate: p.startDate, endDate: p.endDate, defaultFee: p.defaultFee };
    }
    return { label: selKey.startsWith('lbl:') ? selKey.slice(4) : selKey };
  })();

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const belongs = (r: LunchRecord) => active.id
    ? (r.periodId === active.id || (!r.periodId && r.period === active.label))
    : (!r.periodId && r.period === active.label);
  const recordFor = (studentId: string) => lunchRecords.find(r => r.studentId === studentId && belongs(r));
  const periodRecords = lunchRecords.filter(belongs);

  const defaultFee = () => parseFloat(fee) || active.defaultFee || 0;

  const toggleLunch = (studentId: string) => {
    const existing = recordFor(studentId);
    if (existing) deleteLunchRecord(existing.id);
    else addLunchRecord({
      id: `lunch-${studentId}-${Date.now()}`,
      studentId, period: active.label, periodId: active.id,
      amountDue: defaultFee(), amountPaid: 0,
    });
  };
  const setDue = (r: LunchRecord, v: string) => updateLunchRecord(r.id, { amountDue: parseFloat(v) || 0 });
  const setPaid = (r: LunchRecord, v: string) => {
    const paid = Math.max(0, parseFloat(v) || 0);
    const nowPaying = paid > 0;
    updateLunchRecord(r.id, {
      amountPaid: paid,
      date: nowPaying ? (r.date || new Date().toISOString()) : r.date,
      coveredFrom: nowPaying ? (r.coveredFrom || active.startDate || today()) : r.coveredFrom,
      coveredUntil: nowPaying ? (r.coveredUntil || active.endDate) : r.coveredUntil,
    });
  };
  const setMethod = (r: LunchRecord, m: string) => updateLunchRecord(r.id, { method: m });
  const setDate = (r: LunchRecord, v: string) => updateLunchRecord(r.id, { date: v ? new Date(v).toISOString() : undefined });
  const setCoveredUntil = (r: LunchRecord, v: string) => updateLunchRecord(r.id, { coveredUntil: v || undefined });
  const markPaid = (r: LunchRecord) => updateLunchRecord(r.id, {
    amountPaid: r.amountDue,
    date: r.date || new Date().toISOString(),
    coveredFrom: r.coveredFrom || active.startDate || today(),
    coveredUntil: r.coveredUntil || active.endDate,
  });
  const applyFeeToAll = () => {
    const f = defaultFee();
    if (!f) { toast('Enter a default lunch fee first.', 'warning'); return; }
    periodRecords.forEach(r => updateLunchRecord(r.id, { amountDue: f }));
    toast(`Applied ${money(f)} to ${periodRecords.length} pupil(s) on lunch.`, 'success');
  };

  const onLunchCount = periodRecords.length;
  const collected = periodRecords.reduce((s, r) => s + (r.amountPaid || 0), 0);
  const outstanding = periodRecords.reduce((s, r) => s + Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0)), 0);

  // Kitchen utilisation: how much of the lunch money collected for this period
  // has been spent on food over the same date range. Only meaningful when the
  // period has real start/end dates.
  const hasRange = !!(active.startDate && active.endDate);
  const inRange = (iso?: string) => hasRange && !!iso && dayOf(iso) >= active.startDate! && dayOf(iso) <= active.endDate!;
  const foodSpend = hasRange ? expenses.filter(e => e.category === 'Food' && inRange(e.date)).reduce((s, e) => s + e.amount, 0) : 0;
  const utilPct = collected > 0 ? Math.min(100, Math.round((foodSpend / collected) * 100)) : 0;
  const netKitchen = collected - foodSpend;

  const studentOf = (id: string) => students.find(s => s.id === id);

  const rows = activeStudents
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.admissionNumber || '').toLowerCase().includes(search.toLowerCase()) || (s.guardianName || '').toLowerCase().includes(search.toLowerCase()))
    .filter(s => !onlyOnLunch || recordFor(s.id));

  const rangeLabel = hasRange ? `${fmtDate(active.startDate)} – ${fmtDate(active.endDate)}` : 'no dates set';

  // ---- Period management ----
  const [pForm, setPForm] = useState({ label: '', startDate: '', endDate: '', defaultFee: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const resetPForm = () => { setPForm({ label: '', startDate: '', endDate: '', defaultFee: '' }); setEditId(null); };
  const savePeriod = () => {
    if (!pForm.label.trim()) { toast('Give the period a name, e.g. "Month 1".', 'warning'); return; }
    if (!pForm.startDate || !pForm.endDate) { toast('Set both a start and an end date.', 'warning'); return; }
    if (pForm.endDate < pForm.startDate) { toast('End date cannot be before the start date.', 'warning'); return; }
    const data = {
      label: pForm.label.trim(), startDate: pForm.startDate, endDate: pForm.endDate,
      defaultFee: parseFloat(pForm.defaultFee) || undefined,
    };
    if (editId) { updateLunchPeriod(editId, data); toast('Period updated.', 'success'); }
    else {
      const id = `lp-${Date.now()}`;
      addLunchPeriod({ id, ...data });
      setSelKey(`id:${id}`);
      toast(`Added lunch period "${data.label}".`, 'success');
    }
    resetPForm();
  };
  const editPeriod = (p: LunchPeriod) => { setEditId(p.id); setPForm({ label: p.label, startDate: dayOf(p.startDate), endDate: dayOf(p.endDate), defaultFee: p.defaultFee ? String(p.defaultFee) : '' }); setShowPeriods(true); };
  const removePeriod = (p: LunchPeriod) => {
    const used = lunchRecords.some(r => r.periodId === p.id);
    if (used && !window.confirm(`"${p.label}" has pupils on its lunch list. Delete the period anyway? Their records stay but lose the date range.`)) return;
    deleteLunchPeriod(p.id);
    if (selKey === `id:${p.id}`) setSelKey(sortedPeriods.filter(x => x.id !== p.id)[0] ? `id:${sortedPeriods.filter(x => x.id !== p.id)[0].id}` : `lbl:${currentTerm || terms[0] || 'Term 1 2026'}`);
    toast('Period deleted.', 'info');
  };
  // Quick helper: turn a calendar month into a period spanning the whole month.
  const [quickMonth, setQuickMonth] = useState('');
  const addMonthPeriod = () => {
    if (!quickMonth) { toast('Pick a month first.', 'warning'); return; }
    const [y, m] = quickMonth.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const label = start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (sortedPeriods.some(p => p.label === label)) { toast(`"${label}" already exists.`, 'warning'); return; }
    const id = `lp-${Date.now()}`;
    addLunchPeriod({ id, label, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), defaultFee: parseFloat(fee) || undefined });
    setSelKey(`id:${id}`);
    setQuickMonth('');
    toast(`Added "${label}".`, 'success');
  };

  const printList = (pdf = false) => {
    const list = periodRecords
      .map(r => ({ r, s: studentOf(r.studentId) }))
      .filter(x => x.s)
      .sort((a, b) => (a.s!.name).localeCompare(b.s!.name));
    if (!list.length) { toast('No pupils on the lunch list for this period yet.', 'warning'); return; }
    const body = list.map(({ r, s }, i) => {
      const bal = Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0));
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px 8px">${i + 1}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${esc(s!.name)}<div style="font-size:9px;color:#777">${esc(s!.guardianName || '')}${s!.guardianPhone ? ' · ' + esc(s!.guardianPhone) : ''}</div></td>
        <td style="border:1px solid #ccc;padding:6px 8px">${esc(s!.grade)}</td>
        <td style="border:1px solid #ccc;padding:6px 8px;text-align:right">${money(r.amountDue || 0)}</td>
        <td style="border:1px solid #ccc;padding:6px 8px;text-align:right;color:#15803d">${money(r.amountPaid || 0)}</td>
        <td style="border:1px solid #ccc;padding:6px 8px;text-align:right;color:${bal > 0 ? '#b91c1c' : '#6b7280'}">${money(bal)}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${esc(r.method || '')}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${r.date ? new Date(r.date).toLocaleDateString('en-GB') : ''}</td>
        <td style="border:1px solid #ccc;padding:6px 8px">${r.coveredUntil ? new Date(r.coveredUntil).toLocaleDateString('en-GB') : ''}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><title>Lunch List – ${esc(active.label)}</title>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:${DOC_FONT};color:#111}table{border-collapse:collapse;width:100%;font-size:12px}th{background:#f0f0f0;border:1px solid #ccc;padding:6px 8px;text-align:left}@media print{button{display:none}}</style></head>
      <body>
        <div style="text-align:center;margin-bottom:10px">
          ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
          <div style="font-size:16pt;font-weight:700">${esc(branding.schoolName) || 'School'}</div>
          <div style="font-size:12pt;font-weight:600">Lunch List — ${esc(active.label)}</div>
          <div style="font-size:10pt;color:#555">${hasRange ? esc(rangeLabel) + ' · ' : ''}${list.length} pupils · Collected ${money(collected)} · Outstanding ${money(outstanding)}</div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Pupil / Guardian</th><th>Class</th><th style="text-align:right">Fee</th><th style="text-align:right">Paid</th><th style="text-align:right">Balance</th><th>Method</th><th>Date paid</th><th>Covered to</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
        <p style="margin-top:14px;font-size:10px;color:#888">Printed ${new Date().toLocaleDateString('en-GB')}</p>
        <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`;
    emitDoc(html, `Lunch_List_${active.label.replace(/\s+/g, '_')}`, pdf ? 'pdf' : 'print');
  };

  const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Utensils className="h-6 w-6" />Lunch List</h1>
          <p className="text-gray-600">Track who is on lunch, what they’ve paid and how long they’re covered — and how that money feeds the kitchen</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => printList()} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Printer className="h-4 w-4" />Print list</button>
          <button title="Export lunch list to PDF" onClick={() => printList(true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm hover:bg-gray-50"><FileDown className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <label className="text-xs font-medium text-gray-500">Lunch period
          <select value={selKey} onChange={e => setSelKey(e.target.value)} className={`${inp} block mt-1 min-w-[220px]`}>
            {sortedPeriods.length > 0 && (
              <optgroup label="Defined periods">
                {sortedPeriods.map(p => <option key={p.id} value={`id:${p.id}`}>{p.label}{p.startDate ? ` (${fmtDate(p.startDate)} – ${fmtDate(p.endDate)})` : ''}</option>)}
              </optgroup>
            )}
            {plainLabels.length > 0 && (
              <optgroup label="Terms / other">
                {plainLabels.map(l => <option key={l} value={`lbl:${l}`}>{l}</option>)}
              </optgroup>
            )}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">Default lunch fee (K)
          <input type="number" min="0" value={fee} onChange={e => setFee(e.target.value)} placeholder={active.defaultFee ? String(active.defaultFee) : 'e.g. 150'} className={`${inp} block mt-1 w-28`} />
        </label>
        <button onClick={applyFeeToAll} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Apply fee to all on lunch</button>
        <button onClick={() => setShowPeriods(v => !v)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><CalendarRange className="h-4 w-4" />Manage periods</button>
        <span className="text-xs text-gray-400 ml-auto self-center flex items-center gap-1.5"><CalendarRange className="h-3.5 w-3.5" />{active.label}: <strong className="text-gray-600">{rangeLabel}</strong></span>
      </div>

      {/* Period management */}
      {showPeriods && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2"><CalendarRange className={`h-5 w-5 ${tc.text}`} /><p className="font-semibold text-gray-900">Lunch periods</p><span className="text-xs text-gray-400">Assign a span (e.g. “Month 1”, 1–30 Sep) and its default fee</span></div>

          {sortedPeriods.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {sortedPeriods.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-900 min-w-[120px]">{p.label}</span>
                  <span className="text-gray-500 text-xs flex-1">{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</span>
                  <span className="text-gray-500 text-xs">{p.defaultFee ? `default ${money(p.defaultFee)}` : 'no default fee'}</span>
                  <button onClick={() => editPeriod(p)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removePeriod(p)} className="p-1.5 text-gray-300 hover:text-red-500" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-end bg-gray-50 rounded-lg p-3">
            <label className="text-xs font-medium text-gray-500">Name
              <input value={pForm.label} onChange={e => setPForm({ ...pForm, label: e.target.value })} placeholder="Month 1" className={`${inp} block mt-1 w-32`} />
            </label>
            <label className="text-xs font-medium text-gray-500">From
              <input type="date" value={pForm.startDate} onChange={e => setPForm({ ...pForm, startDate: e.target.value })} className={`${inp} block mt-1`} />
            </label>
            <label className="text-xs font-medium text-gray-500">To
              <input type="date" value={pForm.endDate} onChange={e => setPForm({ ...pForm, endDate: e.target.value })} className={`${inp} block mt-1`} />
            </label>
            <label className="text-xs font-medium text-gray-500">Default fee (K)
              <input type="number" min="0" value={pForm.defaultFee} onChange={e => setPForm({ ...pForm, defaultFee: e.target.value })} placeholder="150" className={`${inp} block mt-1 w-24`} />
            </label>
            <button onClick={savePeriod} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />{editId ? 'Save' : 'Add period'}</button>
            {editId && <button onClick={resetPForm} className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2">Cancel</button>}
            <span className="mx-2 text-gray-300">|</span>
            <label className="text-xs font-medium text-gray-500">Quick add a whole month
              <div className="flex items-center gap-2 mt-1">
                <input type="month" value={quickMonth} onChange={e => setQuickMonth(e.target.value)} className={inp} />
                <button onClick={addMonthPeriod} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">Add month</button>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">On lunch</p><p className="text-2xl font-bold text-gray-900">{onLunchCount}</p><p className="text-xs text-gray-400 mt-0.5">{active.label}</p></div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-sm text-green-700">Collected</p><p className="text-2xl font-bold text-green-800">{money(collected)}</p></div>
        <div className={`rounded-lg border p-4 ${outstanding > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}><p className="text-sm text-gray-500">Outstanding</p><p className={`text-2xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-gray-900'}`}>{money(outstanding)}</p></div>
        <div className={`rounded-lg border p-4 ${netKitchen >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
          <p className="text-sm text-gray-600 flex items-center gap-1"><ChefHat className="h-3.5 w-3.5" />Kitchen use</p>
          {hasRange ? (
            <>
              <p className={`text-2xl font-bold ${netKitchen >= 0 ? 'text-blue-800' : 'text-amber-800'}`}>{money(foodSpend)}</p>
              <p className="text-xs text-gray-500 mt-0.5">spent on food · {netKitchen >= 0 ? `${money(netKitchen)} left` : `over by ${money(-netKitchen)}`}</p>
            </>
          ) : <p className="text-xs text-gray-400 mt-2">Set period dates to link food spend</p>}
        </div>
      </div>

      {hasRange && collected > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Lunch money used on food ({rangeLabel})</span>
            <span className="font-semibold text-gray-900">{utilPct}% · {money(foodSpend)} of {money(collected)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${utilPct < 75 ? 'bg-green-500' : utilPct < 100 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${utilPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Food spend comes from Kitchen groceries &amp; Food expenses dated within this period. {netKitchen >= 0 ? 'The kitchen is running within the lunch money collected.' : 'Spending has exceeded lunch money — topped up from school funds.'}</p>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pupil, admission no. or guardian…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={onlyOnLunch} onChange={e => setOnlyOnLunch(e.target.checked)} />On lunch only</label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ background: 'var(--gha-primary, #1d4ed8)' }}>
                <th className="py-3 px-4 text-left font-medium">Pupil / Guardian</th>
                <th className="py-3 px-3 text-left font-medium">Class</th>
                <th className="py-3 px-3 text-center font-medium">On lunch</th>
                <th className="py-3 px-3 text-right font-medium">Fee (K)</th>
                <th className="py-3 px-3 text-right font-medium">Paid (K)</th>
                <th className="py-3 px-3 text-right font-medium">Balance</th>
                <th className="py-3 px-3 text-left font-medium">Method</th>
                <th className="py-3 px-3 text-left font-medium">Date paid</th>
                <th className="py-3 px-3 text-left font-medium">Covered until</th>
                <th className="py-3 px-3 text-center font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const r = recordFor(s.id);
                const bal = r ? Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0)) : 0;
                const lapsed = !!(r?.coveredUntil && dayOf(r.coveredUntil) < today());
                return (
                  <tr key={s.id} className={`border-b border-gray-100 ${r ? '' : 'opacity-70'}`}>
                    <td className="py-2 px-4">
                      <p className="font-medium text-gray-900 text-xs">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.admissionNumber ? `#${s.admissionNumber} · ` : ''}{s.guardianName || ''}{s.guardianPhone ? ` · ${s.guardianPhone}` : ''}</p>
                    </td>
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
                        <td className={`py-2 px-3 text-right font-medium text-xs ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>{money(bal)}</td>
                        <td className="py-2 px-3">
                          <select value={r.method || ''} onChange={e => setMethod(r, e.target.value)} className="border border-gray-200 rounded px-1.5 py-1 text-xs">
                            <option value="">—</option>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input type="date" value={r.date ? r.date.split('T')[0] : ''} onChange={e => setDate(r, e.target.value)} className="border border-gray-200 rounded px-1.5 py-1 text-xs" />
                        </td>
                        <td className="py-2 px-3">
                          <input type="date" value={dayOf(r.coveredUntil)} onChange={e => setCoveredUntil(r, e.target.value)} className={`border rounded px-1.5 py-1 text-xs ${lapsed ? 'border-red-300 text-red-600' : 'border-gray-200'}`} />
                          {lapsed && <p className="text-[10px] text-red-500 mt-0.5">lapsed</p>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {bal > 0 && <button onClick={() => markPaid(r)} title="Mark fully paid" className="inline-flex items-center gap-1 text-xs text-green-700 border border-green-200 hover:bg-green-50 rounded px-2 py-1"><Check className="h-3 w-3" />Paid</button>}
                        </td>
                      </>
                    ) : (
                      <td colSpan={7} className="py-2 px-3 text-xs text-gray-400">Not on the lunch list this period</td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-gray-400">No pupils match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {periodRecords.length > 0 && <p className="text-xs text-gray-400">Tip: “Covered until” shows how long a payment keeps a pupil on lunch — it defaults to the period’s end date and turns red once it lapses. Use “On lunch only”, then Print list for the kitchen.</p>}
    </div>
  );
}
