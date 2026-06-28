import { useState } from 'react';
import { Plus, Search, Check, X, Clock, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PaymentModal } from './PaymentModal';

const TERMS = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026', 'Term 1 2025', 'Term 2 2025', 'Term 3 2025'];

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
