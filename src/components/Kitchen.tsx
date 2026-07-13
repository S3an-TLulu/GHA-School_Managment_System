import { useState } from 'react';
import { ChefHat, ShoppingCart, Wallet, Plus, Trash2, Check, Utensils } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const UNITS = ['pcs', 'kg', 'g', 'litres', 'ml', 'bags', 'boxes', 'crates', 'bundles', 'trays'];

export function Kitchen() {
  const {
    groceries, addGrocery, deleteGrocery, markGroceryBought,
    payments, expenses, students, budgets, setBudget,
  } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();

  const [tab, setTab] = useState<'groceries' | 'budget'>('groceries');
  const [month, setMonth] = useState(currentMonth);
  const [form, setForm] = useState({ name: '', quantity: '1', unit: 'pcs', estimatedCost: '' });

  const needed = groceries.filter(g => g.status === 'needed');
  const bought = [...groceries.filter(g => g.status === 'bought')]
    .sort((a, b) => (b.boughtDate || '').localeCompare(a.boughtDate || ''));
  const neededTotal = needed.reduce((s, g) => s + g.estimatedCost, 0);

  // ---- Budget maths for the selected month ----
  const budgetKey = `kitchen-${month}`;
  const budget = budgets[budgetKey] ?? 0;

  const inMonth = (iso?: string) => !!iso && iso.slice(0, 7) === month;

  const lunchPayments = payments.filter(p => p.type === 'Lunch' && p.status === 'paid' && inMonth(p.paidDate));
  const lunchRevenue = lunchPayments.reduce((s, p) => s + p.amount, 0);
  const paidChildren = new Set(lunchPayments.map(p => p.studentId)).size;
  const lunchStudents = students.filter(s => (!s.status || s.status === 'active')).length;

  const foodSpend = expenses.filter(e => e.category === 'Food' && inMonth(e.date)).reduce((s, e) => s + e.amount, 0);
  const budgetUsedPct = budget > 0 ? Math.min(100, Math.round((foodSpend / budget) * 100)) : 0;
  const balance = lunchRevenue - foodSpend;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Enter the item name.', 'warning'); return; }
    addGrocery({
      id: `groc-${Date.now()}`,
      name: form.name.trim(),
      quantity: parseFloat(form.quantity) || 1,
      unit: form.unit,
      estimatedCost: parseFloat(form.estimatedCost) || 0,
      status: 'needed',
      dateAdded: new Date().toISOString(),
    });
    setForm({ name: '', quantity: '1', unit: 'pcs', estimatedCost: '' });
    toast('Item added to the groceries list.', 'success');
  };

  const handleBuy = (id: string, name: string, estimate: number) => {
    const input = window.prompt(`How much was actually paid for "${name}"?`, String(estimate || ''));
    if (input === null) return;
    const cost = parseFloat(input);
    if (isNaN(cost) || cost < 0) { toast('Invalid amount.', 'error'); return; }
    markGroceryBought(id, cost);
    toast(`${name} bought — K${cost.toLocaleString()} recorded under Food expenses.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen</h1>
          <p className="text-gray-600">Groceries, daily needs and the lunch budget</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'groceries' as const, label: 'Groceries List', icon: ShoppingCart },
            { id: 'budget' as const, label: 'Budget & Lunch Money', icon: Wallet },
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

      {/* ---------------- GROCERIES ---------------- */}
      {tab === 'groceries' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add item */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className={`h-5 w-5 ${tc.text}`} />
              <p className="font-semibold text-gray-900">Add Needed Item</p>
            </div>
            <form className="space-y-3" onSubmit={handleAdd}>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Item name — e.g. Mealie meal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" step="0.5" value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="Qty"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <input type="number" min="0" step="0.01" value={form.estimatedCost}
                onChange={e => setForm({ ...form, estimatedCost: e.target.value })}
                placeholder="Estimated cost (K)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button type="submit" className={`w-full flex items-center justify-center gap-1.5 ${tc.btn} text-white py-2 rounded-lg text-sm font-medium`}>
                <Plus className="h-4 w-4" />Add to List
              </button>
            </form>
            {needed.length > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Shopping list estimate: <strong className="text-gray-900">K{neededTotal.toLocaleString()}</strong>
              </p>
            )}
          </div>

          {/* Needed list */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 bg-amber-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-900">🛒 Needed ({needed.length})</p>
              <span className="text-xs text-amber-700">est. K{neededTotal.toLocaleString()}</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[26rem] overflow-y-auto">
              {needed.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 text-center">Nothing needed — the kitchen is stocked!</p>
              ) : needed.map(g => (
                <div key={g.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.quantity} {g.unit} · est. K{g.estimatedCost.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleBuy(g.id, g.name, g.estimatedCost)}
                      className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-1.5 font-medium">
                      <Check className="h-3 w-3" />Bought
                    </button>
                    <button onClick={() => { deleteGrocery(g.id); toast('Item removed.', 'info'); }}
                      className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bought history */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 bg-green-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-green-900">✓ Bought recently</p>
              <span className="text-xs text-green-700">auto-recorded in Expenses (Food)</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[26rem] overflow-y-auto">
              {bought.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 text-center">No purchases yet.</p>
              ) : bought.slice(0, 30).map(g => (
                <div key={g.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{g.name}</p>
                    <p className="text-xs text-gray-500">
                      {g.quantity} {g.unit} · {g.boughtDate ? new Date(g.boughtDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">K{(g.actualCost ?? g.estimatedCost).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- BUDGET ---------------- */}
      {tab === 'budget' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-600">Month:</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600">Kitchen budget for {monthLabel(month)}:</label>
              <div className="flex items-center">
                <span className="px-2 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">K</span>
                <input type="number" min="0" value={budget || ''}
                  onChange={e => setBudget(budgetKey, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><Utensils className="h-4 w-4 text-green-600" /><p className="text-xs text-green-700">Lunch Money In</p></div>
              <p className="text-2xl font-bold text-green-900">K{lunchRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">{paidChildren} of {lunchStudents} children paid</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-700 mb-1">Kitchen Spend (Food)</p>
              <p className="text-2xl font-bold text-red-900">K{foodSpend.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">groceries + food expenses</p>
            </div>
            <div className={`${budget > 0 ? (foodSpend <= budget ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-300') : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
              <p className="text-xs text-gray-500 mb-1">Budget</p>
              <p className="text-2xl font-bold text-gray-900">{budget > 0 ? `K${budget.toLocaleString()}` : '—'}</p>
              <p className={`text-xs mt-1 ${budget > 0 && foodSpend > budget ? 'text-amber-700 font-semibold' : 'text-gray-500'}`}>
                {budget > 0 ? (foodSpend > budget ? `over by K${(foodSpend - budget).toLocaleString()}` : `K${(budget - foodSpend).toLocaleString()} remaining`) : 'set a budget above'}
              </p>
            </div>
            <div className={`${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
              <p className="text-xs text-gray-500 mb-1">Lunch Money − Spend</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>K{balance.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{balance >= 0 ? 'kitchen is self-funding' : 'topped up from school funds'}</p>
            </div>
          </div>

          {budget > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Budget used</span>
                <span className="font-semibold text-gray-900">{budgetUsedPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${budgetUsedPct < 75 ? 'bg-green-500' : budgetUsedPct < 100 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${budgetUsedPct}%` }} />
              </div>
            </div>
          )}

          {/* Month's food expenses */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Food expenses — {monthLabel(month)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>{['Date', 'Description', 'Paid By', 'Amount'].map(h =>
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.filter(e => e.category === 'Food' && inMonth(e.date))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(e.date).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}</td>
                        <td className="px-4 py-2.5 text-gray-900">{e.description}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{e.paidBy}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">K{e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  {expenses.filter(e => e.category === 'Food' && inMonth(e.date)).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No food expenses this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
