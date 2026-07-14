import { useState } from 'react';
import { Save, Building2, CreditCard, User, Globe } from 'lucide-react';
import { compressImage } from '../lib/images';
import { useAppContext } from '../context/AppContext';

// Defined at module level so React keeps the same component identity between
// renders — defining it inside BrandingManager remounted the input on every
// keystroke, which dropped focus and closed the keyboard on phones.
function Field({ label, value, type = 'text', placeholder = '', onChange }: {
  label: string; value: string; type?: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
    </div>
  );
}

export function BrandingManager() {
  const { branding, updateBranding } = useAppContext();
  const [form, setForm] = useState({ ...branding });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateBranding(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (name: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [name]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding Manager</h1>
          <p className="text-gray-600">Configure school identity used across all printed documents</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          <Save className="h-4 w-4" />
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Live preview card */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold">{form.schoolName || 'School Name'}</p>
            <p className="text-blue-200 text-sm mt-0.5 italic">{form.motto || 'School Motto'}</p>
            <p className="text-blue-200 text-xs mt-2">{form.address}</p>
            <p className="text-blue-200 text-xs">{form.phone} · {form.email}</p>
          </div>
          <div className="text-right text-xs text-blue-200">
            <p className="font-medium text-white">{form.bankName}</p>
            <p>{form.bankBranch}</p>
            <p>Acc: {form.bankAccountNumber}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* School Identity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">School Identity</h2>
          </div>
          <div className="space-y-3">
            <Field label="School Name" value={form.schoolName} onChange={set('schoolName')} placeholder="Great Highway Academy" />
            <Field label="Motto / Tagline" value={form.motto} onChange={set('motto')} placeholder="Excellence in Education" />
            <Field label="Physical Address" value={form.address} onChange={set('address')} placeholder="Great East Road, Lusaka" />
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
          </div>
          <div className="space-y-3">
            <Field label="Phone Number" value={form.phone} onChange={set('phone')} placeholder="+260 97X XXX XXX" />
            <Field label="Email Address" value={form.email} onChange={set('email')} type="email" placeholder="info@school.edu.zm" />
            <Field label="Website" value={form.website} onChange={set('website')} placeholder="www.school.edu.zm" />
          </div>
        </div>

        {/* Banking Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Bank Details</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">These appear on receipts and family statements.</p>
          <div className="space-y-3">
            <Field label="Bank Name" value={form.bankName} onChange={set('bankName')} placeholder="First Alliance Bank" />
            <Field label="Branch" value={form.bankBranch} onChange={set('bankBranch')} placeholder="East Park Branch" />
            <Field label="Account Number" value={form.bankAccountNumber} onChange={set('bankAccountNumber')} placeholder="0060700054001" />
          </div>
        </div>

        {/* Administration */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Administration</h2>
          </div>
          <div className="space-y-3">
            <Field label="Principal / Head Teacher Name" value={form.principalName} onChange={set('principalName')} placeholder="Mrs. Tembo" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Logo</label>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer">
                  Upload Logo Image
                  <input type="file" accept="image/*" className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      try {
                        const dataUrl = await compressImage(f, 400, 0.9);
                        setForm(prev => ({ ...prev, logoUrl: dataUrl }));
                      } catch { alert('Could not read that image — try a PNG or JPG.'); }
                    }} />
                </label>
                {form.logoUrl && (
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))}
                    className="text-sm text-red-500 hover:underline">Remove logo</button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-1">Or paste an image URL:</p>
              <input type="text" value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl} placeholder="https://... (optional)"
                onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              <p className="text-xs text-gray-400 mt-1">Paste a public image URL — appears on printed documents.</p>
            </div>
            {form.logoUrl && (
              <div className="border border-gray-200 rounded-lg p-3 flex items-center space-x-3">
                <img src={form.logoUrl} alt="Logo preview" className="h-20 w-20 object-contain bg-white border border-gray-200 rounded-lg p-1" onError={e => (e.currentTarget.style.display = 'none')} />
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-700">Logo preview</p>
                  <p>Used in the header, sidebar, watermarks and every printed document.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These details are automatically used on payment receipts, family statements, admission letters, ID cards, and all other printed documents.
        </p>
      </div>
    </div>
  );
}
