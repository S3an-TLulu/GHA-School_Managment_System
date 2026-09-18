import { useState, Fragment } from 'react';
import { GraduationCap, Utensils, Bus, Printer, FileDown, ChevronRight, Percent, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { esc, emitDoc, DOC_FONT } from '../lib/print';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const money = (n: number) => `K${Math.round(n || 0).toLocaleString()}`;

type Tab = 'fees' | 'lunch' | 'transport';

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
  const [expanded, setExpanded] = useState<string | null>(null);

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

  // ---- Per-student tuition edit ----
  const setStudentTuition = (id: string, raw: string) => {
    const v = raw.trim() === '' ? undefined : Math.max(0, parseFloat(raw) || 0);
    updateStudent(id, { tuitionFee: v });
  };
  const resetStudentTuition = (id: string) => updateStudent(id, { tuitionFee: undefined, tuitionDiscountReason: undefined });
  const setStudentReason = (id: string, v: string) => updateStudent(id, { tuitionDiscountReason: v || undefined });

  const TABS: { id: Tab; label: string; icon: typeof GraduationCap }[] = [
    { id: 'fees', label: 'School Fees', icon: GraduationCap },
    { id: 'lunch', label: 'Lunch', icon: Utensils },
    { id: 'transport', label: 'Transport', icon: Bus },
  ];

  const print = (pdf = false) => {
    let cols: string[] = [], body = '', foot = '', title = '';
    if (tab === 'fees') {
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
                    <Fragment key={r.grade}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-900">
                          <button onClick={() => setExpanded(expanded === r.grade ? null : r.grade)} className="inline-flex items-center gap-1 hover:text-blue-600">
                            <ChevronRight className={`h-4 w-4 transition-transform ${expanded === r.grade ? 'rotate-90' : ''}`} />{r.grade}
                          </button>
                        </td>
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
                      {expanded === r.grade && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={7} className="px-4 py-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Set a pupil’s tuition (leave blank = class price {money(r.price)}). A lower amount is a discount / bursary.</p>
                            <div className="space-y-1.5">
                              {r.studs.map(s => {
                                const disc = s.tuitionFee != null && s.tuitionFee < r.price;
                                return (
                                  <div key={s.id} className="flex items-center gap-2 flex-wrap text-sm">
                                    <span className="min-w-[160px] text-gray-900">{s.name}</span>
                                    <span className="text-gray-400 text-xs">K</span>
                                    <input type="number" min="0" defaultValue={s.tuitionFee ?? ''} key={`tf-${s.id}-${s.tuitionFee ?? ''}`} placeholder={String(r.price)} onBlur={e => setStudentTuition(s.id, e.target.value)} className={`w-24 border rounded px-1.5 py-1 text-right text-xs ${disc ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`} />
                                    <input defaultValue={s.tuitionDiscountReason || ''} key={`tr-${s.id}-${s.tuitionDiscountReason || ''}`} placeholder="reason (e.g. staff, bursary)" onBlur={e => setStudentReason(s.id, e.target.value)} className="flex-1 min-w-[160px] border border-gray-200 rounded px-1.5 py-1 text-xs" />
                                    {disc && <span className="text-xs text-amber-700">−{money(r.price - (s.tuitionFee || 0))}</span>}
                                    {s.tuitionFee != null && <button onClick={() => resetStudentTuition(s.id)} title="Reset to class price" className="p-1 text-gray-400 hover:text-gray-700"><RotateCcw className="h-3.5 w-3.5" /></button>}
                                  </div>
                                );
                              })}
                              {r.studs.length === 0 && <p className="text-xs text-gray-400">No pupils in this class.</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          <p className="text-xs text-gray-400">“Tuition price” edits the class fee (Fee Structure). Expand a class to give a pupil a discounted tuition — that lowers what the class is billed. “Received” = Tuition &amp; Enrollment payments for the selected term; “Owed” = billed − received.</p>
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
