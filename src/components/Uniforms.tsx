import { useState } from 'react';
import { ShoppingBag, Tags, Plus, Pencil, Trash2, X, Package, AlertTriangle } from 'lucide-react';
import { useAppContext, UniformCatalogItem } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

function CatalogModal({ item, onSave, onClose }: {
  item: UniformCatalogItem | null;
  onSave: (i: UniformCatalogItem) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || '',
    price: item?.price?.toString() || '',
    category: item?.category || 'Both' as UniformCatalogItem['category'],
    stock: item?.stock?.toString() ?? '0',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Uniform Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => {
          e.preventDefault();
          onSave({
            id: item?.id || `uc-${Date.now()}`,
            name: form.name,
            price: parseFloat(form.price) || 0,
            category: form.category,
            stock: parseInt(form.stock) || 0,
          });
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Girl Dress" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (K) *</label>
              <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value as UniformCatalogItem['category'] })}>
                <option value="Both">Both</option>
                <option value="Girls">Girls</option>
                <option value="Boys">Boys</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input required type="number" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{item ? 'Update' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Uniforms() {
  const { uniforms, students, uniformCatalog, addUniformCatalogItem, updateUniformCatalogItem, deleteUniformCatalogItem, sellUniform } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'store' | 'catalog'>('store');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UniformCatalogItem | null>(null);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const lowStock = uniformCatalog.filter(i => i.stock > 0 && i.stock <= 5);
  const outOfStock = uniformCatalog.filter(i => i.stock === 0);
  const stockValue = uniformCatalog.reduce((s, i) => s + i.price * i.stock, 0);

  const handlePurchase = (item: UniformCatalogItem) => {
    if (!selectedStudent) { toast('Please select a student first.', 'warning'); return; }
    if (!sellUniform(item.id, selectedStudent)) {
      toast(`${item.name} is out of stock.`, 'error');
      return;
    }
    toast(`${item.name} sold — ${item.stock - 1} left in stock.`, 'success');
  };

  const getStudentUniforms = (studentId: string) => uniforms.filter(u => u.studentId === studentId);
  const getTotalSpent = (studentId: string) => getStudentUniforms(studentId).reduce((sum, u) => sum + u.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uniform Store</h1>
          <p className="text-gray-600">Sales, prices and stock — synced with Inventory</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'store' as const, label: 'Store', icon: ShoppingBag },
            { id: 'catalog' as const, label: 'Catalog & Prices', icon: Tags },
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

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800">
            {outOfStock.length > 0 && <><strong>Out of stock:</strong> {outOfStock.map(i => i.name).join(', ')}. </>}
            {lowStock.length > 0 && <><strong>Low stock (≤5):</strong> {lowStock.map(i => `${i.name} (${i.stock})`).join(', ')}.</>}
          </p>
        </div>
      )}

      {tab === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Uniform Items</h2>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Student to Purchase</option>
                    {activeStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uniformCatalog.map(item => (
                    <div key={item.id} className={`border rounded-lg p-4 ${item.stock === 0 ? 'border-red-200 bg-red-50/40' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.category}</p>
                          <p className={`text-xs mt-1 font-medium ${
                            item.stock === 0 ? 'text-red-600' : item.stock <= 5 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {item.stock === 0 ? 'Out of stock' : `${item.stock} in stock`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${tc.text}`}>K{item.price}</p>
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={!selectedStudent || item.stock === 0}
                            className={`mt-1 px-3 py-1 ${tc.btn} text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                          >
                            {item.stock === 0 ? 'Sold Out' : 'Purchase'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {uniformCatalog.length === 0 && (
                    <p className="text-gray-400 text-sm col-span-2 text-center py-8">
                      No items in the catalog yet — add some in the Catalog &amp; Prices tab.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Student Purchases</h2>
              </div>
              <div className="p-6">
                {selectedStudent ? (
                  <div className="space-y-4">
                    {students
                      .filter(s => s.id === selectedStudent)
                      .map(student => {
                        const studentUniforms = getStudentUniforms(student.id);
                        const totalSpent = getTotalSpent(student.id);
                        return (
                          <div key={student.id} className="space-y-3">
                            <div className={`text-center p-4 ${tc.light} rounded-lg`}>
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.grade}</p>
                              <p className={`text-lg font-bold ${tc.text} mt-2`}>
                                Total Spent: K{totalSpent.toLocaleString()}
                              </p>
                            </div>
                            {studentUniforms.length > 0 ? (
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">Purchased Items:</h4>
                                {studentUniforms.map(uniform => (
                                  <div key={uniform.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">{uniform.item}</span>
                                    <span className="text-sm font-medium text-gray-900">K{uniform.price}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No uniforms purchased yet
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Select a student to view their uniform purchases
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'catalog' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {uniformCatalog.length} items</span>
              <span>Stock value: <strong className="text-gray-900">K{stockValue.toLocaleString()}</strong></span>
            </div>
            <button onClick={() => { setEditingItem(null); setModalOpen(true); }}
              className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>
              <Plus className="h-4 w-4" /><span>Add Item</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Item', 'Category', 'Price (K)', 'In Stock', 'Stock Value', ''].map(h =>
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uniformCatalog.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium text-gray-900">{item.name}</td>
                    <td className="px-5 py-2.5 text-gray-500">{item.category}</td>
                    <td className="px-5 py-2.5 font-semibold text-gray-900">K{item.price.toLocaleString()}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.stock === 0 ? 'bg-red-100 text-red-800' :
                        item.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>{item.stock}</span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600">K{(item.price * item.stock).toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => { setEditingItem(item); setModalOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { deleteUniformCatalogItem(item.id); toast('Item removed from catalog.', 'info'); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <CatalogModal
          item={editingItem}
          onClose={() => { setModalOpen(false); setEditingItem(null); }}
          onSave={i => {
            if (editingItem) { updateUniformCatalogItem(editingItem.id, i); toast('Item updated.', 'success'); }
            else { addUniformCatalogItem(i); toast('Item added to catalog.', 'success'); }
            setModalOpen(false); setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
