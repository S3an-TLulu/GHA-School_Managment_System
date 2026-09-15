import { useState } from 'react';
import { Wallet, GraduationCap, Utensils, Bus, Printer, FileDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { esc, emitDoc, DOC_FONT } from '../lib/print';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const money = (n: number) => `K${Math.round(n || 0).toLocaleString()}`;

// School fees are kept deliberately separate from lunch and transport here so the
// office can read each class's tuition position without the extras muddying it.
// "School fees" = payments of type "Tuition Fee" (+ Enrollment Form); lunch comes
// from the Lunch List records; transport from bus assignments and Transport fees.
export function ClassFees() {
  const { students, feeStructure, payments, lunchRecords, transportRoutes, terms, currentTerm, branding } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();
  const [term, setTerm] = useState(currentTerm || terms[0] || 'All terms');

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const gradesPresent = [
    ...GRADES.filter(g => activeStudents.some(s => s.grade === g)),
    ...[...new Set(activeStudents.map(s => s.grade))].filter(g => g && !GRADES.includes(g)),
  ];

  const feeFor = (grade: string) => feeStructure.find(f => f.className === grade)?.cashFee || 0;
  const routeFee = (routeId?: string) => transportRoutes.find(r => r.id === routeId)?.monthlyFee || 0;
  const matchesTerm = (t?: string) => term === 'All terms' || !t || t === term;
  const isSchoolFee = (type: string) => type === 'Tuition Fee' || type === 'Enrollment Form';

  const rows = gradesPresent.map(grade => {
    const studs = activeStudents.filter(s => s.grade === grade);
    const ids = new Set(studs.map(s => s.id));
    const pupils = studs.length;

    // School fees — expected per term from the fee structure, paid from tuition payments.
    const feeExpected = feeFor(grade) * pupils;
    const feePaid = payments
      .filter(p => ids.has(p.studentId) && isSchoolFee(p.type) && p.status === 'paid' && matchesTerm(p.term))
      .reduce((s, p) => s + p.amount, 0);
    const feeOwing = Math.max(0, feeExpected - feePaid);

    // Lunch — from the Lunch List records (all periods), kept separate from fees.
    const lunchRecs = lunchRecords.filter(r => ids.has(r.studentId));
    const lunchDue = lunchRecs.reduce((s, r) => s + (r.amountDue || 0), 0);
    const lunchPaid = lunchRecs.reduce((s, r) => s + (r.amountPaid || 0), 0);
    const lunchOwing = Math.max(0, lunchDue - lunchPaid);

    // Transport — expected monthly from bus assignments, paid from transport fees.
    const transportExpected = studs.reduce((s, st) => s + routeFee(st.transportRouteId), 0);
    const transportRiders = studs.filter(s => s.transportRouteId).length;
    const transportPaid = payments
      .filter(p => ids.has(p.studentId) && p.type === 'Transport' && p.status === 'paid' && matchesTerm(p.term))
      .reduce((s, p) => s + p.amount, 0);

    return { grade, pupils, feeExpected, feePaid, feeOwing, lunchDue, lunchPaid, lunchOwing, transportExpected, transportRiders, transportPaid };
  });

  const tot = rows.reduce((a, r) => ({
    pupils: a.pupils + r.pupils, feeExpected: a.feeExpected + r.feeExpected, feePaid: a.feePaid + r.feePaid, feeOwing: a.feeOwing + r.feeOwing,
    lunchDue: a.lunchDue + r.lunchDue, lunchPaid: a.lunchPaid + r.lunchPaid, lunchOwing: a.lunchOwing + r.lunchOwing,
    transportExpected: a.transportExpected + r.transportExpected, transportRiders: a.transportRiders + r.transportRiders, transportPaid: a.transportPaid + r.transportPaid,
  }), { pupils: 0, feeExpected: 0, feePaid: 0, feeOwing: 0, lunchDue: 0, lunchPaid: 0, lunchOwing: 0, transportExpected: 0, transportRiders: 0, transportPaid: 0 });

  const print = (pdf = false) => {
    if (!rows.length) { toast('No classes with pupils yet.', 'warning'); return; }
    const body = rows.map(r => `<tr>
      <td style="border:1px solid #ccc;padding:5px 7px">${esc(r.grade)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:center">${r.pupils}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(r.feeExpected)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right;color:#15803d">${money(r.feePaid)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right;color:${r.feeOwing > 0 ? '#b91c1c' : '#6b7280'}">${money(r.feeOwing)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(r.lunchPaid)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right;color:${r.lunchOwing > 0 ? '#b91c1c' : '#6b7280'}">${money(r.lunchOwing)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(r.transportPaid)}</td>
      <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(r.transportExpected)}/mo</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Class Fees – ${esc(term)}</title>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:${DOC_FONT};color:#111}table{border-collapse:collapse;width:100%;font-size:11px}th{background:#f0f0f0;border:1px solid #ccc;padding:5px 7px;text-align:left}@media print{button{display:none}}</style></head>
      <body>
        <div style="text-align:center;margin-bottom:10px">
          ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:contain" />` : ''}
          <div style="font-size:16pt;font-weight:700">${esc(branding.schoolName) || 'School'}</div>
          <div style="font-size:12pt;font-weight:600">Fees by Class — ${esc(term)}</div>
          <div style="font-size:9pt;color:#555">School fees shown separately from lunch and transport</div>
        </div>
        <table>
          <thead><tr>
            <th>Class</th><th style="text-align:center">Pupils</th>
            <th style="text-align:right">Fees expected/term</th><th style="text-align:right">Fees paid</th><th style="text-align:right">Fees owing</th>
            <th style="text-align:right">Lunch paid</th><th style="text-align:right">Lunch owing</th>
            <th style="text-align:right">Transport paid</th><th style="text-align:right">Transport expected</th>
          </tr></thead>
          <tbody>${body}</tbody>
          <tfoot><tr style="font-weight:700;background:#f7f7f7">
            <td style="border:1px solid #ccc;padding:5px 7px">Total</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:center">${tot.pupils}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.feeExpected)}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.feePaid)}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.feeOwing)}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.lunchPaid)}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.lunchOwing)}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.transportPaid)}</td>
            <td style="border:1px solid #ccc;padding:5px 7px;text-align:right">${money(tot.transportExpected)}/mo</td>
          </tr></tfoot>
        </table>
        <p style="margin-top:12px;font-size:9px;color:#888">Printed ${new Date().toLocaleDateString('en-GB')}. Fees = Tuition &amp; Enrollment payments; lunch across all periods; transport from bus assignments.</p>
        <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`;
    emitDoc(html, `Class_Fees_${term.replace(/\s+/g, '_')}`, pdf ? 'pdf' : 'print');
  };

  const th = 'py-2.5 px-3 text-right font-medium';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wallet className="h-6 w-6" />Fees by Class</h1>
          <p className="text-gray-600">School fees per class, kept separate from lunch and transport</p>
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

      {/* Separated school-wide totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><GraduationCap className="h-4 w-4 text-blue-600" /><p className="text-sm text-blue-700 font-medium">School fees</p></div>
          <p className="text-2xl font-bold text-blue-900">{money(tot.feePaid)} <span className="text-sm font-normal text-blue-600">paid</span></p>
          <p className="text-xs text-blue-600 mt-0.5">{money(tot.feeOwing)} owing of {money(tot.feeExpected)} expected</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><Utensils className="h-4 w-4 text-amber-600" /><p className="text-sm text-amber-700 font-medium">Lunch</p></div>
          <p className="text-2xl font-bold text-amber-900">{money(tot.lunchPaid)} <span className="text-sm font-normal text-amber-600">paid</span></p>
          <p className="text-xs text-amber-600 mt-0.5">{money(tot.lunchOwing)} owing · all periods</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><Bus className="h-4 w-4 text-teal-600" /><p className="text-sm text-teal-700 font-medium">Transport</p></div>
          <p className="text-2xl font-bold text-teal-900">{money(tot.transportPaid)} <span className="text-sm font-normal text-teal-600">paid</span></p>
          <p className="text-xs text-teal-600 mt-0.5">{money(tot.transportExpected)}/mo expected · {tot.transportRiders} riders</p>
        </div>
      </div>

      {/* Per-class table with the three streams clearly separated */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide">
                <th className="py-2 px-3 text-left bg-gray-100"></th>
                <th className="py-2 px-3 text-center bg-gray-100"></th>
                <th colSpan={3} className="py-2 px-3 text-center bg-blue-100 text-blue-800 border-l border-white">School Fees</th>
                <th colSpan={2} className="py-2 px-3 text-center bg-amber-100 text-amber-800 border-l border-white">Lunch</th>
                <th colSpan={2} className="py-2 px-3 text-center bg-teal-100 text-teal-800 border-l border-white">Transport</th>
              </tr>
              <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="py-2 px-3 text-left font-medium">Class</th>
                <th className="py-2 px-3 text-center font-medium">Pupils</th>
                <th className={`${th} border-l border-gray-200`}>Expected/term</th>
                <th className={th}>Paid</th>
                <th className={th}>Owing</th>
                <th className={`${th} border-l border-gray-200`}>Paid</th>
                <th className={th}>Owing</th>
                <th className={`${th} border-l border-gray-200`}>Paid</th>
                <th className={th}>Expected/mo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.grade} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-900">{r.grade}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{r.pupils}</td>
                  <td className="py-2 px-3 text-right text-gray-600 border-l border-gray-100">{money(r.feeExpected)}</td>
                  <td className="py-2 px-3 text-right text-green-700 font-medium">{money(r.feePaid)}</td>
                  <td className={`py-2 px-3 text-right font-medium ${r.feeOwing > 0 ? 'text-red-600' : 'text-gray-400'}`}>{money(r.feeOwing)}</td>
                  <td className="py-2 px-3 text-right text-green-700 font-medium border-l border-gray-100">{money(r.lunchPaid)}</td>
                  <td className={`py-2 px-3 text-right font-medium ${r.lunchOwing > 0 ? 'text-red-600' : 'text-gray-400'}`}>{money(r.lunchOwing)}</td>
                  <td className="py-2 px-3 text-right text-green-700 font-medium border-l border-gray-100">{money(r.transportPaid)}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{money(r.transportExpected)}<span className="text-xs text-gray-400">/mo</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-gray-400">No classes with active pupils yet.</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                  <td className="py-2.5 px-3">Total</td>
                  <td className="py-2.5 px-3 text-center">{tot.pupils}</td>
                  <td className="py-2.5 px-3 text-right border-l border-gray-100">{money(tot.feeExpected)}</td>
                  <td className="py-2.5 px-3 text-right text-green-700">{money(tot.feePaid)}</td>
                  <td className="py-2.5 px-3 text-right text-red-600">{money(tot.feeOwing)}</td>
                  <td className="py-2.5 px-3 text-right text-green-700 border-l border-gray-100">{money(tot.lunchPaid)}</td>
                  <td className="py-2.5 px-3 text-right text-red-600">{money(tot.lunchOwing)}</td>
                  <td className="py-2.5 px-3 text-right text-green-700 border-l border-gray-100">{money(tot.transportPaid)}</td>
                  <td className="py-2.5 px-3 text-right">{money(tot.transportExpected)}/mo</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400">School fees come from <strong>Tuition&nbsp;Fee</strong> &amp; <strong>Enrollment&nbsp;Form</strong> payments (expected from the Fee Structure per class). Lunch totals come from the Lunch List across all periods; transport from bus assignments and <strong>Transport</strong> payments. Term filter applies to fee &amp; transport payments.</p>
    </div>
  );
}
