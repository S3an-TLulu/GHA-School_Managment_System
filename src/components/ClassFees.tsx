import { useState } from 'react';
import { GraduationCap, Utensils, Bus, Printer, FileDown, Percent, Users, FileSpreadsheet, MoreVertical, Eye, Pencil } from 'lucide-react';
import { useAppContext, Student } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { esc, emitDoc, DOC_FONT } from '../lib/print';
import { exportCSV } from '../lib/exports';
import { StudentProfile } from './StudentProfile';
import { StudentModal } from './StudentModal';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const money = (n: number) => `K${Math.round(n || 0).toLocaleString()}`;

type Tab = 'fees' | 'pupils' | 'lunch' | 'transport';

// School fees, lunch and transport are shown on their own tabs so each stream
// reads cleanly per class and school-wide. School fees = "Tuition Fee" (+
// "Enrollment Form") payments; the amount billed comes from the class tuition
// price, with per-pupil overrides for bursaries / staff discounts.
export function ClassFees() {
  const {
    students, feeStructure, payments, lunchRecords, transportRoutes, terms, currentTerm, branding,
    addFeeStructureItem, updateFeeStructureItem, updateStudent,
  } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('fees');
  const [term, setTerm] = useState(currentTerm || terms[0] || 'All terms');
  // Row actions on the Tuition by Pupil tab (view profile / edit details).
  const [menuFor, setMenuFor] = useState<{ id: string; x: number; y: number } | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const openMenuStudent = (id: string) => students.find(s => s.id === id) || null;

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const gradesPresent = [
    ...GRADES.filter(g => activeStudents.some(s => s.grade === g)),
    ...[...new Set(activeStudents.map(s => s.grade))].filter(g => g && !GRADES.includes(g)),
  ];

  const classFee = (grade: string) => feeStructure.find(f => f.className === grade)?.cashFee || 0;
  const effTuition = (s: typeof students[number]) => s.tuitionFee ?? classFee(s.grade);
  const routeFee = (routeId?: string) => transportRoutes.find(r => r.id === routeId)?.monthlyFee || 0;
  const matchesTerm = (t?: string) => term === 'All terms' || !t || t === term;
  const isSchoolFee = (type: string) => type === 'Tuition Fee' || type === 'Enrollment Form';

  const setClassFee = (grade: string, v: number) => {
    const item = feeStructure.find(f => f.className === grade);
    if (item) updateFeeStructureItem(item.id, { cashFee: v });
    else addFeeStructureItem({ id: `fee-${Date.now()}`, className: grade, description: '', cashFee: v, installmentFee: v });
  };

  // ---- School fees per class ----
  const feeRows = gradesPresent.map(grade => {
    const studs = activeStudents.filter(s => s.grade === grade);
    const ids = new Set(studs.map(s => s.id));
    const price = classFee(grade);
    const billed = studs.reduce((s, st) => s + effTuition(st), 0);
    const received = payments.filter(p => ids.has(p.studentId) && isSchoolFee(p.type) && p.status === 'paid' && matchesTerm(p.term)).reduce((s, p) => s + p.amount, 0);
    const owed = Math.max(0, billed - received);
    const discounted = studs.filter(s => s.tuitionFee != null && s.tuitionFee < price).length;
    return { grade, studs, pupils: studs.length, price, billed, received, owed, discounted };
  });
  // ---- Tuition paid per pupil, grouped by class ----
  const tuitionPaidFor = (studentId: string) =>
    payments.filter(p => p.studentId === studentId && isSchoolFee(p.type) && p.status === 'paid' && matchesTerm(p.term)).reduce((s, p) => s + p.amount, 0);
  const pupilGroups = gradesPresent.map(grade => {
    const pupils = activeStudents
      .filter(s => s.grade === grade)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => {
        const billed = effTuition(s);
        const paid = tuitionPaidFor(s.id);
        return { id: s.id, name: s.name, adm: s.admissionNumber || '', billed, paid, balance: Math.max(0, billed - paid) };
      });
    return {
      grade, pupils,
      billed: pupils.reduce((s, p) => s + p.billed, 0),
      paid: pupils.reduce((s, p) => s + p.paid, 0),
      balance: pupils.reduce((s, p) => s + p.balance, 0),
    };
  }).filter(g => g.pupils.length > 0);
  const pupilTotals = {
    pupils: pupilGroups.reduce((s, g) => s + g.pupils.length, 0),
    billed: pupilGroups.reduce((s, g) => s + g.billed, 0),
    paid: pupilGroups.reduce((s, g) => s + g.paid, 0),
    balance: pupilGroups.reduce((s, g) => s + g.balance, 0),
  };

  // ---- Lunch per class (all periods) ----
  const lunchRows = gradesPresent.map(grade => {
    const ids = new Set(activeStudents.filter(s => s.grade === grade).map(s => s.id));
    const recs = lunchRecords.filter(r => ids.has(r.studentId));
    const onLunch = new Set(recs.map(r => r.studentId)).size;
    const received = recs.reduce((s, r) => s + (r.amountPaid || 0), 0);
    const owed = recs.reduce((s, r) => s + Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0)), 0);
    return { grade, onLunch, received, owed, billed: received + owed };
  });
  // ---- Transport per class ----
  const transportRows = gradesPresent.map(grade => {
    const studs = activeStudents.filter(s => s.grade === grade);
    const ids = new Set(studs.map(s => s.id));
    const riders = studs.filter(s => s.transportRouteId).length;
    const expected = studs.reduce((s, st) => s + routeFee(st.transportRouteId), 0);
    const received = payments.filter(p => ids.has(p.studentId) && p.type === 'Transport' && p.status === 'paid' && matchesTerm(p.term)).reduce((s, p) => s + p.amount, 0);
    return { grade, riders, received, expected, owed: Math.max(0, expected - received) };
  });

  const sum = <T,>(rows: T[], k: (r: T) => number) => rows.reduce((s, r) => s + k(r), 0);

  const TABS: { id: Tab; label: string; icon: typeof GraduationCap }[] = [
    { id: 'fees', label: 'School Fees', icon: GraduationCap },
    { id: 'pupils', label: 'Tuition by Pupil', icon: Users },
    { id: 'lunch', label: 'Lunch', icon: Utensils },
    { id: 'transport', label: 'Transport', icon: Bus },
  ];

  const print = (pdf = false) => {
    let cols: string[] = [], body = '', foot = '', title = '';
    if (tab === 'pupils') {
      title = 'Tuition by Pupil';
      cols = ['#', 'Pupil', 'Adm. No.', '~Billed', '~Paid', '~Balance'];
      body = pupilGroups.map(g => {
        const header = `<tr style="background:#eef2ff;font-weight:700"><td colspan="6">${esc(g.grade)} — ${g.pupils.length} pupils</td></tr>`;
        const rows = g.pupils.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}</td><td>${esc(p.adm)}</td><td style="text-align:right">${money(p.billed)}</td><td style="text-align:right;color:#15803d">${money(p.paid)}</td><td style="text-align:right;color:${p.balance > 0 ? '#b91c1c' : '#6b7280'}">${money(p.balance)}</td></tr>`).join('');
        const sub = `<tr style="font-weight:600;background:#f7f7f7"><td colspan="3">Subtotal — ${esc(g.grade)}</td><td style="text-align:right">${money(g.billed)}</td><td style="text-align:right">${money(g.paid)}</td><td style="text-align:right">${money(g.balance)}</td></tr>`;
        return header + rows + sub;
      }).join('');
      foot = `<tr style="font-weight:700;background:#f0f0f0"><td colspan="3">Whole school — ${pupilTotals.pupils} pupils</td><td style="text-align:right">${money(pupilTotals.billed)}</td><td style="text-align:right">${money(pupilTotals.paid)}</td><td style="text-align:right">${money(pupilTotals.balance)}</td></tr>`;
    } else if (tab === 'fees') {
      title = 'School Fees by Class';
      cols = ['Class', '~Pupils', '~Tuition price', '~Billed (class total)', '~Received', '~Owed'];
      body = feeRows.map(r => `<tr><td>${esc(r.grade)}</td><td style="text-align:right">${r.pupils}${r.discounted ? ` (${r.discounted} disc.)` : ''}</td><td style="text-align:right">${money(r.price)}</td><td style="text-align:right">${money(r.billed)}</td><td style="text-align:right;color:#15803d">${money(r.received)}</td><td style="text-align:right;color:${r.owed > 0 ? '#b91c1c' : '#6b7280'}">${money(r.owed)}</td></tr>`).join('');
      foot = `<tr style="font-weight:700;background:#f7f7f7"><td>Whole school</td><td style="text-align:right">${sum(feeRows, r => r.pupils)}</td><td></td><td style="text-align:right">${money(sum(feeRows, r => r.billed))}</td><td style="text-align:right">${money(sum(feeRows, r => r.received))}</td><td style="text-align:right">${money(sum(feeRows, r => r.owed))}</td></tr>`;
    } else if (tab === 'lunch') {
      title = 'Lunch by Class';
      cols = ['Class', '~On lunch', '~Received', '~Owed', '~Total'];
      body = lunchRows.map(r => `<tr><td>${esc(r.grade)}</td><td style="text-align:right">${r.onLunch}</td><td style="text-align:right;color:#15803d">${money(r.received)}</td><td style="text-align:right;color:${r.owed > 0 ? '#b91c1c' : '#6b7280'}">${money(r.owed)}</td><td style="text-align:right">${money(r.billed)}</td></tr>`).join('');
      foot = `<tr style="font-weight:700;background:#f7f7f7"><td>Whole school</td><td style="text-align:right">${sum(lunchRows, r => r.onLunch)}</td><td style="text-align:right">${money(sum(lunchRows, r => r.received))}</td><td style="text-align:right">${money(sum(lunchRows, r => r.owed))}</td><td style="text-align:right">${money(sum(lunchRows, r => r.billed))}</td></tr>`;
    } else {
      title = 'Transport by Class';
      cols = ['Class', '~Riders', '~Received', '~Expected/mo', '~Owed'];
      body = transportRows.map(r => `<tr><td>${esc(r.grade)}</td><td style="text-align:right">${r.riders}</td><td style="text-align:right;color:#15803d">${money(r.received)}</td><td style="text-align:right">${money(r.expected)}</td><td style="text-align:right;color:${r.owed > 0 ? '#b91c1c' : '#6b7280'}">${money(r.owed)}</td></tr>`).join('');
      foot = `<tr style="font-weight:700;background:#f7f7f7"><td>Whole school</td><td style="text-align:right">${sum(transportRows, r => r.riders)}</td><td style="text-align:right">${money(sum(transportRows, r => r.received))}</td><td style="text-align:right">${money(sum(transportRows, r => r.expected))}</td><td style="text-align:right">${money(sum(transportRows, r => r.owed))}</td></tr>`;
    }
    if (!gradesPresent.length) { toast('No classes with pupils yet.', 'warning'); return; }
    const head = `<thead><tr>${cols.map(c => `<th${c.startsWith('~') ? ' style="text-align:right"' : ''}>${esc(c.replace(/^~/, ''))}</th>`).join('')}</tr></thead>`;
    const html = `<!DOCTYPE html><html><head><title>${esc(title)} – ${esc(term)}</title>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:${DOC_FONT};color:#111}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f0f0}@media print{button{display:none}}</style></head>
      <body>
        <div style="text-align:center;margin-bottom:10px">
          ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
          <div style="font-size:16pt;font-weight:700">${esc(branding.schoolName) || 'School'}</div>
          <div style="font-size:12pt;font-weight:600">${esc(title)} — ${esc(term)}</div>
        </div>
        <table>${head}<tbody>${body}</tbody><tfoot>${foot}</tfoot></table>
        <p style="margin-top:12px;font-size:9px;color:#888">Printed ${new Date().toLocaleDateString('en-GB')}</p>
        <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`;
    emitDoc(html, `${title.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}`, pdf ? 'pdf' : 'print');
  };

  // Export the active tab as a CSV (table format).
  const exportCsv = () => {
    if (!gradesPresent.length) { toast('Nothing to export yet.', 'warning'); return; }
    let name = '', headers: string[] = [];
    const rows: (string | number)[][] = [];
    if (tab === 'pupils') {
      name = 'Tuition_by_Pupil';
      headers = ['Class', 'Pupil', 'Admission No.', 'Tuition billed', 'Tuition paid', 'Balance'];
      pupilGroups.forEach(g => g.pupils.forEach(p => rows.push([g.grade, p.name, p.adm, p.billed, p.paid, p.balance])));
      rows.push(['TOTAL', '', '', pupilTotals.billed, pupilTotals.paid, pupilTotals.balance]);
    } else if (tab === 'fees') {
      name = 'School_Fees_by_Class';
      headers = ['Class', 'Pupils', 'Tuition price', 'Billed', 'Received', 'Owed'];
      feeRows.forEach(r => rows.push([r.grade, r.pupils, r.price, r.billed, r.received, r.owed]));
      rows.push(['TOTAL', sum(feeRows, r => r.pupils), '', sum(feeRows, r => r.billed), sum(feeRows, r => r.received), sum(feeRows, r => r.owed)]);
    } else if (tab === 'lunch') {
      name = 'Lunch_by_Class';
      headers = ['Class', 'On lunch', 'Received', 'Owed', 'Total'];
      lunchRows.forEach(r => rows.push([r.grade, r.onLunch, r.received, r.owed, r.billed]));
      rows.push(['TOTAL', sum(lunchRows, r => r.onLunch), sum(lunchRows, r => r.received), sum(lunchRows, r => r.owed), sum(lunchRows, r => r.billed)]);
    } else {
      name = 'Transport_by_Class';
      headers = ['Class', 'Riders', 'Received', 'Expected/mo', 'Owed'];
      transportRows.forEach(r => rows.push([r.grade, r.riders, r.received, r.expected, r.owed]));
      rows.push(['TOTAL', sum(transportRows, r => r.riders), sum(transportRows, r => r.received), sum(transportRows, r => r.expected), sum(transportRows, r => r.owed)]);
    }
    exportCSV(`${name}_${term.replace(/\s+/g, '_')}`, headers, rows);
    toast('CSV exported.', 'success');
  };

  const numCell = 'py-2 px-3 text-right';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><GraduationCap className="h-6 w-6" />Fees by Class</h1>
          <p className="text-gray-600">School fees, lunch and transport per class — on their own tabs</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Term
            <select value={term} onChange={e => setTerm(e.target.value)} className="ml-2 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="All terms">All terms</option>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <button onClick={() => print()} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Printer className="h-4 w-4" />Print</button>
          <button title="Export to PDF" onClick={() => print(true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm hover:bg-gray-50"><FileDown className="h-4 w-4" /></button>
          <button title="Export to CSV" onClick={exportCsv} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-2.5 py-2 rounded-lg text-sm hover:bg-gray-50"><FileSpreadsheet className="h-4 w-4" /><span className="hidden sm:inline">CSV</span></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ---------------- SCHOOL FEES ---------------- */}
      {tab === 'fees' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Pupils</p><p className="text-2xl font-bold text-gray-900">{sum(feeRows, r => r.pupils)}</p></div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-700">Billed (all classes)</p><p className="text-2xl font-bold text-blue-900">{money(sum(feeRows, r => r.billed))}</p></div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-sm text-green-700">Received</p><p className="text-2xl font-bold text-green-800">{money(sum(feeRows, r => r.received))}</p></div>
            <div className={`rounded-lg border p-4 ${sum(feeRows, r => r.owed) > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}><p className="text-sm text-gray-500">Owed</p><p className={`text-2xl font-bold ${sum(feeRows, r => r.owed) > 0 ? 'text-red-700' : 'text-gray-900'}`}>{money(sum(feeRows, r => r.owed))}</p></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-3 text-left font-medium">Class</th>
                    <th className="py-2.5 px-3 text-right font-medium">Pupils</th>
                    <th className="py-2.5 px-3 text-right font-medium">Tuition price</th>
                    <th className="py-2.5 px-3 text-right font-medium">Billed (class total)</th>
                    <th className="py-2.5 px-3 text-right font-medium">Received</th>
                    <th className="py-2.5 px-3 text-right font-medium">Owed</th>
                    <th className="py-2.5 px-3 text-center font-medium">Discounts</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map(r => (
                    <tr key={r.grade} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">{r.grade}</td>
                      <td className={`${numCell} text-gray-600`}>{r.pupils}</td>
                      <td className={numCell}>
                        <div className="inline-flex items-center">
                          <span className="text-gray-400 text-xs mr-1">K</span>
                          <input type="number" min="0" defaultValue={r.price} key={`price-${r.grade}-${r.price}`} onBlur={e => setClassFee(r.grade, parseFloat(e.target.value) || 0)} className="w-24 border border-gray-200 rounded px-1.5 py-1 text-right text-xs" />
                        </div>
                      </td>
                      <td className={`${numCell} text-gray-700`}>{money(r.billed)}</td>
                      <td className={`${numCell} text-green-700 font-medium`}>{money(r.received)}</td>
                      <td className={`${numCell} font-medium ${r.owed > 0 ? 'text-red-600' : 'text-gray-400'}`}>{money(r.owed)}</td>
                      <td className="py-2 px-3 text-center">
                        {r.discounted > 0
                          ? <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><Percent className="h-3 w-3" />{r.discounted}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                  {feeRows.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-gray-400">No classes with active pupils yet.</td></tr>}
                </tbody>
                {feeRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                      <td className="py-2.5 px-3">Whole school</td>
                      <td className={numCell}>{sum(feeRows, r => r.pupils)}</td>
                      <td className={numCell}></td>
                      <td className={numCell}>{money(sum(feeRows, r => r.billed))}</td>
                      <td className={`${numCell} text-green-700`}>{money(sum(feeRows, r => r.received))}</td>
                      <td className={`${numCell} text-red-600`}>{money(sum(feeRows, r => r.owed))}</td>
                      <td className="py-2.5 px-3 text-center">{sum(feeRows, r => r.discounted) || ''}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400">“Tuition price” edits the class fee (Fee Structure). Per-pupil discounts are set on the pupil’s profile (Students → view) or at the Office Cashier; they lower what the class is billed and show in the Discounts column. “Received” = Tuition &amp; Enrollment payments for the selected term; “Owed” = billed − received.</p>
        </>
      )}

      {/* ---------------- TUITION BY PUPIL ---------------- */}
      {tab === 'pupils' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Pupils</p><p className="text-2xl font-bold text-gray-900">{pupilTotals.pupils}</p></div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-700">Billed</p><p className="text-2xl font-bold text-blue-900">{money(pupilTotals.billed)}</p></div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-sm text-green-700">Tuition paid</p><p className="text-2xl font-bold text-green-800">{money(pupilTotals.paid)}</p></div>
            <div className={`rounded-lg border p-4 ${pupilTotals.balance > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}><p className="text-sm text-gray-500">Balance owed</p><p className={`text-2xl font-bold ${pupilTotals.balance > 0 ? 'text-red-700' : 'text-gray-900'}`}>{money(pupilTotals.balance)}</p></div>
          </div>

          {pupilGroups.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-400">No classes with active pupils yet.</div>
          )}

          {pupilGroups.map(g => (
            <div key={g.grade} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <p className="font-semibold text-gray-900">{g.grade} <span className="text-sm font-normal text-gray-500">· {g.pupils.length} pupils</span></p>
                <p className="text-sm text-gray-600">Paid <strong className="text-green-700">{money(g.paid)}</strong>{g.balance > 0 && <> · Owed <strong className="text-red-600">{money(g.balance)}</strong></>}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 bg-gray-50/60 border-b border-gray-100">
                      <th className="py-2 px-3 text-left font-medium w-8">#</th>
                      <th className="py-2 px-3 text-left font-medium">Pupil</th>
                      <th className="py-2 px-3 text-left font-medium">Admission No.</th>
                      <th className="py-2 px-3 text-right font-medium">Billed</th>
                      <th className="py-2 px-3 text-right font-medium">Tuition paid</th>
                      <th className="py-2 px-3 text-right font-medium">Balance</th>
                      <th className="py-2 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.pupils.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-3 font-medium text-gray-900">{p.name}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">{p.adm || '—'}</td>
                        <td className={`${numCell} text-gray-600`}>{money(p.billed)}</td>
                        <td className={`${numCell} text-green-700 font-medium`}>{money(p.paid)}</td>
                        <td className={`${numCell} font-medium ${p.balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>{money(p.balance)}</td>
                        <td className="py-2 px-2 text-right">
                          <button onClick={e => setMenuFor(menuFor?.id === p.id ? null : { id: p.id, x: e.clientX, y: e.clientY })}
                            title="Actions" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-gray-900 border-t border-gray-200">
                      <td className="py-2 px-3" colSpan={3}>Subtotal — {g.grade}</td>
                      <td className={numCell}>{money(g.billed)}</td>
                      <td className={`${numCell} text-green-700`}>{money(g.paid)}</td>
                      <td className={`${numCell} ${g.balance > 0 ? 'text-red-600' : ''}`}>{money(g.balance)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {pupilGroups.length > 0 && (
            <div className="bg-gray-900 text-white rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
              <p className="font-semibold">Whole school · {pupilTotals.pupils} pupils</p>
              <p className="text-sm">Billed {money(pupilTotals.billed)} · <span className="text-green-300">Paid {money(pupilTotals.paid)}</span> · <span className={pupilTotals.balance > 0 ? 'text-red-300' : ''}>Owed {money(pupilTotals.balance)}</span></p>
            </div>
          )}
          <p className="text-xs text-gray-400">Tuition paid per pupil account (Tuition &amp; Enrollment payments) for the selected term, grouped by class with class subtotals and a whole-school total. Use Print, PDF or CSV above to export this table.</p>
        </>
      )}

      {/* ---------------- LUNCH ---------------- */}
      {tab === 'lunch' && (
        <SimpleTable
          totalsLabel="Whole school"
          summary={[
            { label: 'On lunch', value: String(sum(lunchRows, r => r.onLunch)), tone: 'plain' },
            { label: 'Received', value: money(sum(lunchRows, r => r.received)), tone: 'green' },
            { label: 'Owed', value: money(sum(lunchRows, r => r.owed)), tone: sum(lunchRows, r => r.owed) > 0 ? 'red' : 'plain' },
          ]}
          cols={['Class', 'On lunch', 'Received', 'Owed', 'Total']}
          rows={lunchRows.map(r => [r.grade, String(r.onLunch), money(r.received), money(r.owed), money(r.billed)])}
          foot={['', String(sum(lunchRows, r => r.onLunch)), money(sum(lunchRows, r => r.received)), money(sum(lunchRows, r => r.owed)), money(sum(lunchRows, r => r.billed))]}
          note="Lunch totals come from the Lunch List across all periods."
        />
      )}

      {/* ---------------- TRANSPORT ---------------- */}
      {tab === 'transport' && (
        <SimpleTable
          totalsLabel="Whole school"
          summary={[
            { label: 'Riders', value: String(sum(transportRows, r => r.riders)), tone: 'plain' },
            { label: 'Received', value: money(sum(transportRows, r => r.received)), tone: 'green' },
            { label: 'Expected/mo', value: money(sum(transportRows, r => r.expected)), tone: 'plain' },
          ]}
          cols={['Class', 'Riders', 'Received', 'Expected/mo', 'Owed']}
          rows={transportRows.map(r => [r.grade, String(r.riders), money(r.received), money(r.expected), money(r.owed)])}
          foot={['', String(sum(transportRows, r => r.riders)), money(sum(transportRows, r => r.received)), money(sum(transportRows, r => r.expected)), money(sum(transportRows, r => r.owed))]}
          note="Transport totals come from bus assignments and Transport payments for the selected term."
        />
      )}

      {/* Row action menu (Tuition by Pupil) */}
      {menuFor && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuFor(null)} />
          <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44"
            style={{ top: Math.min(menuFor.y, window.innerHeight - 100), left: Math.min(menuFor.x, window.innerWidth - 180) }}>
            <button onClick={() => { const s = openMenuStudent(menuFor.id); setMenuFor(null); if (s) setProfileStudent(s); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
              <Eye className="h-4 w-4 text-gray-400" />View profile
            </button>
            <button onClick={() => { const s = openMenuStudent(menuFor.id); setMenuFor(null); if (s) setEditingStudent(s); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
              <Pencil className="h-4 w-4 text-gray-400" />Edit details
            </button>
          </div>
        </>
      )}

      {profileStudent && (
        <StudentProfile
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
          onEdit={s => { setProfileStudent(null); setEditingStudent(s); }}
        />
      )}

      {editingStudent && (
        <StudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={data => { updateStudent(editingStudent.id, data); toast(`${data.name}'s record updated.`, 'success'); setEditingStudent(null); }}
        />
      )}
    </div>
  );
}

// Compact per-class table used by the Lunch and Transport tabs.
function SimpleTable({ cols, rows, foot, totalsLabel, note, summary }: {
  cols: string[]; rows: string[][]; foot: string[]; totalsLabel: string; note: string;
  summary: { label: string; value: string; tone: 'plain' | 'green' | 'red' }[];
}) {
  const toneCls = { plain: 'bg-white border-gray-200 text-gray-900', green: 'bg-green-50 border-green-200 text-green-800', red: 'bg-red-50 border-red-200 text-red-700' };
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {summary.map(c => (
          <div key={c.label} className={`border rounded-lg p-4 ${toneCls[c.tone]}`}>
            <p className="text-sm opacity-80">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {cols.map((c, i) => <th key={c} className={`py-2.5 px-3 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r[0]} className="border-b border-gray-100 hover:bg-gray-50">
                  {r.map((cell, i) => <td key={i} className={`py-2 px-3 ${i === 0 ? 'text-left font-medium text-gray-900' : `text-right ${i === 2 ? 'text-green-700 font-medium' : 'text-gray-600'}`}`}>{cell}</td>)}
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={cols.length} className="py-12 text-center text-gray-400">No classes with active pupils yet.</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                  {foot.map((cell, i) => <td key={i} className={`py-2.5 px-3 ${i === 0 ? 'text-left' : 'text-right'}`}>{i === 0 ? totalsLabel : cell}</td>)}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">{note}</p>
    </>
  );
}
