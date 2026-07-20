import { useState } from 'react';
import { Wallet, HandCoins, Baby, Trash2, Printer, Check, Search, CalendarClock, Eye, EyeOff, ListChecks, Landmark, Banknote, Smartphone } from 'lucide-react';
import { useAppContext, Teacher, PayrollRecord } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

type PayMethod = 'Bank' | 'Cash' | 'Mobile Money';
const PAY_METHODS: PayMethod[] = ['Bank', 'Cash', 'Mobile Money'];
const METHOD_ICON: Record<PayMethod, typeof Landmark> = {
  'Bank': Landmark, 'Cash': Banknote, 'Mobile Money': Smartphone,
};

export function HR() {
  const {
    teachers, students, payments, updateTeacher, branding,
    salaryAdvances, addSalaryAdvance, deleteSalaryAdvance,
    payrollRecords, savePayrollRecord,
    budgets, setBudget,
  } = useAppContext();

  // Pay-day of the month (school-wide), stored alongside budgets
  const payDay = budgets['payday'] ?? 25;
  const today = new Date();
  const thisMonthPayday = new Date(today.getFullYear(), today.getMonth(), Math.min(payDay, 28));
  const nextPayday = today.getDate() <= thisMonthPayday.getDate()
    ? thisMonthPayday
    : new Date(today.getFullYear(), today.getMonth() + 1, Math.min(payDay, 28));
  const daysToPayday = Math.ceil((nextPayday.getTime() - today.getTime()) / 86400000);
  const { toast } = useToast();
  const tc = useThemeClasses();

  const [tab, setTab] = useState<'payroll' | 'overview' | 'advances' | 'children'>('payroll');
  const [month, setMonth] = useState(currentMonth);
  const [advForm, setAdvForm] = useState({ teacherId: '', amount: '', date: new Date().toISOString().split('T')[0], month: currentMonth(), notes: '' });
  const [childSearch, setChildSearch] = useState('');
  // Salary Overview tab: privacy toggle + one-staff-at-a-time search
  const [showSalaries, setShowSalaries] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  // per-teacher editable payroll inputs for the selected month
  const [drafts, setDrafts] = useState<Record<string, { allowances: string; feeDeduction: string; otherDeductions: string; notes: string; paymentMethod: PayMethod }>>({});

  const activeTeachers = teachers.filter(t => t.status === 'active');
  const activeStudents = students.filter(s => !s.status || s.status === 'active');

  const teacherChildren = (teacherId: string) => activeStudents.filter(s => s.teacherParentId === teacherId);
  const childOutstanding = (studentId: string) =>
    payments.filter(p => p.studentId === studentId && p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  const monthAdvances = (teacherId: string) =>
    salaryAdvances.filter(a => a.teacherId === teacherId && a.month === month).reduce((s, a) => s + a.amount, 0);

  const recordFor = (teacherId: string) =>
    payrollRecords.find(r => r.teacherId === teacherId && r.month === month);

  const draftFor = (t: Teacher) => {
    const existing = recordFor(t.id);
    return drafts[t.id] ?? {
      allowances: existing ? String(existing.allowances) : '0',
      feeDeduction: existing ? String(existing.feeDeduction) : String(teacherChildren(t.id).reduce((s, c) => s + childOutstanding(c.id), 0) || 0),
      otherDeductions: existing ? String(existing.otherDeductions) : '0',
      notes: existing?.notes ?? '',
      paymentMethod: existing?.paymentMethod ?? 'Bank',
    };
  };

  const setDraft = (teacherId: string, field: 'allowances' | 'feeDeduction' | 'otherDeductions' | 'notes', value: string) =>
    setDrafts(prev => ({ ...prev, [teacherId]: { ...draftFor(teachers.find(t => t.id === teacherId)!), [field]: value } }));
  const setMethod = (teacherId: string, method: PayMethod) =>
    setDrafts(prev => ({ ...prev, [teacherId]: { ...draftFor(teachers.find(t => t.id === teacherId)!), paymentMethod: method } }));

  const buildRecord = (t: Teacher, markPaid: boolean): PayrollRecord => {
    const d = draftFor(t);
    const existing = recordFor(t.id);
    return {
      id: existing?.id || `pay-${t.id}-${month}`,
      teacherId: t.id,
      month,
      baseSalary: t.baseSalary ?? 0,
      allowances: parseFloat(d.allowances) || 0,
      advancesDeducted: monthAdvances(t.id),
      feeDeduction: parseFloat(d.feeDeduction) || 0,
      otherDeductions: parseFloat(d.otherDeductions) || 0,
      notes: d.notes || undefined,
      status: markPaid ? 'paid' : (existing?.status ?? 'pending'),
      paidDate: markPaid ? new Date().toISOString() : existing?.paidDate,
      paymentMethod: d.paymentMethod,
    };
  };

  const netPay = (r: PayrollRecord) =>
    r.baseSalary + r.allowances - r.advancesDeducted - r.feeDeduction - r.otherDeductions;

  const printPayslip = (t: Teacher) => {
    const r = buildRecord(t, false);
    const rows = [
      ['Basic Salary', r.baseSalary, false],
      ['Allowances', r.allowances, false],
      ['Salary Advances', -r.advancesDeducted, true],
      ['School Fees (own children)', -r.feeDeduction, true],
      ['Other Deductions', -r.otherDeductions, true],
    ] as [string, number, boolean][];
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Payslip — ${t.name} — ${month}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1a2332; max-width: 560px; margin: 24px auto; }
        .doc { border: 2px solid #12274a; border-radius: 10px; padding: 26px 30px; }
        .hd { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #12274a; padding-bottom: 12px; margin-bottom: 16px; }
        .school { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #12274a; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        td { padding: 8px 10px; border-bottom: 1px solid #dde4ef; }
        td.amt { text-align: right; font-weight: 600; }
        .neg { color: #b91c1c; }
        .net td { border-top: 2px solid #12274a; font-weight: 700; font-size: 15px; color: #12274a; }
        .meta { font-size: 12px; color: #5a6b85; margin-bottom: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
        .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 42px; }
        .sig div { border-top: 1px solid #12274a; padding-top: 5px; font-size: 11px; color: #5a6b85; text-align: center; }
      </style></head><body><div class="doc">
      <div class="hd">
        ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="width:54px;height:54px;object-fit:contain">` : ''}
        <div>
          <div class="school">${branding.schoolName}</div>
          <div style="font-size:11px;color:#5a6b85">${branding.address} · ${branding.phone}</div>
        </div>
        <div style="margin-left:auto;font-size:12px;font-weight:700;color:#12274a;letter-spacing:0.08em">PAYSLIP</div>
      </div>
      <div class="meta">
        <div><strong>Employee:</strong> ${t.name}</div>
        <div><strong>Month:</strong> ${monthLabel(month)}</div>
        <div><strong>Role:</strong> ${t.role}</div>
        <div><strong>Status:</strong> ${recordFor(t.id)?.status === 'paid' ? 'PAID' : 'Pending'}</div>
      </div>
      <table>
        ${rows.map(([label, amt, neg]) => `<tr><td>${label}</td><td class="amt ${neg && amt !== 0 ? 'neg' : ''}">${amt < 0 ? '−' : ''}K${Math.abs(amt).toLocaleString()}</td></tr>`).join('')}
        <tr class="net"><td>NET PAY</td><td class="amt">K${netPay(r).toLocaleString()}</td></tr>
      </table>
      ${r.notes ? `<p style="font-size:11.5px;color:#5a6b85;margin-top:10px">Notes: ${r.notes}</p>` : ''}
      <div class="sig"><div>Employee Signature</div><div>${branding.principalName} — Principal</div></div>
      </div><script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`);
    win.document.close();
  };

  const totalNetForMonth = activeTeachers.reduce((sum, t) => sum + netPay(buildRecord(t, false)), 0);
  const paidCount = activeTeachers.filter(t => recordFor(t.id)?.status === 'paid').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Payroll</h1>
          <p className="text-gray-600">Salaries, advances, deductions and staff children</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'payroll' as const, label: 'Payroll', icon: Wallet },
            { id: 'overview' as const, label: 'Salary Overview', icon: ListChecks },
            { id: 'advances' as const, label: 'Advances', icon: HandCoins },
            { id: 'children' as const, label: 'Staff Children', icon: Baby },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="h-4 w-4" /><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- PAYROLL ---------------- */}
      {tab === 'payroll' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Month:</label>
              <input type="month" value={month} onChange={e => { setMonth(e.target.value); setDrafts({}); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <CalendarClock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 text-xs">Pay-day:</span>
                <input type="number" min="1" max="28" value={payDay}
                  onChange={e => setBudget('payday', Math.min(28, Math.max(1, parseInt(e.target.value) || 25)))}
                  className="w-14 px-2 py-0.5 border border-blue-300 rounded text-xs text-center focus:ring-1 focus:ring-blue-400" />
                <span className="text-xs text-blue-700 font-medium">
                  next: {nextPayday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {daysToPayday <= 7 ? ` — ${daysToPayday === 0 ? 'TODAY!' : `in ${daysToPayday} day${daysToPayday !== 1 ? 's' : ''}`}` : ''}
                </span>
              </div>
              <span className="text-gray-500">{paidCount} / {activeTeachers.length} paid</span>
              <span className="font-semibold text-gray-900">Total net: K{totalNetForMonth.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            {activeTeachers.map(t => {
              const d = draftFor(t);
              const existing = recordFor(t.id);
              const rec = buildRecord(t, false);
              const net = netPay(rec);
              const children = teacherChildren(t.id);
              const isPaid = existing?.status === 'paid';
              return (
                <div key={t.id} className={`bg-white rounded-lg border shadow-sm overflow-hidden ${isPaid ? 'border-green-200' : 'border-gray-200'}`}>
                  <div className={`px-5 py-3 flex items-center justify-between flex-wrap gap-2 ${isPaid ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-gray-900">{t.name}
                        {isPaid && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">PAID{existing?.paidDate ? ` · ${new Date(existing.paidDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}` : ''}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{t.role}{t.assignedClass ? ` · ${t.assignedClass}` : ''}{children.length > 0 ? ` · ${children.length} child${children.length !== 1 ? 'ren' : ''} in school` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => printPayslip(t)}
                        className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 hover:bg-gray-100 rounded-lg px-2.5 py-1.5">
                        <Printer className="h-3.5 w-3.5" />Payslip
                      </button>
                      <button onClick={() => { savePayrollRecord(buildRecord(t, false)); toast(`Payroll saved for ${t.name}.`, 'success'); }}
                        className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg px-2.5 py-1.5">
                        Save
                      </button>
                      {!isPaid ? (
                        <button onClick={() => { savePayrollRecord(buildRecord(t, true)); toast(`${t.name} marked as paid — K${net.toLocaleString()}.`, 'success'); }}
                          className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-1.5 font-medium">
                          <Check className="h-3.5 w-3.5" />Mark Paid
                        </button>
                      ) : (
                        <button onClick={() => { savePayrollRecord({ ...buildRecord(t, false), status: 'pending', paidDate: undefined }); toast('Reverted to pending.', 'info'); }}
                          className="text-xs text-gray-500 border border-gray-300 hover:bg-gray-100 rounded-lg px-2.5 py-1.5">
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Base Salary (K)</label>
                      <input type="number" min="0" value={t.baseSalary ?? ''}
                        onChange={e => updateTeacher(t.id, { baseSalary: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Allowances (K)</label>
                      <input type="number" min="0" value={d.allowances}
                        onChange={e => setDraft(t.id, 'allowances', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Advances (auto)</label>
                      <div className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-red-600 font-medium">
                        −K{monthAdvances(t.id).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fees — own children (K)</label>
                      <input type="number" min="0" value={d.feeDeduction}
                        onChange={e => setDraft(t.id, 'feeDeduction', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Other Deductions (K)</label>
                      <input type="number" min="0" value={d.otherDeductions}
                        onChange={e => setDraft(t.id, 'otherDeductions', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Net Pay</label>
                      <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold ${net >= 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        K{net.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-6 flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-500">Paid via:</span>
                        {PAY_METHODS.map(m => {
                          const Icon = METHOD_ICON[m];
                          const on = d.paymentMethod === m;
                          return (
                            <button key={m} type="button" onClick={() => setMethod(t.id, m)}
                              className={`inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 border transition-colors ${on ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              <Icon className="h-3 w-3" />{m}
                            </button>
                          );
                        })}
                      </div>
                      <input value={d.notes} onChange={e => setDraft(t.id, 'notes', e.target.value)}
                        placeholder="Notes for this month's payslip (optional)…"
                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              );
            })}
            {activeTeachers.length === 0 && (
              <p className="text-center py-12 text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg">
                No active staff — add teachers in Staff &amp; Teachers first.
              </p>
            )}
          </div>
        </>
      )}

      {/* ---------------- SALARY OVERVIEW ---------------- */}
      {tab === 'overview' && (() => {
        const staffList = activeTeachers.filter(t =>
          !staffSearch || t.name.toLowerCase().includes(staffSearch.toLowerCase()));
        const chosen = activeTeachers.find(t => t.id === selectedStaff);
        const mask = (v: number) => showSalaries ? `K${v.toLocaleString()}` : '••••••';
        const methodOf = (t: Teacher) => recordFor(t.id)?.paymentMethod ?? draftFor(t).paymentMethod;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Month:</label>
                <input type="month" value={month} onChange={e => { setMonth(e.target.value); setDrafts({}); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <button onClick={() => setShowSalaries(s => !s)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${showSalaries ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                {showSalaries ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSalaries ? 'Hide salaries' : 'Show salaries'}
              </button>
            </div>

            {/* One staff at a time */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <p className="font-semibold text-gray-900 mb-1">Look up one member of staff</p>
              <p className="text-xs text-gray-500 mb-3">Search a name to see exactly what that person is being paid this month.</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search staff by name…"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              {staffSearch && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {staffList.map(t => (
                    <button key={t.id} onClick={() => setSelectedStaff(t.id)}
                      className={`text-xs font-medium rounded-lg px-2.5 py-1 border ${selectedStaff === t.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t.name}
                    </button>
                  ))}
                  {staffList.length === 0 && <span className="text-xs text-gray-400">No staff match.</span>}
                </div>
              )}
              {chosen ? (() => {
                const rec = buildRecord(chosen, false);
                const net = netPay(rec);
                const paid = recordFor(chosen.id)?.status === 'paid';
                const Icon = METHOD_ICON[methodOf(chosen)];
                const rows: [string, number, boolean][] = [
                  ['Base Salary', rec.baseSalary, false],
                  ['Allowances', rec.allowances, false],
                  ['Advances', -rec.advancesDeducted, true],
                  ['Fees (own children)', -rec.feeDeduction, true],
                  ['Other Deductions', -rec.otherDeductions, true],
                ];
                return (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{chosen.name}</p>
                        <p className="text-xs text-gray-500">{chosen.role} · {monthLabel(month)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Icon className="h-3 w-3" />{methodOf(chosen)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {paid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5 text-sm">
                      {rows.map(([label, amt, neg]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-medium ${neg && amt !== 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {showSalaries ? `${amt < 0 ? '−' : ''}K${Math.abs(amt).toLocaleString()}` : '••••••'}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 mt-1 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Net Pay</span>
                        <span className={`font-bold ${tc.text}`}>{mask(net)}</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-sm text-gray-400 text-center py-6">Search and pick a staff member to see their pay slip figures.</p>
              )}
            </div>

            {/* All-staff summary table (amounts hidden until "Show salaries") */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">All staff — {monthLabel(month)}</p>
                <p className="text-xs text-gray-500">{paidCount} / {activeTeachers.length} paid</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>{['Staff', 'Role', 'Net Pay', 'Paid Via', 'Status'].map(h =>
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeTeachers.map(t => {
                      const net = netPay(buildRecord(t, false));
                      const paid = recordFor(t.id)?.status === 'paid';
                      const Icon = METHOD_ICON[methodOf(t)];
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-5 py-2.5 font-medium text-gray-900">{t.name}</td>
                          <td className="px-5 py-2.5 text-gray-500">{t.role}</td>
                          <td className="px-5 py-2.5 font-semibold text-gray-900">{mask(net)}</td>
                          <td className="px-5 py-2.5 text-gray-600">
                            <span className="inline-flex items-center gap-1"><Icon className="h-3.5 w-3.5 text-gray-400" />{methodOf(t)}</span>
                          </td>
                          <td className="px-5 py-2.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              {paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {activeTeachers.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No active staff.</td></tr>
                    )}
                  </tbody>
                  {showSalaries && activeTeachers.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-5 py-2.5 text-gray-700" colSpan={2}>Total net payroll</td>
                        <td className="px-5 py-2.5 text-gray-900" colSpan={3}>K{totalNetForMonth.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---------------- ADVANCES ---------------- */}
      {tab === 'advances' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p className="font-semibold text-gray-900 mb-3">Record Salary Advance</p>
            <form className="space-y-3" onSubmit={e => {
              e.preventDefault();
              const amount = parseFloat(advForm.amount);
              if (!advForm.teacherId || isNaN(amount) || amount <= 0) { toast('Pick a teacher and a valid amount.', 'warning'); return; }
              addSalaryAdvance({
                id: `adv-${Date.now()}`,
                teacherId: advForm.teacherId,
                amount,
                date: new Date(advForm.date).toISOString(),
                month: advForm.month,
                notes: advForm.notes || undefined,
              });
              setAdvForm({ ...advForm, amount: '', notes: '' });
              toast('Advance recorded — it will be deducted from that month\'s payroll.', 'success');
            }}>
              <select value={advForm.teacherId} onChange={e => setAdvForm({ ...advForm, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">— Select teacher —</option>
                {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="number" min="0" step="0.01" placeholder="Amount (K)" value={advForm.amount}
                onChange={e => setAdvForm({ ...advForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Given on</label>
                  <input type="date" value={advForm.date} onChange={e => setAdvForm({ ...advForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Deduct from month</label>
                  <input type="month" value={advForm.month} onChange={e => setAdvForm({ ...advForm, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <input placeholder="Notes (optional)" value={advForm.notes}
                onChange={e => setAdvForm({ ...advForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button type="submit" className={`w-full ${tc.btn} text-white py-2 rounded-lg text-sm font-medium`}>Record Advance</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex justify-between">
              <p className="text-sm font-semibold text-gray-700">Advance history</p>
              <p className="text-sm text-gray-500">Total: K{salaryAdvances.reduce((s, a) => s + a.amount, 0).toLocaleString()}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>{['Teacher', 'Amount', 'Given', 'Deducted From', 'Notes', ''].map(h =>
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...salaryAdvances].sort((a, b) => b.date.localeCompare(a.date)).map(a => {
                    const t = teachers.find(x => x.id === a.teacherId);
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{t?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 font-semibold text-red-600">K{a.amount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(a.date).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-2.5 text-gray-600">{monthLabel(a.month)}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[160px] truncate">{a.notes || '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => { deleteSalaryAdvance(a.id); toast('Advance removed.', 'info'); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {salaryAdvances.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No advances recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STAFF CHILDREN ---------------- */}
      {tab === 'children' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200">
              <p className="font-semibold text-gray-900 mb-1">Link a student to a staff member</p>
              <p className="text-xs text-gray-500 mb-3">Linked children's outstanding fees are suggested as payroll deductions for that teacher.</p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input value={childSearch} onChange={e => setChildSearch(e.target.value)} placeholder="Search students…"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[26rem] overflow-y-auto">
              {activeStudents
                .filter(s => !childSearch || s.name.toLowerCase().includes(childSearch.toLowerCase()))
                .map(s => {
                  const parent = s.teacherParentId ? teachers.find(t => t.id === s.teacherParentId) : null;
                  return (
                    <div key={s.id} className="px-5 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.grade}{parent ? ` · child of ${parent.name}` : ''}</p>
                      </div>
                      <StaffParentSelect studentId={s.id} current={s.teacherParentId || ''} />
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="space-y-4">
            {activeTeachers.map(t => {
              const children = teacherChildren(t.id);
              if (children.length === 0) return null;
              const totalOwed = children.reduce((s, c) => s + childOutstanding(c.id), 0);
              return (
                <div key={t.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalOwed > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                      {totalOwed > 0 ? `K${totalOwed.toLocaleString()} fees outstanding` : 'Fees up to date'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {children.map(c => {
                      const owed = childOutstanding(c.id);
                      return (
                        <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                          <span className="text-gray-900">{c.name} <span className="text-xs text-gray-500">· {c.grade}</span></span>
                          <span className={owed > 0 ? 'text-amber-700 font-semibold' : 'text-green-600'}>
                            {owed > 0 ? `K${owed.toLocaleString()} due` : 'Paid up'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    This total is auto-suggested in the "Fees — own children" column on the Payroll tab.
                  </p>
                </div>
              );
            })}
            {activeTeachers.every(t => teacherChildren(t.id).length === 0) && (
              <div className="text-center py-12 text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg">
                <Baby className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No staff children linked yet — use the panel on the left.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Small child component so the select can call updateStudent from context cleanly
function StaffParentSelect({ studentId, current }: { studentId: string; current: string }) {
  const { teachers, updateStudent } = useAppContext();
  const { toast } = useToast();
  const activeTeachers = teachers.filter(t => t.status === 'active');
  return (
    <select value={current}
      onChange={e => {
        updateStudent(studentId, { teacherParentId: e.target.value || undefined });
        toast(e.target.value ? 'Student linked to staff member.' : 'Link removed.', 'success');
      }}
      className="text-xs border border-gray-300 rounded px-2 py-1.5 text-gray-600 focus:ring-1 focus:ring-blue-500 flex-shrink-0 max-w-[150px]">
      <option value="">Not staff child</option>
      {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}
