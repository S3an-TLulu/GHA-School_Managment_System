import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, TrendingDown, X } from 'lucide-react';
import { useAppContext, Expense } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const CATEGORIES = ['Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Food', 'Transport', 'Other'] as const;

const categoryColors: Record<string, string> = {
  Utilities: 'bg-yellow-100 text-yellow-800',
  Salaries: 'bg-blue-100 text-blue-800',
  Supplies: 'bg-green-100 text-green-800',
  Maintenance: 'bg-orange-100 text-orange-800',
  Food: 'bg-pink-100 text-pink-800',
  Transport: 'bg-purple-100 text-purple-800',
  Other: 'bg-gray-100 text-gray-800'
};

function ExpenseModal({ expense, onSave, onClose }: {
  expense: Expense | null;
  onSave: (data: Expense) => void;
  onClose: () => void;
}) {
  const { currentTerm, terms } = useAppContext();
  const TERMS = terms;
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    description: expense?.description || '',
    category: expense?.category || 'Supplies',
    amount: expense?.amount || 0,
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    paidBy: expense?.paidBy || 'Admin',
    term: expense?.term || currentTerm,
    receiptNumber: expense?.receiptNumber || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: expense?.id || `expense-${Date.now()}`, ...form });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{expense ? 'Edit Expense' : 'Record Expense'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Electricity Bill - January" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Expense['category'] })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (K) *</label>
              <input type="number" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.term} onChange={e => setForm({ ...form, term: e.target.value })}>
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.paidBy} onChange={e => setForm({ ...form, paidBy: e.target.value })} placeholder="Admin" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt No.</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.receiptNumber} onChange={e => setForm({ ...form, receiptNumber: e.target.value })} placeholder="EXP-001" />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg transition-colors text-sm font-medium">
              {expense ? 'Update Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, currentTerm, terms } = useAppContext();
  const TERMS = terms;
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTerm, setFilterTerm] = useState(currentTerm);

  const filtered = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    const matchesTerm = !filterTerm || e.term === filterTerm;
    return matchesSearch && matchesCategory && matchesTerm;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = CATEGORIES.map(cat => ({
    category: cat,
    total: filtered.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    toast('Expense record deleted.', 'info');
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
          <p className="text-gray-600">Monitor school expenditure</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}>
          <Plus className="h-5 w-5" />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingDown className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">K{totalFiltered.toLocaleString()}</p>
            </div>
          </div>
        </div>
        {categoryTotals.slice(0, 3).map(ct => (
          <div key={ct.category} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">{ct.category}</p>
            <p className="text-xl font-bold text-gray-900">K{ct.total.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Search expenses..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Terms</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Description', 'Category', 'Term', 'Paid By', 'Amount', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                    {expense.receiptNumber && <p className="text-xs text-gray-500">{expense.receiptNumber}</p>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[expense.category] || 'bg-gray-100 text-gray-800'}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{expense.term}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{expense.paidBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">K{expense.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(expense)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No expense records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <span className="text-sm font-bold text-gray-900">Total: K{totalFiltered.toLocaleString()}</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ExpenseModal
          expense={editingExpense}
          onSave={data => {
            if (editingExpense) { updateExpense(editingExpense.id, data); toast('Expense updated.', 'success'); }
            else { addExpense(data); toast('Expense recorded.', 'success'); }
            handleClose();
          }}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
