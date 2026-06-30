import { useState } from 'react';
import { Plus, Search, Check, X, Clock, Trash2, Printer } from 'lucide-react';
import { useAppContext, Payment, Student } from '../context/AppContext';
import { PaymentModal } from './PaymentModal';

const TERMS = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026', 'Term 1 2025', 'Term 2 2025', 'Term 3 2025'];

function printReceipt(payment: Payment, student: Student | undefined) {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${payment.receiptNumber || payment.id}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #1f2937; padding: 40px; max-width: 480px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 24px; }
        .school-name { font-size: 20px; font-weight: bold; color: #1d4ed8; }
        .school-sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
        .receipt-title { font-size: 16px; font-weight: bold; margin-top: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
        .paid-badge { display: inline-block; background: #d1fae5; color: #065f46; border: 2px solid #059669; border-radius: 6px; padding: 4px 16px; font-size: 13px; font-weight: bold; margin-top: 8px; }
        .divider { border-top: 2px dashed #e5e7eb; margin: 16px 0; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
        .row .label { color: #6b7280; }
        .row .value { font-weight: 600; color: #111827; }
        .amount-box { text-align: center; margin: 24px 0; background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; }
        .amount-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .amount-value { font-size: 36px; font-weight: bold; color: #15803d; margin-top: 4px; }
        .sig-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
        .sig-line { border-top: 1px solid #374151; padding-top: 6px; font-size: 11px; color: #6b7280; text-align: center; }
        .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #9ca3af; }
        .bank-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-top: 16px; font-size: 11px; color: #1e40af; }
        .bank-title { font-weight: bold; margin-bottom: 4px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">Great Highway Academy</div>
        <div class="school-sub">Lusaka, Zambia | Tel: +260-XXX-XXXXXX</div>
        <div class="receipt-title">Official Payment Receipt</div>
        ${payment.status === 'paid' ? '<div class="paid-badge">✓ PAID</div>' : ''}
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Receipt No.</span>
        <span class="value">${payment.receiptNumber || `RCP-${payment.id.slice(-6).toUpperCase()}`}</span>
      </div>
      <div class="row">
        <span class="label">Date Paid</span>
        <span class="value">${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
      </div>
      <div class="row">
        <span class="label">Student Name</span>
        <span class="value">${student?.name || 'Unknown'}</span>
      </div>
      <div class="row">
        <span class="label">Admission No.</span>
        <span class="value">${student?.admissionNumber || '—'}</span>
      </div>
      <div class="row">
        <span class="label">Grade</span>
        <span class="value">${student?.grade || '—'}</span>
      </div>
      <div class="row">
        <span class="label">Payment Type</span>
        <span class="value">${payment.type}</span>
      </div>
      <div class="row">
        <span class="label">Term</span>
        <span class="value">${payment.term || '—'}</span>
      </div>
      ${payment.notes ? `<div class="row"><span class="label">Notes</span><span class="value">${payment.notes}</span></div>` : ''}

      <div class="amount-box">
        <div class="amount-label">Amount Received</div>
        <div class="amount-value">K${payment.amount.toLocaleString()}</div>
      </div>

      <div class="bank-box">
        <div class="bank-title">Banking Details</div>
        Bank: First Alliance Bank &nbsp;|&nbsp; Branch: East Park<br>
        Account Name: Great Highway Academy<br>
        Account No: 0060700054001 &nbsp;|&nbsp; Currency: ZMW
      </div>

      <div class="sig-section">
        <div><div class="sig-line">Received By</div></div>
        <div><div class="sig-line">Date: ${new Date().toLocaleDateString()}</div></div>
      </div>

      <div class="footer">
        This is an official receipt of Great Highway Academy &bull; Thank you for your payment
      </div>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(printContent);
    win.document.close();
    win.print();
  }
}

export function Payments() {
  const { payments, students, addPayment, updatePayment, deletePayment, currentTerm } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTerm, setFilterTerm] = useState(currentTerm);

  const filteredPayments = payments.filter(payment => {
    const student = students.find(s => s.id === payment.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesTerm = !filterTerm || payment.term === filterTerm;
    return matchesSearch && matchesStatus && matchesTerm;
  });

  const totalShown = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidShown = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: string) => {
    if (status === 'paid') return <Check className="h-4 w-4 text-green-600" />;
    if (status === 'overdue') return <X className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const handleMarkPaid = (paymentId: string) => {
    updatePayment(paymentId, { status: 'paid', paidDate: new Date().toISOString() });
  };

  const handleDelete = (paymentId: string) => {
    if (confirm('Delete this payment record?')) deletePayment(paymentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-gray-600">Track student payments and outstanding fees</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-5 w-5" />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: filteredPayments.length, color: 'text-gray-900' },
          { label: 'Amount Shown', value: `K${totalShown.toLocaleString()}`, color: 'text-gray-900' },
          { label: 'Paid', value: `K${paidShown.toLocaleString()}`, color: 'text-green-600' },
          { label: 'Outstanding', value: `K${(totalShown - paidShown).toLocaleString()}`, color: 'text-red-600' }
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Search by student, type, receipt..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Terms</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Payment Type', 'Term', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).map(payment => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{student?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{student?.grade}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{payment.type}</p>
                      {payment.receiptNumber && <p className="text-xs text-gray-400">{payment.receiptNumber}</p>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{payment.term || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">K{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {getStatusIcon(payment.status)}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                      {payment.paidDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(payment.paidDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {payment.status !== 'paid' && (
                          <button onClick={() => handleMarkPaid(payment.id)}
                            className="text-xs text-green-700 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => printReceipt(payment, student)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title="Print Receipt"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(payment.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <PaymentModal
          onSave={paymentData => {
            addPayment(paymentData);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
