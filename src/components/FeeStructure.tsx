import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, DollarSign, GraduationCap, List } from 'lucide-react';
import { useAppContext, FeeStructureItem, OtherCharge } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const ALL_CLASSES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const PER_OPTIONS = ['per term', 'per month', 'once-off', 'per year'];

function FeeModal({ item, onSave, onClose }: {
  item: FeeStructureItem | null;
  onSave: (data: FeeStructureItem) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    className: item?.className || 'Baby Class',
    description: item?.description || '',
    cashFee: item?.cashFee ?? 0,
    installmentFee: item?.installmentFee ?? 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: item?.id || `fee-${Date.now()}`,
      ...form
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{item ? 'Edit Fee' : 'Add Fee Structure'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.className} onChange={e => setForm({ ...form, className: e.target.value })}>
              {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Primary education level 3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash Fee (K) *</label>
              <input required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.cashFee} onChange={e => setForm({ ...form, cashFee: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installment Fee (K) *</label>
              <input required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.installmentFee} onChange={e => setForm({ ...form, installmentFee: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{item ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChargeModal({ charge, onSave, onClose }: {
  charge: OtherCharge | null;
  onSave: (data: OtherCharge) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: charge?.name || '',
    amount: charge?.amount || '',
    per: charge?.per || 'per term'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: charge?.id || `charge-${Date.now()}`,
      ...form
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{charge ? 'Edit Charge' : 'Add Other Charge'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Charge Name *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lunch, Transport" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (K) *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 500 or 600-1000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
            <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.per} onChange={e => setForm({ ...form, per: e.target.value })}>
              {PER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{charge ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FeeStructure() {
  const { feeStructure, otherCharges, addFeeStructureItem, updateFeeStructureItem, deleteFeeStructureItem,
    addOtherCharge, updateOtherCharge, deleteOtherCharge } = useAppContext();

  const { toast } = useToast();
  const tc = useThemeClasses();
  const [editingFee, setEditingFee] = useState<FeeStructureItem | null>(null);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<OtherCharge | null>(null);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);

  const avgCashFee = feeStructure.length > 0
    ? Math.round(feeStructure.reduce((s, f) => s + f.cashFee, 0) / feeStructure.length)
    : 0;

  const handleSaveFee = (data: FeeStructureItem) => {
    if (editingFee) { updateFeeStructureItem(editingFee.id, data); toast('Fee updated.', 'success'); }
    else { addFeeStructureItem(data); toast('Fee entry added.', 'success'); }
    setFeeModalOpen(false);
    setEditingFee(null);
  };

  const handleSaveCharge = (data: OtherCharge) => {
    if (editingCharge) { updateOtherCharge(editingCharge.id, data); toast('Charge updated.', 'success'); }
    else { addOtherCharge(data); toast('Charge added.', 'success'); }
    setChargeModalOpen(false);
    setEditingCharge(null);
  };

  const handleEditFee = (item: FeeStructureItem) => {
    setEditingFee(item);
    setFeeModalOpen(true);
  };

  const handleEditCharge = (charge: OtherCharge) => {
    setEditingCharge(charge);
    setChargeModalOpen(true);
  };

  const handleDeleteFee = (id: string) => {
    deleteFeeStructureItem(id);
    toast('Fee entry deleted.', 'info');
  };

  const handleDeleteCharge = (id: string) => {
    deleteOtherCharge(id);
    toast('Charge deleted.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structure</h1>
          <p className="text-gray-600">Manage tuition fees and other charges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-2.5 rounded-lg"><GraduationCap className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Classes Configured</p>
              <p className="text-2xl font-bold text-gray-900">{feeStructure.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-green-50 p-2.5 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Average Cash Fee</p>
              <p className="text-2xl font-bold text-gray-900">K{avgCashFee.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-50 p-2.5 rounded-lg"><List className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Other Charges</p>
              <p className="text-2xl font-bold text-gray-900">{otherCharges.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tuition Fees (Per Term)</h2>
          <button onClick={() => { setEditingFee(null); setFeeModalOpen(true); }}
            className={`flex items-center space-x-2 ${tc.btn} text-white px-3 py-1.5 rounded-lg transition-colors text-sm`}>
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Class', 'Description', 'Cash Fee', 'Installment Fee', 'Difference', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeStructure.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{item.className}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-700">K{item.cashFee.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-orange-600">K{item.installmentFee.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      +K{(item.installmentFee - item.cashFee).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditFee(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteFee(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {feeStructure.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No fee entries yet. Click "Add Class" to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Other Charges</h2>
          <button onClick={() => { setEditingCharge(null); setChargeModalOpen(true); }}
            className={`flex items-center space-x-2 ${tc.btn} text-white px-3 py-1.5 rounded-lg transition-colors text-sm`}>
            <Plus className="h-4 w-4" />
            <span>Add Charge</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Charge Name', 'Amount (K)', 'Frequency', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {otherCharges.map(charge => (
                <tr key={charge.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{charge.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">K{charge.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{charge.per}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditCharge(charge)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteCharge(charge.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {otherCharges.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No other charges defined yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {feeModalOpen && (
        <FeeModal
          item={editingFee}
          onSave={handleSaveFee}
          onClose={() => { setFeeModalOpen(false); setEditingFee(null); }}
        />
      )}

      {chargeModalOpen && (
        <ChargeModal
          charge={editingCharge}
          onSave={handleSaveCharge}
          onClose={() => { setChargeModalOpen(false); setEditingCharge(null); }}
        />
      )}
    </div>
  );
}
