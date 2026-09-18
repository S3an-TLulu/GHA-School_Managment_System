import { useState, useMemo } from 'react';
import { Student, Payment, PaymentMethod, useAppContext } from '../context/AppContext';
import { X, User, Printer, GraduationCap, FileDown, Pencil, Plus, Receipt, Percent, FileText } from 'lucide-react';
import { printHtml, exportPdf } from '../lib/print';
import { printReceipt, printStatement } from '../lib/receipt';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { PersonDocuments } from './PersonDocs';

const PAYMENT_TYPES = ['Tuition Fee', 'Enrollment Form', 'Lunch', 'Transport', 'Water', 'Assessment Tests', 'Uniform', 'Other'];
const METHODS: PaymentMethod[] = ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque', 'Other'];

function getGrade(mark: number): { letter: string; color: string } {
  if (mark >= 80) return { letter: 'A', color: 'text-green-600' };
  if (mark >= 70) return { letter: 'B', color: 'text-blue-600' };
  if (mark >= 60) return { letter: 'C', color: 'text-yellow-600' };
  if (mark >= 50) return { letter: 'D', color: 'text-orange-600' };
  return { letter: 'F', color: 'text-red-600' };
}

interface StudentProfileProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

export function StudentProfile({ student, onClose, onEdit }: StudentProfileProps) {
  const { payments, uniforms, requirements, results, updatePayment, addPayment, updateStudent, feeStructure, branding, currentTerm } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();

  const classFee = feeStructure.find(f => f.className === student.grade)?.cashFee || 0;

  // Record-a-payment panel.
  const [showPay, setShowPay] = useState(false);
  const [pay, setPay] = useState({ type: 'Tuition Fee', amount: '', method: 'Cash' as PaymentMethod, receipt: `RCP-${Date.now().toString().slice(-5)}`, discount: '', reason: '', notes: '' });
  const gross = parseFloat(pay.amount) || 0;
  const discountAmt = parseFloat(pay.discount) || 0;
  const netPay = Math.max(0, gross - discountAmt);
  const suggested = useMemo(() => (pay.type === 'Tuition Fee' && classFee ? classFee : 0), [pay.type, classFee]);

  const recordPayment = () => {
    if (netPay <= 0) { toast('Enter an amount greater than zero.', 'warning'); return; }
    const id = `payment-${Date.now()}`;
    const now = new Date().toISOString();
    addPayment({
      id, studentId: student.id, type: pay.type, amount: netPay,
      dueDate: now, status: 'paid', paidDate: now, createdDate: now,
      term: currentTerm, receiptNumber: pay.receipt || undefined, notes: pay.notes || undefined,
      paymentMethod: pay.method,
      ...(discountAmt > 0 ? { grossAmount: gross, discount: discountAmt, discountReason: pay.reason || undefined } : {}),
    });
    toast(`K${netPay.toLocaleString()} recorded for ${student.name}.`, 'success');
    setPay({ type: 'Tuition Fee', amount: '', method: 'Cash', receipt: `RCP-${Date.now().toString().slice(-5)}`, discount: '', reason: '', notes: '' });
    setShowPay(false);
  };

  // Persistent tuition discount for this pupil (bursary / staff).
  const [tuitionDraft, setTuitionDraft] = useState(student.tuitionFee != null ? String(student.tuitionFee) : '');
  const [reasonDraft, setReasonDraft] = useState(student.tuitionDiscountReason || '');
  const saveTuition = () => {
    const v = tuitionDraft.trim() === '' ? undefined : Math.max(0, parseFloat(tuitionDraft) || 0);
    updateStudent(student.id, { tuitionFee: v, tuitionDiscountReason: v != null ? (reasonDraft || undefined) : undefined });
    toast(v == null ? 'Tuition reset to class price.' : `Tuition set to K${v.toLocaleString()} for ${student.name}.`, 'success');
  };
  const effTuition = student.tuitionFee ?? classFee;
  const isDiscounted = student.tuitionFee != null && classFee > 0 && student.tuitionFee < classFee;

  const studentPayments = payments.filter(p => p.studentId === student.id)
    .sort((a, b) => (a.paidDate || a.dueDate || '').localeCompare(b.paidDate || b.dueDate || ''));
  const studentUniforms = uniforms.filter(u => u.studentId === student.id);
  const studentRequirements = requirements.filter(r => r.studentId === student.id);
  const studentResults = results
    .filter(r => r.studentId === student.id)
    .sort((a, b) => b.term.localeCompare(a.term));

  const totalPaid = studentPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = studentPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = studentPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const totalCharged = studentPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding = totalPending + totalOverdue;

  // Payments tabulated by term for a quick statement view.
  const terms = [...new Set(studentPayments.map(p => p.term || '—'))];
  const byTerm = terms.map(t => {
    const ps = studentPayments.filter(p => (p.term || '—') === t);
    const charged = ps.reduce((s, p) => s + p.amount, 0);
    const paid = ps.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    return { term: t, charged, paid, balance: charged - paid };
  });

  const toInput = (iso?: string) => (iso ? iso.split('T')[0] : '');
  const setDate = (id: string, field: 'dueDate' | 'paidDate', val: string) =>
    updatePayment(id, { [field]: val ? new Date(val).toISOString() : undefined });
  const setStatus = (p: Payment, status: Payment['status']) =>
    updatePayment(p.id, { status, paidDate: status === 'paid' ? (p.paidDate || new Date().toISOString()) : p.paidDate });
  const uniformSpend = studentUniforms.reduce((s, u) => s + u.price, 0);
  const requirementsDone = studentRequirements.filter(r => r.status === 'provided').length;

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    transferred: 'bg-yellow-100 text-yellow-800'
  };

  const paymentStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const handlePrint = (pdf = false) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Profile - ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; }
          .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 24px; }
          .school-name { font-size: 22px; font-weight: bold; color: #1d4ed8; }
          .school-sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .profile-title { font-size: 18px; font-weight: bold; margin-top: 8px; color: #111827; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .field { margin-bottom: 8px; }
          .field-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .field-value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; }
          td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
          .paid { background: #d1fae5; color: #065f46; }
          .pending { background: #fef3c7; color: #92400e; }
          .overdue { background: #fee2e2; color: #991b1b; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
          .summary-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
          .summary-value { font-size: 16px; font-weight: bold; color: #111827; margin-top: 2px; }
          .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-line { border-top: 1px solid #374151; padding-top: 6px; font-size: 11px; color: #6b7280; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${branding.schoolName || 'School'}</div>
          <div class="school-sub">${[branding.address, branding.phone, branding.email].filter(Boolean).join(' | ')}</div>
          <div class="profile-title">STUDENT PROFILE REPORT</div>
        </div>

        <div class="summary">
          <div class="summary-card"><div class="summary-label">Total Paid</div><div class="summary-value" style="color:#059669">K${totalPaid.toLocaleString()}</div></div>
          <div class="summary-card"><div class="summary-label">Pending</div><div class="summary-value" style="color:#d97706">K${totalPending.toLocaleString()}</div></div>
          <div class="summary-card"><div class="summary-label">Overdue</div><div class="summary-value" style="color:#dc2626">K${totalOverdue.toLocaleString()}</div></div>
          <div class="summary-card"><div class="summary-label">Uniform Spend</div><div class="summary-value">K${uniformSpend.toLocaleString()}</div></div>
        </div>

        <div class="grid-2">
          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="field"><div class="field-label">Full Name</div><div class="field-value">${student.name}</div></div>
            <div class="field"><div class="field-label">Admission Number</div><div class="field-value">${student.admissionNumber || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Grade / Class</div><div class="field-value">${student.grade}</div></div>
            <div class="field"><div class="field-label">Gender</div><div class="field-value">${student.gender || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Date of Birth</div><div class="field-value">${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</div></div>
            <div class="field"><div class="field-label">Enrollment Date</div><div class="field-value">${new Date(student.enrollmentDate).toLocaleDateString()}</div></div>
            <div class="field"><div class="field-label">Status</div><div class="field-value">${student.status || 'active'}</div></div>
          </div>
          <div class="section">
            <div class="section-title">Guardian & Contact</div>
            <div class="field"><div class="field-label">Guardian Name</div><div class="field-value">${student.guardianName}</div></div>
            <div class="field"><div class="field-label">Phone</div><div class="field-value">${student.guardianPhone}</div></div>
            <div class="field"><div class="field-label">Email</div><div class="field-value">${student.guardianEmail || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Address</div><div class="field-value">${student.address || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment History</div>
          <table>
            <thead><tr><th>Type</th><th>Term</th><th>Amount</th><th>Due Date</th><th>Date Paid</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>
              ${studentPayments.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#9ca3af">No payment records</td></tr>' :
                studentPayments.map(p => `<tr>
                  <td>${p.type}</td>
                  <td>${p.term || '—'}</td>
                  <td>K${p.amount.toLocaleString()}</td>
                  <td>${new Date(p.dueDate).toLocaleDateString()}</td>
                  <td>${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
                  <td><span class="badge ${p.status}">${p.status}</span></td>
                  <td>${p.receiptNumber || '—'}</td>
                </tr>`).join('')}
            </tbody>
            ${studentPayments.length ? `<tfoot><tr style="font-weight:bold;background:#f9fafb">
              <td colspan="2">Total</td><td>K${totalCharged.toLocaleString()}</td><td colspan="2">Paid: K${totalPaid.toLocaleString()}</td>
              <td colspan="2" style="color:${outstanding > 0 ? '#dc2626' : '#059669'}">Outstanding: K${outstanding.toLocaleString()}</td>
            </tr></tfoot>` : ''}
          </table>
        </div>

        ${studentUniforms.length > 0 ? `
        <div class="section">
          <div class="section-title">Uniform Purchases</div>
          <table>
            <thead><tr><th>Item</th><th>Price</th><th>Purchase Date</th></tr></thead>
            <tbody>
              ${studentUniforms.map(u => `<tr><td>${u.item}</td><td>K${u.price.toLocaleString()}</td><td>${new Date(u.purchaseDate).toLocaleDateString()}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <div class="footer">
          <div><div class="sig-line">Prepared By / Signature</div></div>
          <div><div class="sig-line">Date: ${new Date().toLocaleDateString()}</div></div>
        </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body>
      </html>
    `;
    if (pdf) exportPdf(printContent, `Student_Profile_${student.name}`);
    else printHtml(printContent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${tc.light} rounded-full flex items-center justify-center`}>
              {student.photoUrl
                ? <img src={student.photoUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                : <span className={`text-xl font-bold ${tc.text}`}>{student.name.charAt(0)}</span>}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
              <div className="flex items-center space-x-2 mt-0.5">
                {student.admissionNumber && (
                  <span className="text-xs text-gray-500">{student.admissionNumber}</span>
                )}
                <span className="text-xs text-gray-400">&bull;</span>
                <span className="text-xs text-gray-500">{student.grade}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onEdit && (
              <button onClick={() => onEdit(student)}
                className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>
                <Pencil className="h-4 w-4" /><span>Edit info</span>
              </button>
            )}
            <button onClick={() => setShowPay(v => !v)}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
              <Plus className="h-4 w-4" /><span>Record payment</span>
            </button>
            <button onClick={() => printStatement(student, studentPayments, branding)}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <FileText className="h-4 w-4" /><span>Statement</span>
            </button>
            <button onClick={() => printStatement(student, studentPayments, branding, true)} title="Export statement to PDF"
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <FileDown className="h-4 w-4" />
            </button>
            <button onClick={() => handlePrint()} title="Print full profile report"
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <Printer className="h-4 w-4" /><span className="hidden sm:inline">Profile</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Paid', value: `K${totalPaid.toLocaleString()}`, color: 'text-green-600' },
              { label: 'Pending', value: `K${totalPending.toLocaleString()}`, color: 'text-yellow-600' },
              { label: 'Overdue', value: `K${totalOverdue.toLocaleString()}`, color: 'text-red-600' },
              { label: 'Uniform Spend', value: `K${uniformSpend.toLocaleString()}`, color: 'text-gray-900' },
              { label: 'Requirements Done', value: `${requirementsDone}/${studentRequirements.length}`, color: 'text-blue-600' }
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Record a payment */}
          {showPay && (
            <div className="border border-green-200 bg-green-50/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2"><Receipt className="h-4 w-4" />Record a payment</h3>
                <button onClick={() => setShowPay(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="text-xs font-medium text-gray-500">Type
                  <select value={pay.type} onChange={e => setPay({ ...pay, type: e.target.value, amount: '' })} className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm">
                    {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-500">Amount (K)
                  <input type="number" min="0" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} placeholder={suggested ? String(suggested) : '0'} className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
                  {suggested > 0 && <button onClick={() => setPay({ ...pay, amount: String(suggested) })} className="text-[11px] text-blue-600 hover:underline mt-0.5">Use class fee K{suggested.toLocaleString()}{isDiscounted ? ` (pupil’s tuition K${effTuition.toLocaleString()})` : ''}</button>}
                </label>
                <label className="text-xs font-medium text-gray-500">Method
                  <select value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value as PaymentMethod })} className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm">
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-500">Receipt No.
                  <input value={pay.receipt} onChange={e => setPay({ ...pay, receipt: e.target.value })} className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
                </label>
                <label className="text-xs font-medium text-gray-500">Discount (K)
                  <input type="number" min="0" value={pay.discount} onChange={e => setPay({ ...pay, discount: e.target.value })} placeholder="0" className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
                </label>
                <label className="text-xs font-medium text-gray-500 md:col-span-2">Discount reason
                  <input value={pay.reason} onChange={e => setPay({ ...pay, reason: e.target.value })} placeholder="e.g. staff, bursary, sibling" className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
                </label>
                <label className="text-xs font-medium text-gray-500">Notes
                  <input value={pay.notes} onChange={e => setPay({ ...pay, notes: e.target.value })} placeholder="optional" className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
                </label>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-600">{discountAmt > 0 ? <>Gross K{gross.toLocaleString()} − discount K{discountAmt.toLocaleString()} = <strong className="text-gray-900">K{netPay.toLocaleString()}</strong></> : <>Total <strong className="text-gray-900">K{netPay.toLocaleString()}</strong></>}</p>
                <button onClick={recordPayment} disabled={netPay <= 0} className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40"><Receipt className="h-4 w-4" />Record K{netPay.toLocaleString()}</button>
              </div>
            </div>
          )}

          {/* Tuition & discount (persistent, for this pupil) */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><Percent className="h-4 w-4" />Tuition &amp; discount</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="text-xs text-gray-500">Class price<p className="text-sm font-semibold text-gray-900 mt-1">{classFee ? `K${classFee.toLocaleString()}` : '— (set in Fee Structure)'}</p></div>
              <label className="text-xs font-medium text-gray-500">This pupil’s tuition (K)
                <input type="number" min="0" value={tuitionDraft} onChange={e => setTuitionDraft(e.target.value)} placeholder={classFee ? `${classFee} (class price)` : 'class price'} className="block mt-1 w-40 px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-500 flex-1 min-w-[160px]">Reason
                <input value={reasonDraft} onChange={e => setReasonDraft(e.target.value)} placeholder="e.g. staff child, bursary" className="block mt-1 w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
              </label>
              <button onClick={saveTuition} className={`${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>Save</button>
              {student.tuitionFee != null && <button onClick={() => { setTuitionDraft(''); setReasonDraft(''); updateStudent(student.id, { tuitionFee: undefined, tuitionDiscountReason: undefined }); toast('Tuition reset to class price.', 'info'); }} className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2">Reset</button>}
            </div>
            {isDiscounted && <p className="text-xs text-amber-700 mt-2">Discounted by K{(classFee - (student.tuitionFee || 0)).toLocaleString()}{student.tuitionDiscountReason ? ` · ${student.tuitionDiscountReason}` : ''}. This lowers what the class is billed in Fees by Class.</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Gender', value: student.gender || 'N/A' },
                  { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A' },
                  { label: 'Enrollment Date', value: new Date(student.enrollmentDate).toLocaleDateString() },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-gray-500">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900">{f.value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[student.status || 'active']}`}>
                    {(student.status || 'active').charAt(0).toUpperCase() + (student.status || 'active').slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Guardian & Contact</h3>
              <div className="space-y-3">
                {[
                  { label: 'Guardian Name', value: student.guardianName },
                  { label: 'Phone', value: student.guardianPhone },
                  { label: 'Email', value: student.guardianEmail || 'N/A' },
                  { label: 'Address', value: student.address || 'N/A' }
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-gray-500">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Payment History</h3>
              <span className="text-xs text-gray-400">Dates &amp; status are editable — changes save automatically</span>
            </div>
            {studentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No payment records</p>
            ) : (
              <>
                {/* Tabulated by term */}
                <div className="overflow-x-auto mb-3">
                  <table className="min-w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>{['Term', 'Charged', 'Paid', 'Balance'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {byTerm.map(t => (
                        <tr key={t.term}>
                          <td className="px-3 py-1.5 text-gray-700">{t.term}</td>
                          <td className="px-3 py-1.5 text-gray-900">K{t.charged.toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-green-700">K{t.paid.toLocaleString()}</td>
                          <td className={`px-3 py-1.5 font-medium ${t.balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>K{t.balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td className="px-3 py-2 text-gray-700">Total</td>
                        <td className="px-3 py-2 text-gray-900">K{totalCharged.toLocaleString()}</td>
                        <td className="px-3 py-2 text-green-700">K{totalPaid.toLocaleString()}</td>
                        <td className={`px-3 py-2 ${outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>K{outstanding.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Detailed, editable */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Type', 'Term', 'Amount', 'Method', 'Due Date', 'Date Paid', 'Status', 'Receipt'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                        ))}
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentPayments.map(p => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{p.type}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{p.term || '—'}</td>
                          <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">K{p.amount.toLocaleString()}
                            {!!p.discount && <span className="block text-[10px] font-normal text-amber-600">−K{p.discount.toLocaleString()}</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{p.paymentMethod === 'Mobile Money' && p.mobileNetwork ? p.mobileNetwork : (p.paymentMethod || 'Cash')}</td>
                          <td className="px-3 py-2">
                            <input type="date" value={toInput(p.dueDate)} onChange={e => setDate(p.id, 'dueDate', e.target.value)}
                              className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-400" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="date" value={toInput(p.paidDate)} onChange={e => setDate(p.id, 'paidDate', e.target.value)}
                              className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-400" />
                          </td>
                          <td className="px-3 py-2">
                            <select value={p.status} onChange={e => setStatus(p, e.target.value as Payment['status'])}
                              className={`text-xs px-1.5 py-1 rounded-full font-medium border-0 focus:ring-1 focus:ring-blue-400 ${paymentStatusColors[p.status]}`}>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{p.receiptNumber || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button onClick={() => printReceipt(p, student, branding)} title="Print receipt"
                              className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 rounded px-2 py-1">
                              <Receipt className="h-3 w-3" />Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {studentUniforms.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Uniforms Purchased</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {studentUniforms.map(u => (
                  <div key={u.id} className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900">{u.item}</p>
                    <p className="text-xs text-blue-600">K{u.price.toLocaleString()} &bull; {new Date(u.purchaseDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Academic Results</span>
            </h3>
            {studentResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No results recorded</p>
            ) : (
              <div className="space-y-3">
                {studentResults.map(r => {
                  const vals = Object.values(r.subjects);
                  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                  const { letter, color } = getGrade(avg);
                  return (
                    <div key={r.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{r.term}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Avg: {avg}%</span>
                          <span className={`text-sm font-bold ${color}`}>{letter}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avg >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {avg >= 50 ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(r.subjects).map(([sub, mark]) => {
                          const g = getGrade(mark);
                          return (
                            <span key={sub} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-0.5">
                              <span className="text-gray-600">{sub}</span>
                              <span className="font-semibold text-gray-900">{mark}%</span>
                              <span className={`font-bold ${g.color}`}>{g.letter}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents — dedicated folders for this student */}
          <div className="mt-6">
            <PersonDocuments ownerType="student" ownerId={student.id} title={`${student.name} — Documents`} />
          </div>
        </div>
      </div>
    </div>
  );
}
