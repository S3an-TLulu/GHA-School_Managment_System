import React, { useState } from 'react';
import { X, Banknote, Smartphone, Building2, FileText, MoreHorizontal } from 'lucide-react';
import { useAppContext, PaymentMethod } from '../context/AppContext';

interface PaymentModalProps {
  onSave: (paymentData: ReturnType<typeof buildPayment>) => void;
  onClose: () => void;
}

const PAYMENT_TYPES = ['Tuition Fee', 'Enrollment Form', 'Lunch', 'Transport', 'Water', 'Assessment Tests', 'Uniform', 'Other'];
const TERMS = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026', 'Term 1 2025', 'Term 2 2025', 'Term 3 2025'];

const METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'Cash',          label: 'Cash',          icon: <Banknote    className="h-4 w-4" />, color: 'text-green-600  bg-green-50  border-green-200'  },
  { value: 'Mobile Money',  label: 'Mobile Money',  icon: <Smartphone  className="h-4 w-4" />, color: 'text-blue-600   bg-blue-50   border-blue-200'   },
  { value: 'Bank Transfer', label: 'Bank Transfer', icon: <Building2   className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'Cheque',        label: 'Cheque',        icon: <FileText    className="h-4 w-4" />, color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  { value: 'Other',         label: 'Other',         icon: <MoreHorizontal className="h-4 w-4" />, color: 'text-gray-600  bg-gray-50   border-gray-200'  },
];

function buildPayment(formData: {
  studentId: string; type: string; amount: string; dueDate: string;
  status: string; term: string; receiptNumber: string; notes: string;
  paymentMethod: PaymentMethod;
}) {
  return {
    id: `payment-${Date.now()}`,
    studentId: formData.studentId,
    type: formData.type,
    amount: parseFloat(formData.amount),
    dueDate: new Date(formData.dueDate).toISOString(),
    status: formData.status as 'paid' | 'pending' | 'overdue',
    paidDate: formData.status === 'paid' ? new Date().toISOString() : undefined,
    createdDate: new Date().toISOString(),
    term: formData.term,
    receiptNumber: formData.receiptNumber || undefined,
    notes: formData.notes || undefined,
    paymentMethod: formData.paymentMethod,
  };
}

export function PaymentModal({ onSave, onClose }: PaymentModalProps) {
  const { students, currentTerm } = useAppContext();
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'Tuition Fee',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    term: currentTerm,
    receiptNumber: '',
    notes: '',
    paymentMethod: 'Cash' as PaymentMethod,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(buildPayment(formData));
  };

  const activeStudents = students.filter(s => !s.status || s.status === 'active');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select required value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select Student</option>
              {activeStudents.map(student => (
                <option key={student.id} value={student.id}>{student.name} — {student.grade}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
              <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {PAYMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <select required value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <div className="grid grid-cols-5 gap-2">
              {METHODS.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: m.value })}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border-2 text-xs font-medium transition-all ${
                    formData.paymentMethod === m.value
                      ? `${m.color} border-current shadow-sm`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {m.icon}
                  <span className="leading-tight text-center">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (K) *</label>
              <input type="number" required min="0" step="0.01" placeholder="0.00"
                value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt No.</label>
              <input type="text" placeholder="RCP-001" value={formData.receiptNumber}
                onChange={e => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" placeholder="Optional notes…" value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 gha-primary-btn text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
