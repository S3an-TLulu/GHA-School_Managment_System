import { useState, useRef } from 'react';
import { Users, Database, Trash2, Shield, Download, Upload, AlertTriangle, Plus, Pencil, X, Check, Cloud, RefreshCw, UploadCloud, DownloadCloud, CalendarRange } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth, AppUser, UserRole, ROLE_PERMISSIONS } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { getCloudConfig, saveCloudConfig, pushToCloud, pullFromCloud, testConnection, SETUP_SQL } from '../lib/supabase';

const ROLES: UserRole[] = ['Admin', 'Cashier', 'Teacher', 'Viewer'];

const WIPE_SECTIONS = [
  { id: 'students', label: 'Students' },
  { id: 'payments', label: 'Fees & Payments' },
  { id: 'uniforms', label: 'Uniforms (sales + catalog)' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'teachers', label: 'Staff & Teachers' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'events', label: 'Events & Fundraisers' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'results', label: 'Academic Results' },
  { id: 'timetables', label: 'Timetables' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'debtors', label: 'Debtors' },
  { id: 'transport', label: 'Transport Routes' },
];

function UserModal({ user, onSave, onClose }: { user: AppUser | null; onSave: (u: AppUser) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    password: user?.password || '',
    role: user?.role || 'Cashier' as UserRole,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => {
          e.preventDefault();
          onSave({ id: user?.id || `user-${Date.now()}`, ...form });
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{user ? 'Update' : 'Add User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Settings() {
  const { exportAllData, importAllData, wipeData, terms, addTerm, deleteTerm, currentTerm, setCurrentTerm, payments, expenses } = useAppContext();
  const { users, currentUser, addUser, updateUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'users' | 'terms' | 'backup' | 'cloud' | 'cleanup'>('users');
  const [newTerm, setNewTerm] = useState('');
  const [cloudCfg, setCloudCfg] = useState(getCloudConfig);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [wipeSelection, setWipeSelection] = useState<Set<string>>(new Set());
  const [confirmText, setConfirmText] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GHA_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast('Backup downloaded. Keep it somewhere safe!', 'success');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAllData(String(reader.result));
      if (!ok) toast('Invalid backup file. Nothing was changed.', 'error');
      // on success the app reloads automatically
    };
    reader.readAsText(file);
  };

  const toggleWipeSection = (id: string) =>
    setWipeSelection(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Settings are only available to Admin users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Maintenance</h1>
        <p className="text-gray-600">User accounts, permissions, data backup and cleanup</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex space-x-1">
          {[
            { id: 'users' as const, label: 'Users & Roles', icon: Users },
            { id: 'terms' as const, label: 'School Terms', icon: CalendarRange },
            { id: 'backup' as const, label: 'Backup & Restore', icon: Database },
            { id: 'cloud' as const, label: 'Cloud Sync', icon: Cloud },
            { id: 'cleanup' as const, label: 'Data Cleanup', icon: Trash2 },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? `${tc.light} ${tc.text}` : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ---------------- USERS & ROLES ---------------- */}
          {tab === 'users' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{users.length} user account{users.length !== 1 ? 's' : ''}</p>
                <button onClick={() => { setEditingUser(null); setUserModalOpen(true); }}
                  className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>
                  <Plus className="h-4 w-4" /><span>Add User</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>{['Name', 'Username', 'Role', 'Access', ''].map(h =>
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => {
                      const perms = ROLE_PERMISSIONS[u.role];
                      return (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {u.fullName}
                            {currentUser?.id === u.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">you</span>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{u.username}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'Cashier' ? 'bg-green-100 text-green-800' :
                              u.role === 'Teacher' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">
                            {perms === 'all' ? 'Full access' : `${perms.length} sections`}
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button onClick={() => { setEditingUser(u); setUserModalOpen(true); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => {
                              deleteUser(u.id);
                              toast(u.role === 'Admin' && users.filter(x => x.role === 'Admin').length <= 1
                                ? 'Cannot delete the last Admin account.' : 'User deleted.', 'info');
                            }}
                              disabled={currentUser?.id === u.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Role permissions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                  <div><strong className="text-purple-700">Admin</strong> — full access to every section including Settings</div>
                  <div><strong className="text-green-700">Cashier</strong> — finances: payments, cashier, debtors, uniforms, transport, fundraisers, reports</div>
                  <div><strong className="text-blue-700">Teacher</strong> — academics: attendance, results, timetable, calendar, events, announcements</div>
                  <div><strong className="text-gray-700">Viewer</strong> — read-only overview: dashboard, calendar, events, announcements</div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SCHOOL TERMS ---------------- */}
          {tab === 'terms' && (
            <div className="space-y-5 max-w-2xl">
              <div className="border border-gray-200 rounded-lg p-5">
                <p className="font-semibold text-gray-900 mb-1">Add a school term</p>
                <p className="text-sm text-gray-500 mb-3">New terms appear in every term dropdown across the system (payments, expenses, results, reports…).</p>
                <form className="flex gap-2" onSubmit={e => {
                  e.preventDefault();
                  const t = newTerm.trim();
                  if (!t) return;
                  if (terms.includes(t)) { toast('That term already exists.', 'warning'); return; }
                  addTerm(t);
                  setNewTerm('');
                  toast(`"${t}" added.`, 'success');
                }}>
                  <input value={newTerm} onChange={e => setNewTerm(e.target.value)}
                    placeholder="e.g. Term 1 2027"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button type="submit" className={`flex items-center gap-1.5 px-4 py-2 ${tc.btn} text-white rounded-lg text-sm font-medium`}>
                    <Plus className="h-4 w-4" />Add Term
                  </button>
                </form>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">Existing terms</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {terms.map(t => {
                    const inUse = payments.some(p => p.term === t) || expenses.some(e => e.term === t);
                    const isCurrent = t === currentTerm;
                    return (
                      <div key={t} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{t}</span>
                          {isCurrent && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">current term</span>}
                          {inUse && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">has records</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isCurrent && (
                            <button onClick={() => { setCurrentTerm(t); toast(`Current term set to ${t}.`, 'success'); }}
                              className="text-xs text-blue-600 hover:underline px-2 py-1">Make current</button>
                          )}
                          <button
                            disabled={isCurrent}
                            onClick={() => {
                              if (inUse && !window.confirm(`"${t}" has payments or expenses recorded against it. Removing it only hides it from dropdowns — existing records keep their term. Remove?`)) return;
                              deleteTerm(t);
                              toast(`"${t}" removed from dropdowns.`, 'info');
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30" title={isCurrent ? 'Cannot remove the current term' : 'Remove term'}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {terms.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">No terms defined — add one above.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- BACKUP & RESTORE ---------------- */}
          {tab === 'backup' && (
            <div className="space-y-5 max-w-2xl">
              <div className="border border-green-200 bg-green-50 rounded-lg p-5">
                <div className="flex items-start space-x-3">
                  <Download className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Download Backup</p>
                    <p className="text-sm text-green-700 mt-1">
                      Saves everything — students, payments, results, events, settings — into one file.
                      Do this regularly! All data lives in this browser, so a backup is your safety net.
                    </p>
                    <button onClick={handleExport}
                      className="mt-3 flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      <Download className="h-4 w-4" /><span>Download Backup File</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-blue-200 bg-blue-50 rounded-lg p-5">
                <div className="flex items-start space-x-3">
                  <Upload className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">Restore from Backup</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Loads a previously downloaded backup file. This replaces the current data with
                      whatever is in the file, then reloads the app.
                    </p>
                    <input ref={fileInput} type="file" accept=".json,application/json" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />
                    <button onClick={() => fileInput.current?.click()}
                      className="mt-3 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      <Upload className="h-4 w-4" /><span>Choose Backup File…</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- CLOUD SYNC ---------------- */}
          {tab === 'cloud' && (
            <div className="space-y-5 max-w-2xl">
              <div className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-start space-x-3 mb-4">
                  <Cloud className={`h-6 w-6 ${tc.text} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="font-semibold text-gray-900">Supabase Cloud Sync</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Stores the whole school database in your Supabase project so you can move
                      between computers and always have an off-site copy.
                      {cloudCfg.lastSync && <> Last sync: <strong>{new Date(cloudCfg.lastSync).toLocaleString()}</strong>.</>}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cloudCfg.url} onChange={e => setCloudCfg({ ...cloudCfg, url: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anon (public) API Key</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="eyJhbGciOi… — Supabase → Project Settings → API → anon public"
                      value={cloudCfg.key} onChange={e => setCloudCfg({ ...cloudCfg, key: e.target.value })} />
                  </div>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="checkbox" checked={cloudCfg.autoSync}
                      onChange={e => setCloudCfg({ ...cloudCfg, autoSync: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300" />
                    <span>Auto-sync — push to the cloud 10 seconds after every change</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => {
                        saveCloudConfig(cloudCfg);
                        toast('Cloud settings saved.', 'success');
                      }}
                      className={`px-4 py-2 ${tc.btn} text-white rounded-lg text-sm font-medium`}>
                      Save Settings
                    </button>
                    <button disabled={cloudBusy} onClick={async () => {
                        saveCloudConfig(cloudCfg); setCloudBusy(true);
                        const r = await testConnection();
                        setCloudBusy(false);
                        toast(r.ok ? 'Connected to Supabase successfully!' : `Connection failed: ${r.error}`, r.ok ? 'success' : 'error');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                      <RefreshCw className={`h-4 w-4 ${cloudBusy ? 'animate-spin' : ''}`} />Test Connection
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <p className="font-semibold text-green-900 flex items-center gap-2"><UploadCloud className="h-4 w-4" />Push to Cloud</p>
                  <p className="text-xs text-green-700 mt-1 mb-3">Uploads this computer's data, replacing what's in the cloud.</p>
                  <button disabled={cloudBusy} onClick={async () => {
                      saveCloudConfig(cloudCfg); setCloudBusy(true);
                      const r = await pushToCloud(exportAllData());
                      setCloudBusy(false);
                      if (r.ok) setCloudCfg(getCloudConfig());
                      toast(r.ok ? 'Data pushed to the cloud.' : `Push failed: ${r.error}`, r.ok ? 'success' : 'error');
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    Push Now
                  </button>
                </div>
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 flex items-center gap-2"><DownloadCloud className="h-4 w-4" />Pull from Cloud</p>
                  <p className="text-xs text-blue-700 mt-1 mb-3">Replaces this computer's data with the cloud copy, then reloads.</p>
                  <button disabled={cloudBusy} onClick={async () => {
                      saveCloudConfig(cloudCfg);
                      if (!window.confirm('This replaces ALL data on this computer with the cloud copy. Continue?')) return;
                      setCloudBusy(true);
                      const r = await pullFromCloud();
                      setCloudBusy(false);
                      if (r.ok && r.json) {
                        importAllData(r.json); // reloads on success
                      } else {
                        toast(`Pull failed: ${r.error}`, 'error');
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    Pull Now
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <button onClick={() => setShowSql(!showSql)} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  {showSql ? '▾' : '▸'} One-time setup — run this SQL in Supabase (SQL Editor → New query)
                </button>
                {showSql && (
                  <>
                    <pre className="mt-3 bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">{SETUP_SQL}</pre>
                    <button onClick={() => { navigator.clipboard.writeText(SETUP_SQL); toast('SQL copied to clipboard.', 'success'); }}
                      className="mt-2 text-xs text-blue-600 hover:underline">Copy SQL</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---------------- DATA CLEANUP ---------------- */}
          {tab === 'cleanup' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Deleting data cannot be undone. <strong>Download a backup first.</strong>
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-5">
                <p className="font-semibold text-gray-900 mb-1">Wipe selected sections</p>
                <p className="text-sm text-gray-500 mb-4">Choose which sections to clear — everything else stays.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {WIPE_SECTIONS.map(s => (
                    <button key={s.id} onClick={() => toggleWipeSection(s.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                        wipeSelection.has(s.id)
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${wipeSelection.has(s.id) ? 'bg-red-500' : 'border border-gray-300 bg-white'}`}>
                        {wipeSelection.has(s.id) && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  disabled={wipeSelection.size === 0}
                  onClick={() => {
                    if (window.confirm(`Permanently delete data for: ${[...wipeSelection].join(', ')}?\n\nThis cannot be undone.`)) {
                      wipeData([...wipeSelection]);
                    }
                  }}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  <Trash2 className="h-4 w-4" />
                  <span>Wipe {wipeSelection.size || ''} Selected Section{wipeSelection.size !== 1 ? 's' : ''}</span>
                </button>
              </div>

              <div className="border-2 border-red-300 rounded-lg p-5 bg-red-50">
                <p className="font-semibold text-red-900 mb-1">Wipe ALL data</p>
                <p className="text-sm text-red-700 mb-3">
                  Resets the entire system to a fresh install — every student, payment, result and setting is deleted.
                  Type <strong>DELETE EVERYTHING</strong> to enable the button.
                </p>
                <input value={confirmText} onChange={e => setConfirmText(e.target.value)}
                  placeholder="Type DELETE EVERYTHING"
                  className="w-full max-w-xs px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-red-400 focus:border-transparent" />
                <br />
                <button
                  disabled={confirmText !== 'DELETE EVERYTHING'}
                  onClick={() => {
                    if (window.confirm('FINAL WARNING: this deletes absolutely everything. Continue?')) {
                      wipeData('all');
                    }
                  }}
                  className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Wipe Entire System</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {userModalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => { setUserModalOpen(false); setEditingUser(null); }}
          onSave={u => {
            if (editingUser) { updateUser(editingUser.id, u); toast('User updated.', 'success'); }
            else if (users.some(x => x.username.toLowerCase() === u.username.toLowerCase())) {
              toast('That username is already taken.', 'error'); return;
            }
            else { addUser(u); toast('User added.', 'success'); }
            setUserModalOpen(false); setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
