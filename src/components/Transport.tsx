import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Bus, MapPin, Users, Phone, Wallet, Fuel } from 'lucide-react';
import { useAppContext, TransportRoute } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

function RouteModal({ route, onSave, onClose }: {
  route: TransportRoute | null;
  onSave: (r: TransportRoute) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: route?.name || '',
    destination: route?.destination || '',
    monthlyFee: route?.monthlyFee?.toString() || '',
    driverName: route?.driverName || '',
    driverPhone: route?.driverPhone || '',
    capacity: route?.capacity?.toString() || '',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{route ? 'Edit Route' : 'Add Transport Route'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => {
          e.preventDefault();
          onSave({
            id: route?.id || `route-${Date.now()}`,
            name: form.name,
            destination: form.destination,
            monthlyFee: parseFloat(form.monthlyFee) || 0,
            driverName: form.driverName || undefined,
            driverPhone: form.driverPhone || undefined,
            capacity: form.capacity ? parseInt(form.capacity) : undefined,
          });
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
              <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Route A — Libala" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination / Areas Covered *</label>
              <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Libala, Chilenje, Woodlands" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (K) *</label>
              <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.monthlyFee} onChange={e => setForm({ ...form, monthlyFee: e.target.value })} placeholder="750" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus Capacity</label>
              <input type="number" min="1" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{route ? 'Update' : 'Add Route'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Transport() {
  const { transportRoutes, students, updateStudent, addTransportRoute, updateTransportRoute, deleteTransportRoute, payments, expenses, addExpense, budgets, setBudget, currentTerm } = useAppContext();
  const month = new Date().toISOString().slice(0, 7);
  const budgetKey = `transport-${month}`;
  const budget = budgets[budgetKey] ?? 0;
  const inMonth = (iso?: string) => !!iso && iso.slice(0, 7) === month;
  const transportRevenue = payments.filter(p => p.type === 'Transport' && p.status === 'paid' && inMonth(p.paidDate)).reduce((s, p) => s + p.amount, 0);
  const transportSpend = expenses.filter(e => e.category === 'Transport' && inMonth(e.date)).reduce((s, e) => s + e.amount, 0);
  const [costForm, setCostForm] = useState({ description: '', amount: '' });
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransportRoute | null>(null);
  const [assigningRoute, setAssigningRoute] = useState<string | null>(null);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const ridersByRoute = (routeId: string) => activeStudents.filter(s => s.transportRouteId === routeId);
  const totalRiders = activeStudents.filter(s => s.transportRouteId).length;
  const monthlyRevenue = transportRoutes.reduce((sum, r) => sum + r.monthlyFee * ridersByRoute(r.id).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
          <p className="text-gray-600">Bus routes, destinations and student assignments</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg`}>
          <Plus className="h-5 w-5" /><span>Add Route</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Bus className={`h-7 w-7 ${tc.text}`} />
            <div>
              <p className="text-sm text-gray-500">Routes</p>
              <p className="text-2xl font-bold text-gray-900">{transportRoutes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className={`h-7 w-7 ${tc.text}`} />
            <div>
              <p className="text-sm text-gray-500">Students on Transport</p>
              <p className="text-2xl font-bold text-gray-900">{totalRiders}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Bus className="h-7 w-7 text-green-600" />
            <div>
              <p className="text-sm text-green-700">Expected Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-900">K{monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Transport money — this month */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Wallet className={`h-5 w-5 ${tc.text}`} />
            <p className="font-semibold text-gray-900">Transport Money — {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Monthly budget:</label>
            <div className="flex items-center">
              <span className="px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">K</span>
              <input type="number" min="0" value={budget || ''}
                onChange={e => setBudget(budgetKey, parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-28 px-3 py-1.5 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700">Transport fees in</p>
            <p className="text-xl font-bold text-green-900">K{transportRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">Running costs (fuel etc.)</p>
            <p className="text-xl font-bold text-red-900">K{transportSpend.toLocaleString()}</p>
          </div>
          <div className={`border rounded-lg p-3 ${budget > 0 && transportSpend > budget ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-xl font-bold text-gray-900">{budget > 0 ? `K${budget.toLocaleString()}` : '—'}</p>
            {budget > 0 && <p className={`text-xs ${transportSpend > budget ? 'text-amber-700 font-semibold' : 'text-gray-500'}`}>{transportSpend > budget ? `over by K${(transportSpend - budget).toLocaleString()}` : `K${(budget - transportSpend).toLocaleString()} left`}</p>}
          </div>
          <div className={`border rounded-lg p-3 ${transportRevenue - transportSpend >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-gray-500">Fees − Costs</p>
            <p className={`text-xl font-bold ${transportRevenue - transportSpend >= 0 ? 'text-green-900' : 'text-red-900'}`}>K{(transportRevenue - transportSpend).toLocaleString()}</p>
          </div>
        </div>
        <form className="flex flex-wrap gap-2 items-center" onSubmit={e => {
          e.preventDefault();
          const amount = parseFloat(costForm.amount);
          if (!costForm.description.trim() || isNaN(amount) || amount <= 0) { toast('Enter a description and valid amount.', 'warning'); return; }
          addExpense({
            id: `expense-${Date.now()}`,
            description: `Transport: ${costForm.description.trim()}`,
            category: 'Transport',
            amount,
            date: new Date().toISOString(),
            paidBy: 'Transport',
            term: currentTerm,
          });
          setCostForm({ description: '', amount: '' });
          toast(`K${amount.toLocaleString()} transport cost recorded in Expenses.`, 'success');
        }}>
          <Fuel className="h-4 w-4 text-gray-400" />
          <input value={costForm.description} onChange={e => setCostForm({ ...costForm, description: e.target.value })}
            placeholder="Cost description — e.g. Diesel, tyre repair…"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="number" min="0" step="0.01" value={costForm.amount}
            onChange={e => setCostForm({ ...costForm, amount: e.target.value })}
            placeholder="Amount (K)"
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button type="submit" className={`${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>Record Cost</button>
        </form>
      </div>

      {transportRoutes.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg">
          <Bus className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No transport routes yet.</p>
          <p className="text-sm mt-1">Add a route, then assign students to it here or when enrolling a child.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {transportRoutes.map(route => {
            const riders = ridersByRoute(route.id);
            const isAssigning = assigningRoute === route.id;
            const unassigned = activeStudents.filter(s => !s.transportRouteId);
            return (
              <div key={route.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className={`px-5 py-4 ${tc.light} flex items-center justify-between flex-wrap gap-3`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Bus className={`h-5 w-5 ${tc.text}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${tc.text}`}>{route.name}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{route.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">K{route.monthlyFee.toLocaleString()}<span className="text-xs font-normal text-gray-500">/month</span></p>
                      <p className="text-xs text-gray-500">
                        {riders.length}{route.capacity ? ` / ${route.capacity}` : ''} riders
                        {route.driverName && <> &bull; {route.driverName}</>}
                        {route.driverPhone && <> <Phone className="h-3 w-3 inline" /> {route.driverPhone}</>}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => { setEditing(route); setModalOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-white rounded"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => {
                        if (riders.length > 0 && !window.confirm(`${riders.length} student(s) are on this route. Delete anyway? They will be unassigned.`)) return;
                        deleteTransportRoute(route.id);
                        toast('Route deleted.', 'info');
                      }} className="p-1.5 text-red-600 hover:bg-white rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Students on this route</p>
                    <button onClick={() => setAssigningRoute(isAssigning ? null : route.id)}
                      className={`text-xs font-medium ${tc.text} hover:underline`}>
                      {isAssigning ? 'Done' : '+ Assign student'}
                    </button>
                  </div>

                  {isAssigning && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Click a student to add them to {route.name}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {unassigned.length === 0 && <p className="text-xs text-gray-400">All active students are already assigned to a route.</p>}
                        {unassigned.map(s => (
                          <button key={s.id}
                            onClick={() => { updateStudent(s.id, { transportRouteId: route.id }); toast(`${s.name} added to ${route.name}.`, 'success'); }}
                            className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-700 transition-colors">
                            {s.name} · {s.grade}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {riders.length === 0 ? (
                    <p className="text-sm text-gray-400">No students assigned yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {riders.map(s => (
                        <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.grade} &bull; {s.guardianPhone}</p>
                          </div>
                          <button onClick={() => { updateStudent(s.id, { transportRouteId: undefined }); toast(`${s.name} removed from route.`, 'info'); }}
                            className="p-1 text-gray-400 hover:text-red-600 flex-shrink-0 ml-2" title="Remove from route">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <RouteModal
          route={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={r => {
            if (editing) { updateTransportRoute(editing.id, r); toast('Route updated.', 'success'); }
            else { addTransportRoute(r); toast('Route added.', 'success'); }
            setModalOpen(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}
