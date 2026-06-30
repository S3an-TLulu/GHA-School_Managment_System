import { useState } from 'react';
import { Save, Building2, CreditCard, User, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function BrandingManager() {
  const { branding, updateBranding } = useAppContext();
  const [form, setForm] = useState({ ...branding });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateBranding(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[name]} placeholder={placeholder}
        onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
    </div>
  );

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
            <Field label="School Name" name="schoolName" placeholder="Great Highway Academy" />
            <Field label="Motto / Tagline" name="motto" placeholder="Excellence in Education" />
            <Field label="Physical Address" name="address" placeholder="Great East Road, Lusaka" />
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
          </div>
          <div className="space-y-3">
            <Field label="Phone Number" name="phone" placeholder="+260 97X XXX XXX" />
            <Field label="Email Address" name="email" type="email" placeholder="info@school.edu.zm" />
            <Field label="Website" name="website" placeholder="www.school.edu.zm" />
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
            <Field label="Bank Name" name="bankName" placeholder="First Alliance Bank" />
            <Field label="Branch" name="bankBranch" placeholder="East Park Branch" />
            <Field label="Account Number" name="bankAccountNumber" placeholder="0060700054001" />
          </div>
        </div>

        {/* Administration */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Administration</h2>
          </div>
          <div className="space-y-3">
            <Field label="Principal / Head Teacher Name" name="principalName" placeholder="Mrs. Tembo" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Logo URL</label>
              <input type="url" value={form.logoUrl} placeholder="https://... (paste image URL)"
                onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              <p className="text-xs text-gray-400 mt-1">Paste a public image URL — appears on printed documents.</p>
            </div>
            {form.logoUrl && (
              <div className="border border-gray-200 rounded-lg p-3 flex items-center space-x-3">
                <img src={form.logoUrl} alt="Logo preview" className="h-12 w-12 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                <span className="text-xs text-gray-500">Logo preview</span>
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
