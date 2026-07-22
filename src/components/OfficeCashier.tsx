import { useState, useMemo } from 'react';
import { Search, Printer, Plus, CheckCircle, Clock, Receipt, X, Banknote, Smartphone, Building2, FileText, FileDown } from 'lucide-react';
import { printHtml, exportPdf } from '../lib/print';
import { useAppContext, PaymentMethod } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const PAYMENT_TYPES = ['Tuition Fee', 'Enrollment Form', 'Lunch', 'Transport', 'Water', 'Assessment Tests', 'Uniform', 'Other'];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function OfficeCashier() {
  const { students, payments, feeStructure, addPayment, currentTerm } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);
  const [paymentType, setPaymentType] = useState('Tuition Fee');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amount, setAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(`RCP-${Date.now().toString().slice(-5)}`);
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');

  const filteredStudents = studentSearch.length > 1
    ? activeStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.admissionNumber || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.grade.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const todayPayments = payments.filter(p => {
    const d = p.paidDate || p.createdDate;
    return d && d.startsWith(todayISO());
  });

  const sessionPayments = payments.filter(p => sessionIds.includes(p.id));

  const todayTotal = todayPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const sessionTotal = sessionPayments.reduce((s, p) => s + p.amount, 0);

  const todayByType = PAYMENT_TYPES.map(type => {
    const amt = todayPayments.filter(p => p.type === type && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    return { type, amt };
  }).filter(x => x.amt > 0);

  const suggestedAmount = useMemo(() => {
    if (!selectedStudent || paymentType !== 'Tuition Fee') return '';
    const fee = feeStructure.find(f => f.className === selectedStudent.grade);
    return fee ? String(fee.cashFee) : '';
  }, [selectedStudent, paymentType, feeStructure]);

  const handleSelectStudent = (student: typeof students[0]) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
  };

  const handleTypeChange = (type: string) => {
    setPaymentType(type);
    setAmount('');
  };

  const handleRecord = () => {
    if (!selectedStudent || !amount || parseFloat(amount) <= 0) return;

    const id = `payment-${Date.now()}`;
    addPayment({
      id,
      studentId: selectedStudent.id,
      type: paymentType,
      amount: parseFloat(amount),
      dueDate: new Date().toISOString(),
      status: 'paid',
      paidDate: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      term: currentTerm,
      receiptNumber: receiptNumber || undefined,
      notes: notes || undefined,
      paymentMethod,
    });

    setSessionIds(prev => [...prev, id]);
    toast(`K${parseFloat(amount).toLocaleString()} recorded for ${selectedStudent.name}.`, 'success');
    setSuccessMessage(`K${parseFloat(amount).toLocaleString()} recorded for ${selectedStudent.name}`);
    setTimeout(() => setSuccessMessage(''), 3000);

    setAmount('');
    setReceiptNumber(`RCP-${Date.now().toString().slice(-5)}`);
    setNotes('');
    setSelectedStudent(null);
    setStudentSearch('');
  };

  const handlePrintDailyReport = (pdf = false) => {
    const rows = todayPayments
      .sort((a, b) => new Date(b.paidDate || b.createdDate).getTime() - new Date(a.paidDate || a.createdDate).getTime())
      .map(p => {
        const student = students.find(s => s.id === p.studentId);
        return `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${new Date(p.paidDate || p.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${student?.name || 'Unknown'}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${student?.grade || ''}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${p.type}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${p.receiptNumber || '—'}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#166534">K${p.amount.toLocaleString()}</td>
          </tr>`;
      }).join('');

    const breakdownRows = todayByType.map(x =>
      `<tr><td style="padding:4px 10px">${x.type}</td><td style="padding:4px 10px;font-weight:bold">K${x.amt.toLocaleString()}</td></tr>`
    ).join('');

    const html = `
      <!DOCTYPE html><html><head>
      <title>Daily Cash Report — ${new Date().toLocaleDateString()}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#111}
        h1{color:#1d4ed8;margin-bottom:2px}
        h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:24px}
        table{width:100%;border-collapse:collapse}
        th{background:#1d4ed8;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
        .summary{display:flex;gap:12px;margin:16px 0}
        .box{flex:1;border-radius:8px;padding:12px 16px;text-align:center}
        @media print{button{display:none}}
      </style>
      </head><body>
      <h1>Great Highway Academy</h1>
      <p style="color:#6b7280;margin-top:0">Office Cashier — Daily Report</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      <p><strong>Term:</strong> ${currentTerm}</p>
      <div class="summary">
        <div class="box" style="background:#dcfce7;color:#166534">
          <div style="font-size:12px">Total Collected</div>
          <div style="font-size:26px;font-weight:bold">K${todayTotal.toLocaleString()}</div>
        </div>
        <div class="box" style="background:#dbeafe;color:#1e40af">
          <div style="font-size:12px">Transactions</div>
          <div style="font-size:26px;font-weight:bold">${todayPayments.length}</div>
        </div>
      </div>
      <h2>Breakdown by Payment Type</h2>
      <table><tbody>${breakdownRows}</tbody></table>
      <h2>Transaction Log</h2>
      <table>
        <thead><tr><th>Time</th><th>Student</th><th>Class</th><th>Type</th><th>Receipt</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#9ca3af;font-size:11px;margin-top:32px">Generated: ${new Date().toLocaleString()} — Great Highway Academy SMS</p>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>
    `;
    if (pdf) exportPdf(html, `Daily_Cash_Report_${new Date().toISOString().split('T')[0]}`);
    else printHtml(html);
  };

  const studentOutstanding = selectedStudent
    ? payments.filter(p => p.studentId === selectedStudent.id && p.status !== 'paid').reduce((s, p) => s + p.amount, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Office Cashier</h1>
          <p className="text-gray-600">Quick payment entry for front-desk operations</p>
        </div>
        <button onClick={() => handlePrintDailyReport()}
          className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Printer className="h-4 w-4" />
          <span>Daily Report</span>
        </button>
        <button onClick={() => handlePrintDailyReport(true)} title="Export daily report to PDF"
          className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <FileDown className="h-4 w-4" />
          <span>PDF</span>
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">{successMessage} — Payment recorded successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Payment Entry Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Record Payment</span>
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Student Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, admission no., or class..."
                  value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedStudent && (
                  <button onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {filteredStudents.length > 0 && !selectedStudent && (
                <div className="mt-1 border border-gray-200 rounded-lg shadow-lg bg-white z-10 divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <button key={s.id} onClick={() => handleSelectStudent(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors">
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{s.grade}</span>
                      {s.admissionNumber && <span className="text-xs text-gray-400 ml-2">{s.admissionNumber}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected student info */}
              {selectedStudent && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-blue-900">{selectedStudent.name}</span>
                    <span className="text-sm text-blue-600 ml-2">{selectedStudent.grade}</span>
                    {selectedStudent.admissionNumber && (
                      <span className="text-xs text-blue-400 ml-2">{selectedStudent.admissionNumber}</span>
                    )}
                  </div>
                  {studentOutstanding > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      K{studentOutstanding.toLocaleString()} outstanding
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                <select value={paymentType} onChange={e => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (K) *
                  {suggestedAmount && (
                    <button onClick={() => setAmount(suggestedAmount)}
                      className="ml-2 text-xs text-blue-600 hover:underline">
                      Use K{parseInt(suggestedAmount).toLocaleString()}
                    </button>
                  )}
                </label>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold" />
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 1500, 2000, 2700, 3000, 5000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    amount === String(v)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>
                  K{v.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'Cash' as PaymentMethod,          label: 'Cash',          icon: <Banknote    className="h-4 w-4" />, active: 'bg-green-50 border-green-500 text-green-700'  },
                  { value: 'Mobile Money' as PaymentMethod,  label: 'Mobile Money',  icon: <Smartphone  className="h-4 w-4" />, active: 'bg-blue-50 border-blue-500 text-blue-700'    },
                  { value: 'Bank Transfer' as PaymentMethod, label: 'Bank Transfer', icon: <Building2   className="h-4 w-4" />, active: 'bg-purple-50 border-purple-500 text-purple-700'},
                  { value: 'Cheque' as PaymentMethod,        label: 'Cheque',        icon: <FileText    className="h-4 w-4" />, active: 'bg-amber-50 border-amber-500 text-amber-700'  },
                ] as const).map(m => (
                  <button key={m.value} type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      paymentMethod === m.value ? m.active : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt No.</label>
                <input type="text" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" placeholder="Optional..." value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <button
              onClick={handleRecord}
              disabled={!selectedStudent || !amount || parseFloat(amount) <= 0}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Record Payment — {amount ? `K${parseFloat(amount).toLocaleString()}` : 'Enter Amount'}</span>
            </button>
          </div>
        </div>

        {/* Right column: today's summary + session */}
        <div className="space-y-4">

          {/* Today's totals */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Today — {new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
            </h2>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600 font-medium">Total Collected</p>
                <p className="text-2xl font-bold text-green-800">K{todayTotal.toLocaleString()}</p>
                <p className="text-xs text-green-600">{todayPayments.length} transaction{todayPayments.length !== 1 ? 's' : ''}</p>
              </div>
              {todayByType.length > 0 && (
                <div className="space-y-1.5">
                  {todayByType.map(x => (
                    <div key={x.type} className="flex justify-between text-sm">
                      <span className="text-gray-600">{x.type}</span>
                      <span className="font-medium text-gray-900">K{x.amt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {todayByType.length === 0 && (
                <p className="text-sm text-gray-400 text-center">No payments recorded today</p>
              )}
            </div>
          </div>

          {/* This session */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">This Session</h2>
            {sessionPayments.length === 0 ? (
              <p className="text-sm text-gray-400">No payments recorded yet this session.</p>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3 flex justify-between items-center">
                  <span className="text-sm text-blue-700 font-medium">{sessionPayments.length} payment{sessionPayments.length !== 1 ? 's' : ''}</span>
                  <span className="text-blue-900 font-bold">K{sessionTotal.toLocaleString()}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionPayments.slice().reverse().map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <div key={p.id} className="flex items-start justify-between text-sm border-b border-gray-100 pb-2">
                        <div>
                          <p className="font-medium text-gray-900">{student?.name}</p>
                          <p className="text-xs text-gray-500">{p.type} • {p.paymentMethod || 'Cash'} • {p.receiptNumber || 'no receipt'}</p>
                        </div>
                        <span className="font-bold text-green-700 ml-2 whitespace-nowrap">K{p.amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent today's transactions table */}
      {todayPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Today's Transaction Log</h2>
            <span className="text-sm text-gray-500">{todayPayments.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Time', 'Student', 'Class', 'Payment Type', 'Receipt', 'Amount'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayPayments
                  .sort((a, b) => new Date(b.paidDate || b.createdDate).getTime() - new Date(a.paidDate || a.createdDate).getTime())
                  .map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 ${sessionIds.includes(p.id) ? 'bg-green-50' : ''}`}>
                        <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(p.paidDate || p.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">{student?.name || 'Unknown'}</p>
                          {student?.admissionNumber && <p className="text-xs text-gray-400">{student.admissionNumber}</p>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{student?.grade}</td>
                        <td className="px-5 py-3 text-sm text-gray-900">{p.type}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{p.receiptNumber || '—'}</td>
                        <td className="px-5 py-3 text-sm font-bold text-green-700">K{p.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
