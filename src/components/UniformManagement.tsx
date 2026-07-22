import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Shirt, Tags, Ruler, Package, ArrowLeftRight, BarChart3, Settings2,
  Plus, Pencil, Trash2, X, Printer, Download, AlertTriangle, Search, FileText, Image as ImageIcon,
  Users, Scissors, ClipboardCheck, QrCode, ShoppingCart,
} from 'lucide-react';
import {
  useAppContext, UniformCategory, UniformItem, UniformSize, StockRecord, StockTxnType, UniformGender,
  TailorOrderItem, TailorOrderStatus,
} from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { compressImage } from '../lib/images';
import { exportCSV } from '../lib/exports';
import { printItemSpec, printBlankCatalogue, printSizeChart, printStockCount, printMeasurementForm, printProductionSheet, printIssueForm, printPurchaseOrder, printUniformReceipt } from '../lib/uniformDocs';
import { suggestSize, growthHint } from '../lib/sizeSuggest';
import { qrDataUrl, itemDeepLink } from '../lib/qr';

type Tab = 'dashboard' | 'store' | 'catalogue' | 'categories' | 'sizes' | 'measurements' | 'tailors' | 'issuing' | 'inventory' | 'stock' | 'reports' | 'settings';
const GENDERS: UniformGender[] = ['Boys', 'Girls', 'Unisex'];
const TXN_TYPES: StockTxnType[] = ['purchase', 'sale', 'issue', 'return', 'adjustment', 'transfer', 'damaged', 'lost'];

// ------- Uniform Item add/edit modal -------
function ItemModal({ item, onClose }: { item: UniformItem | null; onClose: () => void }) {
  const { uniformCategories, uniformSettings, uniformItems, addUniformItem, updateUniformItem } = useAppContext();
  const { toast } = useToast();
  const nextCode = () => `${uniformSettings.itemCodePrefix}-${String(uniformItems.length + 1).padStart(3, '0')}`;
  const [f, setF] = useState({
    itemCode: item?.itemCode || nextCode(),
    name: item?.name || '',
    categoryId: item?.categoryId || '',
    gender: item?.gender || 'Unisex' as UniformGender,
    grades: (item?.grades || []).join(', '),
    description: item?.description || '',
    material: item?.material || '',
    colour: item?.colour || '',
    sleeveType: item?.sleeveType || '',
    collarType: item?.collarType || '',
    season: item?.season || uniformSettings.seasons[0] || '',
    badgeRequired: item?.badgeRequired || false,
    logoPosition: item?.logoPosition || '',
    price: item?.price?.toString() || '0',
    status: item?.status || 'active' as 'active' | 'inactive',
    notes: item?.notes || '',
  });
  const [images, setImages] = useState(item?.images || {});

  const setImg = async (key: string, file?: File) => {
    if (!file) return;
    try { const url = await compressImage(file, 500, 0.82); setImages(prev => ({ ...prev, [key]: url })); }
    catch { toast('Could not read that image.', 'error'); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) { toast('Item name is required.', 'warning'); return; }
    const payload: UniformItem = {
      id: item?.id || `item-${Date.now()}`,
      itemCode: f.itemCode.trim(), name: f.name.trim(), categoryId: f.categoryId,
      gender: f.gender, grades: f.grades.split(',').map(g => g.trim()).filter(Boolean),
      description: f.description.trim() || undefined, material: f.material.trim() || undefined,
      colour: f.colour.trim() || undefined, sleeveType: f.sleeveType.trim() || undefined,
      collarType: f.collarType.trim() || undefined, season: f.season || undefined,
      badgeRequired: f.badgeRequired, logoPosition: f.logoPosition.trim() || undefined,
      images, notes: f.notes.trim() || undefined, status: f.status, price: parseFloat(f.price) || 0,
    };
    if (item) { updateUniformItem(item.id, payload); toast('Item updated.', 'success'); }
    else { addUniformItem(payload); toast('Item added to catalogue.', 'success'); }
    onClose();
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">{item ? 'Edit Uniform Item' : 'Add Uniform Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">Item Code</label><input className={inp} value={f.itemCode} onChange={e => setF({ ...f, itemCode: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Item Name *</label><input required className={inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Category</label>
              <select className={inp} value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value })}>
                <option value="">— Uncategorised —</option>
                {uniformCategories.map(c => <option key={c.id} value={c.id}>{c.group} · {c.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-gray-500">Gender</label>
              <select className={inp} value={f.gender} onChange={e => setF({ ...f, gender: e.target.value as UniformGender })}>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="text-xs text-gray-500">Applicable Grades (comma separated)</label><input className={inp} value={f.grades} onChange={e => setF({ ...f, grades: e.target.value })} placeholder="Grade 1, Grade 2, …" /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500">Description</label><input className={inp} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Material</label><input className={inp} value={f.material} onChange={e => setF({ ...f, material: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Colour</label><input className={inp} value={f.colour} onChange={e => setF({ ...f, colour: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Sleeve Type</label><input className={inp} value={f.sleeveType} onChange={e => setF({ ...f, sleeveType: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Collar Type</label><input className={inp} value={f.collarType} onChange={e => setF({ ...f, collarType: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Season</label><input className={inp} value={f.season} onChange={e => setF({ ...f, season: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Logo Position</label><input className={inp} value={f.logoPosition} onChange={e => setF({ ...f, logoPosition: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Price (K)</label><input type="number" min="0" step="0.01" className={inp} value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">Status</label>
              <select className={inp} value={f.status} onChange={e => setF({ ...f, status: e.target.value as 'active' | 'inactive' })}><option value="active">Active</option><option value="inactive">Inactive</option></select>
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={f.badgeRequired} onChange={e => setF({ ...f, badgeRequired: e.target.checked })} /> Badge required</label>
            <div className="col-span-2"><label className="text-xs text-gray-500">Notes</label><input className={inp} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Images</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {(['front', 'back', 'side', 'detail', 'material'] as const).map(key => (
                <div key={key} className="text-center">
                  <label className="cursor-pointer block">
                    {(images as Record<string, string>)[key]
                      ? <img src={(images as Record<string, string>)[key]} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                      : <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-400" /></div>}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; setImg(key, file); }} />
                  </label>
                  <span className="text-[10px] text-gray-500 capitalize">{key}</span>
                </div>
              ))}
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

// ------- Master size add/edit modal -------
function SizeModal({ size, onClose }: { size: UniformSize | null; onClose: () => void }) {
  const { addUniformSize, updateUniformSize } = useAppContext();
  const { toast } = useToast();
  const num = (v?: number) => v === undefined ? '' : String(v);
  const [f, setF] = useState({
    sizeCode: size?.sizeCode || '', ageRange: size?.ageRange || '', typicalGrade: size?.typicalGrade || '',
    chest: num(size?.chest), waist: num(size?.waist), hip: num(size?.hip), shoulder: num(size?.shoulder), neck: num(size?.neck),
    shirtLength: num(size?.shirtLength), sleeveLength: num(size?.sleeveLength), trouserLength: num(size?.trouserLength),
    skirtLength: num(size?.skirtLength), shortLength: num(size?.shortLength), sockSize: size?.sockSize || '', shoeSize: size?.shoeSize || '',
    headCirc: num(size?.headCirc), notes: size?.notes || '',
  });
  const inp = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const N = (v: string) => v === '' ? undefined : parseFloat(v);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.sizeCode.trim()) { toast('Size code is required.', 'warning'); return; }
    const p: UniformSize = {
      id: size?.id || `size-${Date.now()}`, sizeCode: f.sizeCode.trim(), ageRange: f.ageRange.trim() || undefined,
      typicalGrade: f.typicalGrade.trim() || undefined, chest: N(f.chest), waist: N(f.waist), hip: N(f.hip),
      shoulder: N(f.shoulder), neck: N(f.neck), shirtLength: N(f.shirtLength), sleeveLength: N(f.sleeveLength),
      trouserLength: N(f.trouserLength), skirtLength: N(f.skirtLength), shortLength: N(f.shortLength),
      sockSize: f.sockSize.trim() || undefined, shoeSize: f.shoeSize.trim() || undefined, headCirc: N(f.headCirc),
      notes: f.notes.trim() || undefined,
    };
    if (size) { updateUniformSize(size.id, p); toast('Size updated.', 'success'); } else { addUniformSize(p); toast('Size added.', 'success'); }
    onClose();
  };
  const fields: [string, keyof typeof f, string?][] = [
    ['Size Code *', 'sizeCode'], ['Age Range', 'ageRange'], ['Typical Grade', 'typicalGrade'],
    ['Chest', 'chest', 'n'], ['Waist', 'waist', 'n'], ['Hip', 'hip', 'n'], ['Shoulder', 'shoulder', 'n'], ['Neck', 'neck', 'n'],
    ['Shirt Length', 'shirtLength', 'n'], ['Sleeve Length', 'sleeveLength', 'n'], ['Trouser Length', 'trouserLength', 'n'],
    ['Skirt Length', 'skirtLength', 'n'], ['Short Length', 'shortLength', 'n'], ['Sock Size', 'sockSize'], ['Shoe Size', 'shoeSize'],
    ['Head Circumference', 'headCirc', 'n'],
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">{size ? 'Edit Size' : 'Add Size'}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button></div>
        <form className="p-5 space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-3 gap-3">
            {fields.map(([label, key, n]) => (
              <div key={key}><label className="text-xs text-gray-500">{label}</label>
                <input className={inp} type={n ? 'number' : 'text'} step="0.1" value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div><label className="text-xs text-gray-500">Notes</label><input className={inp} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
          <div className="flex space-x-3 pt-1"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{size ? 'Update' : 'Add Size'}</button></div>
        </form>
      </div>
    </div>
  );
}

// ------- Stock record add/edit modal -------
function StockModal({ rec, onClose }: { rec: StockRecord | null; onClose: () => void }) {
  const { uniformItems, uniformSuppliers, uniformSettings, addStockRecord, updateStockRecord } = useAppContext();
  const { toast } = useToast();
  const [f, setF] = useState({
    itemId: rec?.itemId || '', colour: rec?.colour || '', size: rec?.size || '', quantity: rec?.quantity?.toString() || '0',
    minStock: rec?.minStock?.toString() || String(uniformSettings.defaultMinStock), reorderLevel: rec?.reorderLevel?.toString() || '',
    location: rec?.location || '', supplierId: rec?.supplierId || '', cost: rec?.cost?.toString() || '', sellPrice: rec?.sellPrice?.toString() || '',
  });
  const inp = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.itemId || !f.size.trim()) { toast('Pick an item and a size.', 'warning'); return; }
    const p: StockRecord = {
      id: rec?.id || `stk-${Date.now()}`, itemId: f.itemId, colour: f.colour.trim() || undefined, size: f.size.trim(),
      quantity: parseInt(f.quantity) || 0, minStock: parseInt(f.minStock) || 0,
      reorderLevel: f.reorderLevel ? parseInt(f.reorderLevel) : undefined, location: f.location.trim() || undefined,
      supplierId: f.supplierId || undefined, cost: f.cost ? parseFloat(f.cost) : undefined, sellPrice: f.sellPrice ? parseFloat(f.sellPrice) : undefined,
    };
    if (rec) { updateStockRecord(rec.id, p); toast('Stock updated.', 'success'); } else { addStockRecord(p); toast('Stock added.', 'success'); }
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">{rec ? 'Edit Stock' : 'Add Stock'}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button></div>
        <form className="p-5 grid grid-cols-2 gap-3" onSubmit={submit}>
          <div className="col-span-2"><label className="text-xs text-gray-500">Item *</label>
            <select required className={inp} value={f.itemId} onChange={e => setF({ ...f, itemId: e.target.value })}><option value="">— Select item —</option>{uniformItems.map(i => <option key={i.id} value={i.id}>{i.itemCode} · {i.name}</option>)}</select></div>
          <div><label className="text-xs text-gray-500">Colour</label><input className={inp} value={f.colour} onChange={e => setF({ ...f, colour: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Size *</label><input required className={inp} value={f.size} onChange={e => setF({ ...f, size: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Quantity</label><input type="number" className={inp} value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Min Stock</label><input type="number" className={inp} value={f.minStock} onChange={e => setF({ ...f, minStock: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Reorder Level</label><input type="number" className={inp} value={f.reorderLevel} onChange={e => setF({ ...f, reorderLevel: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Location</label><input className={inp} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Supplier</label><select className={inp} value={f.supplierId} onChange={e => setF({ ...f, supplierId: e.target.value })}><option value="">—</option>{uniformSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="text-xs text-gray-500">Cost (K)</label><input type="number" step="0.01" className={inp} value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Selling Price (K)</label><input type="number" step="0.01" className={inp} value={f.sellPrice} onChange={e => setF({ ...f, sellPrice: e.target.value })} /></div>
          <div className="col-span-2 flex space-x-3 pt-1"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{rec ? 'Update' : 'Add Stock'}</button></div>
        </form>
      </div>
    </div>
  );
}

export function UniformManagement() {
  const ctx = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<Tab>('dashboard');

  const { uniformCategories, uniformItems, uniformSizes, uniformStock, stockTransactions, branding,
    addUniformCategory, updateUniformCategory, deleteUniformCategory, deleteUniformItem, deleteUniformSize,
    deleteStockRecord, recordStockTransaction, tailorOrders, studentMeasurements, uniformIssues } = ctx;

  const [itemModal, setItemModal] = useState<{ open: boolean; edit: UniformItem | null }>({ open: false, edit: null });
  const [sizeModal, setSizeModal] = useState<{ open: boolean; edit: UniformSize | null }>({ open: false, edit: null });
  const [stockModal, setStockModal] = useState<{ open: boolean; edit: StockRecord | null }>({ open: false, edit: null });
  const [qrModal, setQrModal] = useState<{ item: UniformItem; url: string } | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newCat, setNewCat] = useState({ name: '', group: 'Formal Uniform' });
  const [poSupplier, setPoSupplier] = useState('');

  // Deep-link: if a QR scan set a target item, open its catalogue entry.
  useEffect(() => {
    const target = localStorage.getItem('gha_uniform_target');
    if (!target) return;
    localStorage.removeItem('gha_uniform_target');
    const it = uniformItems.find(i => i.id === target);
    if (it) { setTab('catalogue'); setItemModal({ open: true, edit: it }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showQr = async (item: UniformItem) => {
    try { setQrModal({ item, url: await qrDataUrl(itemDeepLink(item.id)) }); }
    catch { toast('Could not generate QR code.', 'error'); }
  };
  const printSpec = async (item: UniformItem) => {
    let qr: string | undefined;
    try { qr = await qrDataUrl(itemDeepLink(item.id)); } catch { /* spec still prints without QR */ }
    printItemSpec(item, uniformCategories.find(c => c.id === item.categoryId), branding, qr);
  };

  // ---- derived ----
  const stockFor = (itemId: string) => uniformStock.filter(s => s.itemId === itemId).reduce((a, s) => a + s.quantity, 0);
  const totalStock = uniformStock.reduce((a, s) => a + s.quantity, 0);
  const lowStock = uniformStock.filter(s => s.quantity <= s.minStock);
  const itemName = (id: string) => uniformItems.find(i => i.id === id)?.name || '—';
  const catName = (id: string) => uniformCategories.find(c => c.id === id)?.name || '—';

  const filteredItems = uniformItems.filter(i => {
    const q = search.toLowerCase();
    return (!q || i.name.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q))
      && (!catFilter || i.categoryId === catFilter) && (!genderFilter || i.gender === genderFilter) && (!statusFilter || i.status === statusFilter);
  });

  const stockValuation = uniformStock.reduce((a, s) => a + s.quantity * (s.cost ?? 0), 0);

  const TABS: [Tab, string, typeof LayoutDashboard][] = [
    ['dashboard', 'Dashboard', LayoutDashboard], ['store', 'Store', ShoppingCart], ['catalogue', 'Catalogue', Shirt], ['categories', 'Categories', Tags],
    ['sizes', 'Size Chart', Ruler], ['measurements', 'Measurements', Users], ['tailors', 'Tailor Orders', Scissors],
    ['issuing', 'Issuing', ClipboardCheck], ['inventory', 'Inventory', Package], ['stock', 'Stock Movement', ArrowLeftRight],
    ['reports', 'Reports', BarChart3], ['settings', 'Settings', Settings2],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Uniform Management</h1>
        <p className="text-gray-600">Catalogue, sizes, inventory, stock and tailoring</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-3 py-3 border-b border-gray-200 flex gap-1 overflow-x-auto">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === id ? `${tc.light} ${tc.text}` : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['Uniform Items', uniformItems.length], ['Categories', uniformCategories.length],
                  ['Current Stock', totalStock], ['Low Stock Items', lowStock.length],
                  ['Tailor Orders Pending', tailorOrders.filter(o => !['completed', 'collected', 'cancelled'].includes(o.status)).length],
                  ['Tailor Orders Completed', tailorOrders.filter(o => o.status === 'completed' || o.status === 'collected').length],
                  ['Students Measured', studentMeasurements.length], ['Items Issued', uniformIssues.reduce((a, i) => a + i.quantity, 0)],
                ].map(([label, val]) => (
                  <div key={label as string} className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{val as number}</p>
                  </div>
                ))}
              </div>
              {/* Stock by item chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="font-semibold text-gray-900 mb-3">Stock levels by item</p>
                {uniformItems.length === 0 ? <p className="text-sm text-gray-400">No items yet.</p> : (
                  <div className="space-y-1.5">
                    {uniformItems.slice(0, 12).map(i => {
                      const qty = stockFor(i.id);
                      const max = Math.max(1, ...uniformItems.map(x => stockFor(x.id)));
                      return (
                        <div key={i.id} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-40 truncate">{i.name}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${qty <= 5 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${(qty / max) * 100}%` }} /></div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{qty}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {lowStock.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span><strong>{lowStock.length}</strong> stock line{lowStock.length !== 1 ? 's are' : ' is'} at or below minimum: {lowStock.slice(0, 6).map(s => `${itemName(s.itemId)} (${s.size}: ${s.quantity})`).join(', ')}{lowStock.length > 6 ? '…' : ''}</span>
                </div>
              )}
            </div>
          )}

          {/* CATALOGUE */}
          {tab === 'catalogue' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">All categories</option>{uniformCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">All genders</option>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                <button onClick={() => printBlankCatalogue(branding)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"><FileText className="h-4 w-4" />Blank</button>
                <button onClick={() => setItemModal({ open: true, edit: null })} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add Item</button>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50"><tr>{['Item', 'Code', 'Category', 'Gender', 'Stock', 'Price', 'Status', ''].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map(i => (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2.5">{i.images.front ? <img src={i.images.front} alt="" className="w-9 h-9 rounded object-cover border border-gray-200" /> : <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center"><Shirt className="h-4 w-4 text-gray-300" /></div>}<span className="font-medium text-gray-900">{i.name}</span></div></td>
                        <td className="px-4 py-2.5 text-gray-500">{i.itemCode}</td>
                        <td className="px-4 py-2.5 text-gray-500">{catName(i.categoryId)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{i.gender}</td>
                        <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stockFor(i.id) <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{stockFor(i.id)}</span></td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">K{i.price.toLocaleString()}</td>
                        <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{i.status}</span></td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => showQr(i)} title="QR code" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><QrCode className="h-3.5 w-3.5" /></button>
                          <button onClick={() => printSpec(i)} title="Spec sheet" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Printer className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setItemModal({ open: true, edit: i })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { deleteUniformItem(i.id); toast('Item removed.', 'info'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No items match.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div className="space-y-4 max-w-2xl">
              <form className="flex gap-2 flex-wrap" onSubmit={e => { e.preventDefault(); if (!newCat.name.trim()) return; addUniformCategory({ id: `ucat-${Date.now()}`, name: newCat.name.trim(), group: newCat.group, active: true }); setNewCat({ name: '', group: newCat.group }); toast('Category added.', 'success'); }}>
                <input value={newCat.group} onChange={e => setNewCat({ ...newCat, group: e.target.value })} placeholder="Group (e.g. Formal Uniform)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48" />
                <input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="Category name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <button type="submit" className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add</button>
              </form>
              {Object.entries(uniformCategories.reduce((acc, c) => { (acc[c.group] = acc[c.group] || []).push(c); return acc; }, {} as Record<string, UniformCategory[]>)).map(([group, cats]) => (
                <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">{group}</div>
                  {cats.map(c => (
                    <div key={c.id} className="px-4 py-2 flex items-center justify-between border-t border-gray-50">
                      <input defaultValue={c.name} onBlur={e => e.target.value !== c.name && updateUniformCategory(c.id, { name: e.target.value })} className="text-sm text-gray-900 border-none focus:ring-1 focus:ring-blue-300 rounded px-1" />
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateUniformCategory(c.id, { active: !c.active })} className={`text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Active' : 'Inactive'}</button>
                        <button onClick={() => { deleteUniformCategory(c.id); toast('Category removed.', 'info'); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* SIZES */}
          {tab === 'sizes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="text-sm text-gray-500">{uniformSizes.length} sizes in the master chart</p>
                <div className="flex gap-2">
                  <button onClick={() => printSizeChart(uniformSizes, branding)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"><Printer className="h-4 w-4" />Print Chart</button>
                  <button onClick={() => setSizeModal({ open: true, edit: null })} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add Size</button>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50"><tr>{['Size', 'Age', 'Grade', 'Chest', 'Waist', 'Hip', 'Shirt L', 'Trouser L', ''].map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {uniformSizes.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{s.sizeCode}</td>
                        <td className="px-3 py-2.5 text-gray-500">{s.ageRange || '—'}</td><td className="px-3 py-2.5 text-gray-500">{s.typicalGrade || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{s.chest ?? '—'}</td><td className="px-3 py-2.5 text-gray-600">{s.waist ?? '—'}</td><td className="px-3 py-2.5 text-gray-600">{s.hip ?? '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{s.shirtLength ?? '—'}</td><td className="px-3 py-2.5 text-gray-600">{s.trouserLength ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap"><button onClick={() => setSizeModal({ open: true, edit: s })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => { deleteUniformSize(s.id); toast('Size removed.', 'info'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    ))}
                    {uniformSizes.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-gray-400">No sizes yet — add your first, or print a blank chart.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVENTORY */}
          {tab === 'inventory' && (
            <div className="space-y-4">
              {lowStock.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" />{lowStock.length} line(s) at/below minimum stock.</div>}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="text-sm text-gray-500">{uniformStock.length} stock lines · valuation K{stockValuation.toLocaleString()}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={poSupplier} onChange={e => setPoSupplier(e.target.value)} className="px-2.5 py-2 border border-gray-300 rounded-lg text-sm"><option value="">Supplier…</option>{ctx.uniformSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  <button onClick={() => {
                    const sup = ctx.uniformSuppliers.find(s => s.id === poSupplier);
                    const lines = lowStock.map(s => ({ name: itemName(s.itemId), size: s.size, qty: Math.max(s.reorderLevel ?? s.minStock, s.minStock) - s.quantity, cost: s.cost })).filter(l => l.qty > 0);
                    if (lines.length === 0) { toast('No items are below minimum stock.', 'warning'); return; }
                    printPurchaseOrder(sup?.name || 'Supplier', sup ? [sup.phone, sup.email].filter(Boolean).join(' · ') : '', `PO-${Date.now().toString().slice(-6)}`, lines, branding);
                  }} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"><Printer className="h-4 w-4" />Reorder PO</button>
                  <button onClick={() => setStockModal({ open: true, edit: null })} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add Stock</button>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50"><tr>{['Item', 'Colour', 'Size', 'Qty', 'Min', 'Location', 'Cost', 'Sell', ''].map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {uniformStock.map(s => (
                      <tr key={s.id} className={`hover:bg-gray-50 ${s.quantity <= s.minStock ? 'bg-red-50/40' : ''}`}>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{itemName(s.itemId)}</td>
                        <td className="px-3 py-2.5 text-gray-500">{s.colour || '—'}</td><td className="px-3 py-2.5 text-gray-600">{s.size}</td>
                        <td className="px-3 py-2.5"><span className={`font-bold ${s.quantity <= s.minStock ? 'text-red-600' : 'text-gray-900'}`}>{s.quantity}</span></td>
                        <td className="px-3 py-2.5 text-gray-500">{s.minStock}</td><td className="px-3 py-2.5 text-gray-500">{s.location || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-500">{s.cost ? `K${s.cost}` : '—'}</td><td className="px-3 py-2.5 text-gray-500">{s.sellPrice ? `K${s.sellPrice}` : '—'}</td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap"><button onClick={() => setStockModal({ open: true, edit: s })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => { deleteStockRecord(s.id); toast('Stock line removed.', 'info'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    ))}
                    {uniformStock.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-gray-400">No stock lines yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STORE */}
          {tab === 'store' && <StoreTab />}

          {/* MEASUREMENTS */}
          {tab === 'measurements' && <MeasurementsTab />}

          {/* TAILOR ORDERS */}
          {tab === 'tailors' && <TailorOrdersTab />}

          {/* ISSUING */}
          {tab === 'issuing' && <IssuingTab />}

          {/* STOCK MOVEMENT */}
          {tab === 'stock' && <StockMovementTab />}

          {/* REPORTS */}
          {tab === 'reports' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                ['Inventory Report', () => exportCSV('GHA_Uniform_Inventory', ['Item', 'Colour', 'Size', 'Qty', 'Min', 'Location', 'Cost', 'Sell'], uniformStock.map(s => [itemName(s.itemId), s.colour || '', s.size, s.quantity, s.minStock, s.location || '', s.cost ?? '', s.sellPrice ?? '']))],
                ['Low Stock Report', () => exportCSV('GHA_Uniform_LowStock', ['Item', 'Size', 'Qty', 'Min'], lowStock.map(s => [itemName(s.itemId), s.size, s.quantity, s.minStock]))],
                ['Stock Valuation', () => exportCSV('GHA_Uniform_Valuation', ['Item', 'Size', 'Qty', 'Unit Cost', 'Value'], uniformStock.map(s => [itemName(s.itemId), s.size, s.quantity, s.cost ?? 0, s.quantity * (s.cost ?? 0)]))],
                ['Size Distribution', () => { const byS: Record<string, number> = {}; uniformStock.forEach(s => { byS[s.size] = (byS[s.size] || 0) + s.quantity; }); exportCSV('GHA_Uniform_SizeDist', ['Size', 'Total Qty'], Object.entries(byS)); }],
                ['Stock Movements', () => exportCSV('GHA_Uniform_Movements', ['Date', 'Item', 'Size', 'Type', 'Qty', 'Reason', 'Reference'], stockTransactions.map(t => [t.date.split('T')[0], itemName(t.itemId), t.size, t.type, t.quantity, t.reason || '', t.reference || '']))],
                ['Blank Stock Count', () => printStockCount(uniformItems.map(i => ({ name: i.name, itemCode: i.itemCode })), branding)],
              ].map(([label, fn]) => (
                <button key={label as string} onClick={fn as () => void} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50">
                  <span>{label as string}</span><Download className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && <UniformSettingsTab />}
        </div>
      </div>

      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-5 text-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h2 className="text-base font-semibold text-gray-900">{qrModal.item.name}</h2><button onClick={() => setQrModal(null)} className="p-1 hover:bg-gray-100 rounded"><X className="h-4 w-4 text-gray-500" /></button></div>
            <img src={qrModal.url} alt="QR code" className="w-48 h-48 mx-auto" />
            <p className="text-xs text-gray-500 mt-2">{qrModal.item.itemCode}</p>
            <p className="text-[10px] text-gray-400 mt-1 break-all">{itemDeepLink(qrModal.item.id)}</p>
            <div className="flex gap-2 mt-3">
              <a href={qrModal.url} download={`QR_${qrModal.item.itemCode}.png`} className="flex-1 text-sm border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50">Download</a>
              <button onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(`<img src="${qrModal.url}" style="width:300px" onload="print()" />`); w.document.close(); } }} className="flex-1 text-sm gha-primary-btn text-white rounded-lg py-1.5">Print</button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Scanning opens this item in the system.</p>
          </div>
        </div>
      )}

      {itemModal.open && <ItemModal item={itemModal.edit} onClose={() => setItemModal({ open: false, edit: null })} />}
      {sizeModal.open && <SizeModal size={sizeModal.edit} onClose={() => setSizeModal({ open: false, edit: null })} />}
      {stockModal.open && <StockModal rec={stockModal.edit} onClose={() => setStockModal({ open: false, edit: null })} />}
    </div>
  );

  // ---- Stock Movement tab (inner, uses closure state) ----
  function StockMovementTab() {
    const [form, setForm] = useState({ itemId: '', size: '', colour: '', type: 'purchase' as StockTxnType, quantity: '', reason: '', reference: '' });
    const inp = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const ADD: StockTxnType[] = ['purchase', 'return'];
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.itemId || !form.size.trim() || !form.quantity) { toast('Item, size and quantity are required.', 'warning'); return; }
      const qty = Math.abs(parseInt(form.quantity) || 0);
      const signed = ADD.includes(form.type) ? qty : -qty;
      recordStockTransaction({ id: `stx-${Date.now()}`, itemId: form.itemId, size: form.size.trim(), colour: form.colour.trim() || undefined, type: form.type, quantity: signed, date: new Date().toISOString(), reason: form.reason.trim() || undefined, reference: form.reference.trim() || undefined });
      toast('Stock movement recorded.', 'success');
      setForm({ ...form, quantity: '', reason: '', reference: '' });
    };
    return (
      <div className="space-y-4">
        <form className="flex flex-wrap gap-2 items-end bg-gray-50 border border-gray-200 rounded-lg p-3" onSubmit={submit}>
          <select className={inp} value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })}><option value="">Item…</option>{uniformItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
          <input className={`${inp} w-24`} placeholder="Size" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} />
          <input className={`${inp} w-24`} placeholder="Colour" value={form.colour} onChange={e => setForm({ ...form, colour: e.target.value })} />
          <select className={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as StockTxnType })}>{TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <input className={`${inp} w-20`} type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          <input className={`${inp} flex-1 min-w-[120px]`} placeholder="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          <input className={`${inp} w-28`} placeholder="Ref #" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
          <button type="submit" className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Record</button>
        </form>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Date', 'Item', 'Size', 'Type', 'Qty', 'Reason', 'Ref'].map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {stockTransactions.slice(0, 100).map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500 text-xs">{new Date(t.date).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{itemName(t.itemId)}</td><td className="px-3 py-2 text-gray-600">{t.size}</td>
                  <td className="px-3 py-2 text-gray-600 capitalize">{t.type}</td>
                  <td className={`px-3 py-2 font-semibold ${t.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>{t.quantity > 0 ? '+' : ''}{t.quantity}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs max-w-[160px] truncate">{t.reason || '—'}</td><td className="px-3 py-2 text-gray-400 text-xs">{t.reference || '—'}</td>
                </tr>
              ))}
              {stockTransactions.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400">No stock movements recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---- Settings tab ----
  function UniformSettingsTab() {
    const { uniformSettings, updateUniformSettings, tailors, addTailor, deleteTailor, uniformSuppliers, addUniformSupplier, deleteUniformSupplier } = ctx;
    const [csv, setCsv] = useState({ colours: uniformSettings.colours.join(', '), seasons: uniformSettings.seasons.join(', '), materials: uniformSettings.materials.join(', ') });
    const [prefix, setPrefix] = useState(uniformSettings.itemCodePrefix);
    const [minStock, setMinStock] = useState(String(uniformSettings.defaultMinStock));
    const [tName, setTName] = useState(''); const [sName, setSName] = useState(''); const [sPhone, setSPhone] = useState('');
    const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const save = () => { updateUniformSettings({ itemCodePrefix: prefix.trim() || 'UNI', defaultMinStock: parseInt(minStock) || 5, colours: csv.colours.split(',').map(s => s.trim()).filter(Boolean), seasons: csv.seasons.split(',').map(s => s.trim()).filter(Boolean), materials: csv.materials.split(',').map(s => s.trim()).filter(Boolean) }); toast('Settings saved.', 'success'); };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">General</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">Item code prefix</label><input className={inp} value={prefix} onChange={e => setPrefix(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500">Default min stock</label><input type="number" className={inp} value={minStock} onChange={e => setMinStock(e.target.value)} /></div>
          </div>
          <div><label className="text-xs text-gray-500">Colours (comma separated)</label><input className={inp} value={csv.colours} onChange={e => setCsv({ ...csv, colours: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Seasons</label><input className={inp} value={csv.seasons} onChange={e => setCsv({ ...csv, seasons: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Materials</label><input className={inp} value={csv.materials} onChange={e => setCsv({ ...csv, materials: e.target.value })} /></div>
          <button onClick={save} className={`${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>Save Settings</button>
        </div>
        <div className="space-y-5">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Tailors</p>
            <form className="flex gap-2 mb-2" onSubmit={e => { e.preventDefault(); if (!tName.trim()) return; addTailor({ id: `tlr-${Date.now()}`, name: tName.trim() }); setTName(''); }}>
              <input className={inp} placeholder="Tailor name" value={tName} onChange={e => setTName(e.target.value)} /><button className={`${tc.btn} text-white px-3 rounded-lg text-sm`}>Add</button>
            </form>
            {tailors.map(t => <div key={t.id} className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded-lg mb-1 text-sm"><span>{t.name}</span><button onClick={() => deleteTailor(t.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Suppliers</p>
            <form className="flex gap-2 mb-2 flex-wrap" onSubmit={e => { e.preventDefault(); if (!sName.trim()) return; addUniformSupplier({ id: `sup-${Date.now()}`, name: sName.trim(), phone: sPhone.trim() || undefined }); setSName(''); setSPhone(''); }}>
              <input className={`${inp} flex-1`} placeholder="Supplier name" value={sName} onChange={e => setSName(e.target.value)} />
              <input className={`${inp} w-32`} placeholder="Phone" value={sPhone} onChange={e => setSPhone(e.target.value)} />
              <button className={`${tc.btn} text-white px-3 rounded-lg text-sm`}>Add</button>
            </form>
            {uniformSuppliers.map(s => <div key={s.id} className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded-lg mb-1 text-sm"><span>{s.name}{s.phone ? <span className="text-xs text-gray-400 ml-2">{s.phone}</span> : null}</span><button onClick={() => deleteUniformSupplier(s.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
          </div>
        </div>
      </div>
    );
  }

  // ---- Store tab (classic point-of-sale: pick a student, add/remove items) ----
  function StoreTab() {
    const { students, uniformItems, uniformStock, uniformIssues, issueUniform, removeUniformIssue, addPayment, currentTerm } = ctx;
    const activeStudents = students.filter(s => !s.status || s.status === 'active');
    const [sid, setSid] = useState('');
    const [bill, setBill] = useState(true);
    const student = activeStudents.find(s => s.id === sid);
    const stockOf = (itemId: string) => uniformStock.filter(s => s.itemId === itemId).reduce((a, s) => a + s.quantity, 0);
    const firstSize = (itemId: string) => uniformStock.find(s => s.itemId === itemId && s.quantity > 0)?.size || 'One Size';
    const sellPrice = (itemId: string) => { const st = uniformStock.find(s => s.itemId === itemId && s.sellPrice); return st?.sellPrice ?? uniformItems.find(i => i.id === itemId)?.price ?? 0; };
    const onAccount = uniformIssues.filter(i => i.studentId === sid);
    const accountTotal = onAccount.reduce((a, i) => a + sellPrice(i.itemId) * i.quantity, 0);

    const add = (item: UniformItem) => {
      if (!sid) { toast('Select a student first.', 'warning'); return; }
      if (stockOf(item.id) <= 0) { toast(`${item.name} is out of stock.`, 'error'); return; }
      const size = firstSize(item.id);
      issueUniform({ id: `iss-${Date.now()}`, studentId: sid, itemId: item.id, size, quantity: 1, issueDate: new Date().toISOString(), issuedBy: 'Admin', condition: 'New' });
      if (bill) {
        const amount = sellPrice(item.id);
        if (amount > 0) addPayment({ id: `pay-${Date.now()}`, studentId: sid, type: `Uniform: ${item.name}`, amount, dueDate: new Date().toISOString(), status: 'pending', createdDate: new Date().toISOString(), term: currentTerm, notes: `Store · ${size}` });
      }
      toast(`${item.name} added to ${student?.name}'s account.`, 'success');
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={sid} onChange={e => setSid(e.target.value)} className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select a student…</option>
              {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.grade}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-700"><input type="checkbox" checked={bill} onChange={e => setBill(e.target.checked)} />Bill to account</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uniformItems.filter(i => i.status === 'active').map(item => {
              const stock = stockOf(item.id);
              return (
                <div key={item.id} className={`border rounded-lg p-3 flex items-center gap-3 ${stock === 0 ? 'border-red-200 bg-red-50/40' : 'border-gray-200'}`}>
                  {item.images.front ? <img src={item.images.front} alt="" className="w-12 h-12 rounded object-cover border border-gray-200 flex-shrink-0" /> : <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0"><Shirt className="h-5 w-5 text-gray-300" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className={`text-xs ${stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-gray-500'}`}>{stock === 0 ? 'Out of stock' : `${stock} in stock`}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${tc.text}`}>K{sellPrice(item.id).toLocaleString()}</p>
                    <button onClick={() => add(item)} disabled={!sid || stock === 0} className={`mt-1 px-3 py-1 ${tc.btn} text-white text-xs rounded disabled:opacity-40 disabled:cursor-not-allowed`}>Add</button>
                  </div>
                </div>
              );
            })}
            {uniformItems.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-8">No items in the catalogue yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-fit">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">On {student ? `${student.name}'s` : 'the'} account</p>
            {sid && onAccount.length > 0 && (
              <button onClick={() => printUniformReceipt(student, onAccount.map(i => ({ name: itemName(i.itemId), size: i.size, qty: i.quantity, price: sellPrice(i.itemId) })), branding)}
                title="Print receipt" className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 rounded px-2 py-1"><Printer className="h-3.5 w-3.5" />Receipt</button>
            )}
          </div>
          {!sid ? <p className="text-sm text-gray-400 py-6 text-center">Select a student to see and manage their uniforms.</p> : (
            <>
              <div className={`text-center p-3 ${tc.light} rounded-lg mb-3`}>
                <p className="text-xs text-gray-600">{student?.grade}</p>
                <p className={`text-lg font-bold ${tc.text}`}>Total: K{accountTotal.toLocaleString()}</p>
              </div>
              {onAccount.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No uniforms on this account yet.</p> : (
                <div className="space-y-1.5">
                  {onAccount.map(i => (
                    <div key={i.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-900 min-w-0 truncate">{itemName(i.itemId)} <span className="text-xs text-gray-400">· {i.size}</span></span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-gray-700">K{sellPrice(i.itemId).toLocaleString()}</span>
                        <button onClick={() => { removeUniformIssue(i.id); toast('Removed from account (stock restored).', 'info'); }} title="Remove" className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Measurements tab ----
  function MeasurementsTab() {
    const { students, uniformSizes, studentMeasurements, measurementHistory, saveStudentMeasurement, deleteStudentMeasurement } = ctx;
    const activeStudents = students.filter(s => !s.status || s.status === 'active');
    const [sid, setSid] = useState('');
    const blank = { height: '', chest: '', waist: '', hip: '', shoulder: '', sleeve: '', neck: '', shirtLength: '', trouserLength: '', skirtLength: '', footSize: '', headSize: '', tailorNotes: '' };
    const [f, setF] = useState<Record<string, string>>(blank);
    const inp = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const N = (v: string) => v === '' ? undefined : parseFloat(v);
    const student = activeStudents.find(s => s.id === sid);
    // AI-assisted size suggestion across multiple measurements.
    const partial = { chest: N(f.chest), waist: N(f.waist), hip: N(f.hip), shoulder: N(f.shoulder), neck: N(f.neck) };
    const sugg = suggestSize(partial, uniformSizes);
    const hint = student ? growthHint(partial, measurementHistory.filter(h => h.studentId === sid)) : null;
    const save = () => {
      if (!sid) { toast('Pick a student first.', 'warning'); return; }
      saveStudentMeasurement({
        id: `msr-${Date.now()}`, studentId: sid, className: student?.grade, gender: student?.gender,
        dateMeasured: new Date().toISOString(), measuredBy: 'Admin',
        height: N(f.height), chest: N(f.chest), waist: N(f.waist), hip: N(f.hip), shoulder: N(f.shoulder), sleeve: N(f.sleeve),
        neck: N(f.neck), shirtLength: N(f.shirtLength), trouserLength: N(f.trouserLength), skirtLength: N(f.skirtLength),
        footSize: f.footSize || undefined, headSize: N(f.headSize), recommendedSize: sugg?.sizeCode, tailorNotes: f.tailorNotes || undefined,
      });
      toast(`Measurement saved${sugg ? ` — recommended size ${sugg.sizeCode}` : ''}.`, 'success');
      setF(blank); setSid('');
    };
    const fields: [string, string][] = [['Height', 'height'], ['Chest', 'chest'], ['Waist', 'waist'], ['Hip', 'hip'], ['Shoulder', 'shoulder'], ['Sleeve', 'sleeve'], ['Neck', 'neck'], ['Shirt Length', 'shirtLength'], ['Trouser Length', 'trouserLength'], ['Skirt Length', 'skirtLength'], ['Foot Size', 'footSize'], ['Head Size', 'headSize']];
    return (
      <div className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <p className="font-semibold text-gray-900">Record measurement</p>
            <button onClick={() => printMeasurementForm(undefined, undefined, branding)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm"><FileText className="h-4 w-4" />Blank form</button>
          </div>
          <select className={`${inp} mb-3`} value={sid} onChange={e => setSid(e.target.value)}><option value="">— Select student —</option>{activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.grade}</option>)}</select>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fields.map(([label, key]) => <div key={key}><label className="text-xs text-gray-500">{label}</label><input className={inp} value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })} /></div>)}
          </div>
          <input className={`${inp} mt-2`} placeholder="Tailor notes" value={f.tailorNotes} onChange={e => setF({ ...f, tailorNotes: e.target.value })} />
          {hint && <p className="text-xs text-amber-600 mt-2">📈 {hint}</p>}
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <span className="text-sm text-gray-500">
              {sugg ? (
                <>Suggested size: <strong className="text-gray-900">{sugg.sizeCode}</strong>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${sugg.confidence === 'high' ? 'bg-green-100 text-green-700' : sugg.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{sugg.confidence} confidence</span>
                  <span className="text-xs text-gray-400 ml-1">({sugg.usedDims} measurement{sugg.usedDims !== 1 ? 's' : ''})</span>
                </>
              ) : 'Enter measurements to get an AI size suggestion'}
            </span>
            <button onClick={save} className={`${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>Save Measurement</button>
          </div>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Student', 'Class', 'Chest', 'Waist', 'Rec. Size', 'Measured', 'History', ''].map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {studentMeasurements.map(m => {
                const st = students.find(s => s.id === m.studentId);
                const hist = measurementHistory.filter(h => h.studentId === m.studentId).length;
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{st?.name || '—'}</td><td className="px-3 py-2 text-gray-500">{m.className || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{m.chest ?? '—'}</td><td className="px-3 py-2 text-gray-600">{m.waist ?? '—'}</td>
                    <td className="px-3 py-2"><span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{m.recommendedSize || '—'}</span></td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{new Date(m.dateMeasured).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{hist} prior</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap"><button onClick={() => printMeasurementForm(st, m, branding)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Printer className="h-3.5 w-3.5" /></button><button onClick={() => { deleteStudentMeasurement(m.id); toast('Measurement removed.', 'info'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button></td>
                  </tr>
                );
              })}
              {studentMeasurements.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-gray-400">No measurements recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---- Tailor Orders tab ----
  function TailorOrdersTab() {
    const { tailors, uniformItems, tailorOrders, addTailorOrder, updateTailorOrder, deleteTailorOrder } = ctx;
    const [open, setOpen] = useState(false);
    const [hdr, setHdr] = useState({ tailorId: '', dueDate: '', priority: 'normal' as 'low' | 'normal' | 'high', notes: '' });
    const [lines, setLines] = useState<TailorOrderItem[]>([{ itemId: '', size: '', quantity: 1 }]);
    const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const STATUSES: TailorOrderStatus[] = ['draft', 'sent', 'in_production', 'completed', 'collected', 'cancelled'];
    const tailorName = (id: string) => tailors.find(t => t.id === id)?.name || '—';
    const create = () => {
      if (!hdr.tailorId) { toast('Select a tailor.', 'warning'); return; }
      const valid = lines.filter(l => l.itemId && l.size && l.quantity > 0);
      if (valid.length === 0) { toast('Add at least one line item.', 'warning'); return; }
      addTailorOrder({ id: `to-${Date.now()}`, orderNo: `TO-${String(tailorOrders.length + 1).padStart(4, '0')}`, tailorId: hdr.tailorId, date: new Date().toISOString(), dueDate: hdr.dueDate ? new Date(hdr.dueDate).toISOString() : undefined, status: 'draft', priority: hdr.priority, notes: hdr.notes || undefined, items: valid });
      toast('Tailor order created.', 'success');
      setOpen(false); setHdr({ tailorId: '', dueDate: '', priority: 'normal', notes: '' }); setLines([{ itemId: '', size: '', quantity: 1 }]);
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-sm text-gray-500">{tailorOrders.length} orders</p>
          <div className="flex gap-2">
            <button onClick={() => printIssueForm('Issue', branding)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"><FileText className="h-4 w-4" />Blank Issue Form</button>
            <button onClick={() => { if (tailors.length === 0) { toast('Add a tailor in Settings first.', 'warning'); return; } setOpen(o => !o); }} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />New Order</button>
          </div>
        </div>
        {open && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <select className={inp} value={hdr.tailorId} onChange={e => setHdr({ ...hdr, tailorId: e.target.value })}><option value="">Tailor…</option>{tailors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input type="date" className={inp} value={hdr.dueDate} onChange={e => setHdr({ ...hdr, dueDate: e.target.value })} />
              <select className={inp} value={hdr.priority} onChange={e => setHdr({ ...hdr, priority: e.target.value as 'low' | 'normal' | 'high' })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
              <input className={`${inp} flex-1 min-w-[140px]`} placeholder="Notes" value={hdr.notes} onChange={e => setHdr({ ...hdr, notes: e.target.value })} />
            </div>
            {lines.map((l, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center">
                <select className={inp} value={l.itemId} onChange={e => setLines(prev => prev.map((x, i) => i === idx ? { ...x, itemId: e.target.value } : x))}><option value="">Item…</option>{uniformItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                <input className={`${inp} w-24`} placeholder="Size" value={l.size} onChange={e => setLines(prev => prev.map((x, i) => i === idx ? { ...x, size: e.target.value } : x))} />
                <input className={`${inp} w-20`} type="number" min="1" value={l.quantity} onChange={e => setLines(prev => prev.map((x, i) => i === idx ? { ...x, quantity: parseInt(e.target.value) || 1 } : x))} />
                <input className={`${inp} w-32`} placeholder="Material" value={l.material || ''} onChange={e => setLines(prev => prev.map((x, i) => i === idx ? { ...x, material: e.target.value } : x))} />
                <input className={`${inp} flex-1 min-w-[120px]`} placeholder="Instructions" value={l.instructions || ''} onChange={e => setLines(prev => prev.map((x, i) => i === idx ? { ...x, instructions: e.target.value } : x))} />
                <button onClick={() => setLines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)} className="text-red-500"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setLines(prev => [...prev, { itemId: '', size: '', quantity: 1 }])} className="text-sm text-blue-600">+ Add line</button>
              <button onClick={create} className={`ml-auto ${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>Create Order</button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Order', 'Tailor', 'Items', 'Due', 'Priority', 'Status', ''].map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {tailorOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{o.orderNo}</td><td className="px-3 py-2 text-gray-600">{tailorName(o.tailorId)}</td>
                  <td className="px-3 py-2 text-gray-500">{o.items.reduce((a, i) => a + i.quantity, 0)} pcs</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{o.dueDate ? new Date(o.dueDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' }) : '—'}</td>
                  <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${o.priority === 'high' ? 'bg-red-100 text-red-700' : o.priority === 'low' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>{o.priority}</span></td>
                  <td className="px-3 py-2"><select value={o.status} onChange={e => updateTailorOrder(o.id, { status: e.target.value as TailorOrderStatus })} className="text-xs border border-gray-200 rounded px-1.5 py-1 capitalize">{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => printProductionSheet(o, tailorName(o.tailorId), o.items.map(it => ({ name: uniformItems.find(u => u.id === it.itemId)?.name || it.itemId, size: it.size, qty: it.quantity, material: it.material, instructions: it.instructions })), branding)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Printer className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { deleteTailorOrder(o.id); toast('Order removed.', 'info'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
              {tailorOrders.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400">No tailor orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---- Issuing tab ----
  function IssuingTab() {
    const { students, uniformItems, uniformStock, uniformIssues, uniformReturns, issueUniform, returnUniform, addPayment, currentTerm } = ctx;
    const activeStudents = students.filter(s => !s.status || s.status === 'active');
    const [f, setF] = useState({ studentId: '', itemId: '', size: '', quantity: '1', condition: 'New', bill: true });
    const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const nameOf = (id: string) => students.find(s => s.id === id)?.name || '—';
    const itemOf = (id: string) => uniformItems.find(i => i.id === id)?.name || '—';
    // Price: prefer the stock line's selling price, else the item's catalogue price.
    const priceFor = (itemId: string, size: string) => {
      const stk = uniformStock.find(s => s.itemId === itemId && s.size === size);
      return stk?.sellPrice ?? uniformItems.find(i => i.id === itemId)?.price ?? 0;
    };
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!f.studentId || !f.itemId || !f.size.trim()) { toast('Student, item and size are required.', 'warning'); return; }
      const qty = parseInt(f.quantity) || 1;
      issueUniform({ id: `iss-${Date.now()}`, studentId: f.studentId, itemId: f.itemId, size: f.size.trim(), quantity: qty, issueDate: new Date().toISOString(), issuedBy: 'Admin', condition: f.condition });
      // Finance integration: bill the uniform to the student's fee account.
      if (f.bill) {
        const amount = priceFor(f.itemId, f.size.trim()) * qty;
        if (amount > 0) {
          addPayment({ id: `pay-${Date.now()}`, studentId: f.studentId, type: `Uniform: ${itemOf(f.itemId)}`, amount,
            dueDate: new Date().toISOString(), status: 'pending', createdDate: new Date().toISOString(), term: currentTerm, notes: `Issued ${qty} × ${f.size.trim()}` });
        }
      }
      toast(`Uniform issued${f.bill ? ' and billed to account' : ''}; stock updated.`, 'success');
      setF({ ...f, size: '', quantity: '1' });
    };
    return (
      <div className="space-y-4">
        <form className="flex flex-wrap gap-2 items-end bg-gray-50 border border-gray-200 rounded-lg p-3" onSubmit={submit}>
          <select className={inp} value={f.studentId} onChange={e => setF({ ...f, studentId: e.target.value })}><option value="">Student…</option>{activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.grade}</option>)}</select>
          <select className={inp} value={f.itemId} onChange={e => setF({ ...f, itemId: e.target.value })}><option value="">Item…</option>{uniformItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
          <input className={`${inp} w-24`} placeholder="Size" value={f.size} onChange={e => setF({ ...f, size: e.target.value })} />
          <input className={`${inp} w-20`} type="number" min="1" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
          <select className={inp} value={f.condition} onChange={e => setF({ ...f, condition: e.target.value })}><option>New</option><option>Good</option><option>Fair</option></select>
          <label className="flex items-center gap-1.5 text-sm text-gray-700 px-1"><input type="checkbox" checked={f.bill} onChange={e => setF({ ...f, bill: e.target.checked })} />Bill to account{f.itemId && f.size ? ` (K${priceFor(f.itemId, f.size.trim())})` : ''}</label>
          <button type="submit" className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Issue</button>
          <button type="button" onClick={() => printIssueForm('Return', branding)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm">Blank Return Form</button>
        </form>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Student', 'Item', 'Size', 'Qty', 'Condition', 'Issued', ''].map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {uniformIssues.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{nameOf(i.studentId)}</td><td className="px-3 py-2 text-gray-600">{itemOf(i.itemId)}</td>
                  <td className="px-3 py-2 text-gray-600">{i.size}</td><td className="px-3 py-2 text-gray-600">{i.quantity}</td><td className="px-3 py-2 text-gray-500">{i.condition || '—'}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{new Date(i.issueDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-3 py-2 text-right"><button onClick={() => returnUniform({ id: `ret-${Date.now()}`, studentId: i.studentId, itemId: i.itemId, size: i.size, quantity: i.quantity, returnDate: new Date().toISOString(), reason: 'Returned' })} className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded px-2 py-1">Return</button></td>
                </tr>
              ))}
              {uniformIssues.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400">No uniforms issued yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {uniformReturns.length > 0 && <p className="text-xs text-gray-400">{uniformReturns.length} return(s) recorded — stock restored automatically.</p>}
      </div>
    );
  }
}
