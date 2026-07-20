import { useState } from 'react';
import { Plus, Pencil, Trash2, X, UserX, DollarSign, Search, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAppContext, Debtor } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { waLink, buildFeeReminder } from '../lib/notify';

function DebtorModal({ debtor, onSave, onClose }: {
  debtor: Debtor | null;
  onSave: (d: Debtor) => void;
  onClose: () => void;
}) {
  const { students } = useAppContext();
  const [form, setForm] = useState({
    name: debtor?.name || '',
    phone: debtor?.phone || '',
    studentId: debtor?.studentId || '',
    description: debtor?.description || '',
    amount: debtor?.amount?.toString() || '',
    amountPaid: debtor?.amountPaid?.toString() || '0',
    dateIncurred: debtor?.dateIncurred ? debtor.dateIncurred.split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: debtor?.dueDate ? debtor.dueDate.split('T')[0] : '',
    notes: debtor?.notes || '',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{debtor ? 'Edit Debtor' : 'Add Debtor'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => {
          e.preventDefault();
          onSave({
            id: debtor?.id || `debtor-${Date.now()}`,
            name: form.name,
            phone: form.phone || undefined,
            studentId: form.studentId || undefined,
            description: form.description,
            amount: parseFloat(form.amount) || 0,
            amountPaid: parseFloat(form.amountPaid) || 0,
            dateIncurred: new Date(form.dateIncurred).toISOString(),
            dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
            notes: form.notes || undefined,
          });
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debtor Name *</label>
              <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Person or business" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09XX XXX XXX" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linked Student (optional)</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
              <option value="">— Not linked to a student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.grade}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product / Service Owed *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. 2 tracksuits, hall hire, catering services" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Owed (K) *</label>
              <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid So Far (K)</label>
              <input type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Incurred *</label>
              <input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.dateIncurred} onChange={e => setForm({ ...form, dateIncurred: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{debtor ? 'Update' : 'Add Debtor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Debtors() {
  const { debtors, students, branding, addDebtor, updateDebtor, deleteDebtor } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debtor | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'owing' | 'cleared'>('owing');

  const withBalance = (d: Debtor) => d.amount - d.amountPaid;

  const filtered = debtors.filter(d => {
    const bal = withBalance(d);
    const matchesFilter = filter === 'all' || (filter === 'owing' ? bal > 0 : bal <= 0);
    const q = search.toLowerCase();
    const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  }).sort((a, b) => withBalance(b) - withBalance(a));

  const totalOwed = debtors.reduce((s, d) => s + Math.max(0, withBalance(d)), 0);
  const owingCount = debtors.filter(d => withBalance(d) > 0).length;
  const overdueCount = debtors.filter(d => withBalance(d) > 0 && d.dueDate && new Date(d.dueDate) < new Date()).length;

  const recordPayment = (d: Debtor) => {
    const input = window.prompt(`Record payment from ${d.name}\nOutstanding: K${withBalance(d).toLocaleString()}\n\nAmount received (K):`);
    if (!input) return;
    const amt = parseFloat(input);
    if (isNaN(amt) || amt <= 0) { toast('Invalid amount.', 'error'); return; }
    updateDebtor(d.id, { amountPaid: d.amountPaid + amt });
    toast(`K${amt.toLocaleString()} received from ${d.name}.`, 'success');
  };

  // Open WhatsApp with a pre-filled reminder for this debtor (no message is
  // sent automatically — the admin reviews and taps send).
  const sendReminder = (d: Debtor) => {
    if (!d.phone) { toast('No phone number on this debtor — add one first.', 'warning'); return; }
    const student = d.studentId ? students.find(s => s.id === d.studentId) : null;
    const msg = buildFeeReminder({
      schoolName: branding.schoolName,
      recipientName: d.name,
      what: d.description,
      balance: Math.max(0, withBalance(d)),
      dueDate: d.dueDate,
      studentName: student?.name,
    });
    window.open(waLink(d.phone, msg), '_blank', 'noopener');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debtors</h1>
          <p className="text-gray-600">Products and services owed to the school</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg`}>
          <Plus className="h-5 w-5" /><span>Add Debtor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-7 w-7 text-red-600" />
            <div>
              <p className="text-sm text-red-700">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-900">K{totalOwed.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <UserX className="h-7 w-7 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Debtors Owing</p>
              <p className="text-2xl font-bold text-gray-900">{owingCount}</p>
            </div>
          </div>
        </div>
        <div className={`${overdueCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center space-x-3">
            <DollarSign className={`h-7 w-7 ${overdueCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
            <div>
              <p className={`text-sm ${overdueCount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>Past Due Date</p>
              <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-amber-900' : 'text-gray-900'}`}>{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search debtors…"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['owing', 'cleared', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>{['Debtor', 'Owed For', 'Amount', 'Paid', 'Balance', 'Due', 'Status', ''].map(h =>
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => {
                const bal = withBalance(d);
                const student = d.studentId ? students.find(s => s.id === d.studentId) : null;
                const isOverdue = bal > 0 && d.dueDate && new Date(d.dueDate) < new Date();
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">
                        {d.phone || ''}{student ? `${d.phone ? ' · ' : ''}re: ${student.name} (${student.grade})` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                      <p className="truncate">{d.description}</p>
                      {d.notes && <p className="text-xs text-gray-400 truncate">{d.notes}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">K{d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600">K{d.amountPaid.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-bold ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>K{Math.max(0, bal).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {d.dueDate ? new Date(d.dueDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        bal <= 0 ? 'bg-green-100 text-green-800' :
                        d.amountPaid > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bal <= 0 ? 'Cleared' : d.amountPaid > 0 ? 'Partial' : 'Owing'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {bal > 0 && d.phone && (
                        <button onClick={() => sendReminder(d)} title="Send WhatsApp reminder"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"><MessageCircle className="h-4 w-4" /></button>
                      )}
                      {bal > 0 && (
                        <button onClick={() => recordPayment(d)} title="Record payment"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"><CheckCircle2 className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => { setEditing(d); setModalOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { deleteDebtor(d.id); toast('Debtor removed.', 'info'); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  {debtors.length === 0 ? 'No debtors recorded — that\'s a good thing!' : 'No debtors match the current filter.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <DebtorModal
          debtor={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={d => {
            if (editing) { updateDebtor(editing.id, d); toast('Debtor updated.', 'success'); }
            else { addDebtor(d); toast('Debtor added.', 'success'); }
            setModalOpen(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}
