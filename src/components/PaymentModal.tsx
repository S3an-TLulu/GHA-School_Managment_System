import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface PaymentModalProps {
  onSave: (paymentData: ReturnType<typeof buildPayment>) => void;
  onClose: () => void;
}

const PAYMENT_TYPES = ['Tuition Fee', 'Enrollment Form', 'Lunch', 'Transport', 'Water', 'Assessment Tests', 'Uniform', 'Other'];
const TERMS = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026', 'Term 1 2025', 'Term 2 2025', 'Term 3 2025'];

function buildPayment(formData: {
  studentId: string; type: string; amount: string; dueDate: string;
  status: string; term: string; receiptNumber: string; notes: string;
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
    notes: formData.notes || undefined
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
    notes: ''
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
            <input type="text" placeholder="Optional notes..." value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
