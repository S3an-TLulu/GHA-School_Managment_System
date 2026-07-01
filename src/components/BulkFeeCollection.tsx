import { useState } from 'react';
import { Users, CheckCircle2, Circle, Printer, CreditCard, AlertCircle, Banknote, Smartphone, Building2, FileText } from 'lucide-react';
import { useAppContext, Payment, PaymentMethod } from '../context/AppContext';

const CLASSES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

const FEE_TYPES = ['Tuition Fee', 'Lunch', 'Transport', 'Assessment Tests', 'Water', 'Enrollment Form', 'Uniform', 'Other'];

function generateId() {
  return `pay-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function generateReceipt() {
  return `RCP-${Date.now().toString().slice(-6)}`;
}

export function BulkFeeCollection() {
  const { students, payments, feeStructure, addPayment, currentTerm } = useAppContext();

  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [feeType, setFeeType] = useState(FEE_TYPES[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [lastBatch, setLastBatch] = useState<Payment[]>([]);

  const classStudents = students.filter(s => s.grade === selectedClass && s.status !== 'inactive');

  const existingPaid = (studentId: string) =>
    payments.some(p => p.studentId === studentId && p.type === feeType && p.term === currentTerm && p.status === 'paid');

  const suggestedAmount = () => {
    const fs = feeStructure.find(f => f.className === selectedClass);
    if (feeType === 'Tuition Fee' && fs) return String(fs.cashFee);
    return '';
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  };

  const toggleAll = () => {
    if (selectedIds.size === classStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(classStudents.map(s => s.id)));
    }
    setSaved(false);
  };

  const selectUnpaid = () => {
    const unpaid = classStudents.filter(s => !existingPaid(s.id)).map(s => s.id);
    setSelectedIds(new Set(unpaid));
    setSaved(false);
  };

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setSelectedIds(new Set());
    setSaved(false);
    setLastBatch([]);
    if (feeType === 'Tuition Fee') {
      const fs = feeStructure.find(f => f.className === cls);
      if (fs) setAmount(String(fs.cashFee));
    }
  };

  const handleFeeTypeChange = (ft: string) => {
    setFeeType(ft);
    setSelectedIds(new Set());
    setSaved(false);
    if (ft === 'Tuition Fee') {
      const fs = feeStructure.find(f => f.className === selectedClass);
      if (fs) setAmount(String(fs.cashFee));
    } else {
      setAmount('');
    }
  };

  const recordPayments = () => {
    if (!amount || selectedIds.size === 0) return;
    const batch: Payment[] = [];
    selectedIds.forEach(studentId => {
      const payment: Payment = {
        id: generateId(),
        studentId,
        type: feeType,
        amount: Number(amount),
        dueDate: payDate,
        status: 'paid',
        paidDate: payDate,
        createdDate: new Date().toISOString(),
        term: currentTerm,
        receiptNumber: generateReceipt(),
        paymentMethod,
      };
      addPayment(payment);
      batch.push(payment);
    });
    setLastBatch(batch);
    setSaved(true);
    setSelectedIds(new Set());
  };

  const printReceipts = () => {
    if (lastBatch.length === 0) return;
    const receiptHtml = lastBatch.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <strong>Great Highway Academy</strong>
            <span style="color:#6b7280;font-size:12px;">Receipt: ${p.receiptNumber}</span>
          </div>
          <p style="margin:2px 0;font-size:13px;"><strong>Student:</strong> ${student?.name || 'Unknown'}</p>
          <p style="margin:2px 0;font-size:13px;"><strong>Class:</strong> ${selectedClass}</p>
          <p style="margin:2px 0;font-size:13px;"><strong>Fee Type:</strong> ${p.type}</p>
          <p style="margin:2px 0;font-size:13px;"><strong>Term:</strong> ${p.term}</p>
          <p style="margin:2px 0;font-size:13px;"><strong>Amount Paid:</strong> K${p.amount.toLocaleString()}</p>
          <p style="margin:2px 0;font-size:13px;"><strong>Payment Method:</strong> ${p.paymentMethod || 'Cash'}</p>
          <p style="margin:2px 0;font-size:13px;"><strong>Date:</strong> ${new Date(p.paidDate!).toLocaleDateString()}</p>
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e5e7eb;display:flex;justify-content:space-between;">
            <span style="font-size:12px;color:#6b7280;">Thank you for your payment</span>
            <span style="font-size:11px;color:#10b981;font-weight:600;">PAID</span>
          </div>
        </div>`;
    }).join('');

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Bulk Receipts</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;} @media print{button{display:none;}}</style></head>
    <body>
    <h2 style="text-align:center;margin-bottom:4px;">Payment Receipts</h2>
    <p style="text-align:center;color:#6b7280;margin-bottom:20px;">${selectedClass} · ${feeType} · ${currentTerm}</p>
    ${receiptHtml}
    <button onclick="window.print()" style="display:block;margin:16px auto;padding:8px 24px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Print All Receipts</button>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const totalAmount = selectedIds.size * Number(amount || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Fee Collection</h1>
        <p className="text-gray-600">Record a fee payment for multiple students in one action</p>
      </div>

      {/* Settings bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Collection Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select value={selectedClass} onChange={e => handleClassChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fee Type</label>
            <select value={feeType} onChange={e => handleFeeTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {FEE_TYPES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Amount (ZMW)
              {suggestedAmount() && amount !== suggestedAmount() && (
                <button onClick={() => setAmount(suggestedAmount())} className="ml-2 text-blue-600 underline text-xs">
                  use K{Number(suggestedAmount()).toLocaleString()}
                </button>
              )}
            </label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setSaved(false); }}
              placeholder="Enter amount…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">Payment Method</label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'Cash' as PaymentMethod,          label: 'Cash',          icon: <Banknote   className="h-3.5 w-3.5" />, active: 'bg-green-50 border-green-500 text-green-700'   },
              { value: 'Mobile Money' as PaymentMethod,  label: 'Mobile Money',  icon: <Smartphone className="h-3.5 w-3.5" />, active: 'bg-blue-50 border-blue-500 text-blue-700'     },
              { value: 'Bank Transfer' as PaymentMethod, label: 'Bank Transfer', icon: <Building2  className="h-3.5 w-3.5" />, active: 'bg-purple-50 border-purple-500 text-purple-700'},
              { value: 'Cheque' as PaymentMethod,        label: 'Cheque',        icon: <FileText   className="h-3.5 w-3.5" />, active: 'bg-amber-50 border-amber-500 text-amber-700'   },
            ] as const).map(m => (
              <button key={m.value} type="button"
                onClick={() => setPaymentMethod(m.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                  paymentMethod === m.value ? m.active : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-gray-900">{selectedClass} Students</span>
            <span className="text-xs text-gray-400">({classStudents.length} enrolled)</span>
          </div>
          <div className="flex gap-2">
            <button onClick={selectUnpaid} className="text-xs border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50">
              Select Unpaid
            </button>
            <button onClick={toggleAll} className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
              {selectedIds.size === classStudents.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active students in {selectedClass}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {classStudents.map(student => {
              const alreadyPaid = existingPaid(student.id);
              const isSelected = selectedIds.has(student.id);
              return (
                <li key={student.id}
                  onClick={() => !alreadyPaid && toggleStudent(student.id)}
                  className={`flex items-center justify-between p-4 transition-colors ${
                    alreadyPaid ? 'opacity-60 cursor-not-allowed bg-green-50' :
                    isSelected ? 'bg-blue-50 cursor-pointer' : 'cursor-pointer hover:bg-gray-50'
                  }`}>
                  <div className="flex items-center space-x-3">
                    {alreadyPaid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.admissionNumber || student.id} · Guardian: {student.guardianName}</p>
                    </div>
                  </div>
                  {alreadyPaid ? (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Paid this term</span>
                  ) : isSelected ? (
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Selected</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Summary + Action */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            <div>
              <p className="text-xs text-gray-500">Students Selected</p>
              <p className="text-2xl font-bold text-gray-900">{selectedIds.size}</p>
            </div>
            {amount && (
              <div>
                <p className="text-xs text-gray-500">Total to Record</p>
                <p className="text-2xl font-bold text-blue-600">K{totalAmount.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Fee Type</p>
              <p className="text-sm font-medium text-gray-900">{feeType}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {saved && lastBatch.length > 0 && (
              <button onClick={printReceipts}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Printer className="h-4 w-4" />
                <span>Print {lastBatch.length} Receipts</span>
              </button>
            )}
            <button
              onClick={recordPayments}
              disabled={selectedIds.size === 0 || !amount || saved}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              <span>Record {selectedIds.size > 0 ? `${selectedIds.size} Payment${selectedIds.size > 1 ? 's' : ''}` : 'Payments'}</span>
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-4 flex items-center space-x-2 text-green-700 bg-green-50 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              <strong>{lastBatch.length} payments</strong> recorded successfully (K{(lastBatch.length * Number(amount)).toLocaleString()} total).
              Print receipts above or select more students to continue.
            </p>
          </div>
        )}

        {selectedIds.size > 0 && !amount && (
          <div className="mt-4 flex items-center space-x-2 text-amber-700 bg-amber-50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Enter an amount before recording payments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
