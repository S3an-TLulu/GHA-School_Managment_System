import { useState, useRef, useEffect } from 'react';
import { Users, Database, Trash2, Shield, Download, Upload, AlertTriangle, Plus, Pencil, X, Check, Cloud, RefreshCw, UploadCloud, DownloadCloud, CalendarRange, Copy, KeyRound, History, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth, AppUser, UserRole, ROLE_PERMISSIONS } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { generatePassword } from '../lib/auth';
import { getAudit, clearAudit, logAudit, AUDIT_LABELS, AuditEntry } from '../lib/audit';
import { getCloudConfig, saveCloudConfig, pushToCloud, pullFromCloud, testConnection, SETUP_SQL, SETUP_SQL_LIVE, isLiveSyncEnabled, setLiveSyncEnabled, pullAllLive } from '../lib/supabase';

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
  { id: 'hr', label: 'HR (payroll + advances)' },
  { id: 'kitchen', label: 'Kitchen Groceries' },
];

// Small copy-to-clipboard button used by the password + master-code fields.
function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={() => { if (!value) return; navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="flex items-center gap-1 px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap">
      {done ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Copied' : label}
    </button>
  );
}

function UserModal({ user, onClose }: { user: AppUser | null; onClose: () => void }) {
  const { addUser, updateUser, setUserPassword, users } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'Cashier' as UserRole,
  });
  // For a new user this holds the plain password; for an existing user it's the
  // optional "reset to" password (blank = leave unchanged).
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (user) {
      updateUser(user.id, { fullName: form.fullName, username: form.username, email: form.email || undefined, role: form.role });
      if (password.trim()) { await setUserPassword(user.id, password.trim()); toast('User updated and password reset.', 'success'); }
      else toast('User updated.', 'success');
      setBusy(false); onClose(); return;
    }
    if (!password.trim()) { toast('Set or generate a password for the new user.', 'warning'); setBusy(false); return; }
    if (users.some(u => u.username.toLowerCase() === form.username.trim().toLowerCase())) {
      toast('That username is already taken.', 'error'); setBusy(false); return;
    }
    await addUser({ id: `user-${Date.now()}`, ...form, email: form.email || undefined, password: password.trim() });
    toast('User added.', 'success');
    setBusy(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={submit}>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(for record only — not used to send anything)</span></label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Reset Password' : 'Password *'}
              {user && <span className="text-gray-400 font-normal"> — leave blank to keep current</span>}
            </label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={user ? 'New password…' : 'Type or generate'} />
              <button type="button" onClick={() => setPassword(generatePassword())}
                className="flex items-center gap-1 px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                <RefreshCw className="h-3.5 w-3.5" />Generate
              </button>
              <CopyButton value={password} />
            </div>
            {password && (
              <p className="text-xs text-amber-600 mt-1">Copy and share this with the user now — it's stored encrypted and can't be shown again later.</p>
            )}
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy} className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg disabled:opacity-50">{busy ? 'Saving…' : user ? 'Update' : 'Add User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Settings() {
  const { exportAllData, importAllData, wipeData, terms, addTerm, deleteTerm, currentTerm, setCurrentTerm, payments, expenses } = useAppContext();
  const { users, currentUser, deleteUser, hasMasterCode, setMasterCode, generateMasterCode } = useAuth();
  const [masterDraft, setMasterDraft] = useState('');
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'users' | 'terms' | 'backup' | 'cloud' | 'activity' | 'cleanup'>('users');
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem('gha_last_backup'));
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState('');

  // Keep the activity view live as new entries are logged.
  useEffect(() => {
    const refresh = () => setAudit(getAudit());
    refresh();
    window.addEventListener('gha-audit', refresh);
    return () => window.removeEventListener('gha-audit', refresh);
  }, []);
  const [newTerm, setNewTerm] = useState('');
  const [cloudCfg, setCloudCfg] = useState(getCloudConfig);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [liveOn, setLiveOn] = useState(isLiveSyncEnabled);
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
    const now = new Date().toISOString();
    localStorage.setItem('gha_last_backup', now);
    setLastBackup(now);
    logAudit('data-exported', 'Downloaded a backup file');
    toast('Backup downloaded. Keep it somewhere safe!', 'success');
  };

  // How long since the last downloaded backup, for the reminder banner.
  const daysSinceBackup = lastBackup
    ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86_400_000)
    : null;
  const backupStale = daysSinceBackup === null || daysSinceBackup >= 7;

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

      {/* Backup reminder — nudges the admin to download a fresh backup */}
      <div className={`flex items-center justify-between gap-3 flex-wrap rounded-lg border px-4 py-3 ${
        backupStale ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <Clock className={`h-4 w-4 ${backupStale ? 'text-amber-600' : 'text-green-600'}`} />
          <span className={backupStale ? 'text-amber-800' : 'text-green-800'}>
            {lastBackup
              ? `Last backup downloaded ${daysSinceBackup === 0 ? 'today' : `${daysSinceBackup} day${daysSinceBackup === 1 ? '' : 's'} ago`}.`
              : 'You have never downloaded a backup.'}
            {backupStale && ' A fresh backup is recommended.'}
          </span>
        </div>
        <button onClick={handleExport}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white ${backupStale ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}>
          <Download className="h-4 w-4" /> Backup now
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex space-x-1">
          {[
            { id: 'users' as const, label: 'Users & Roles', icon: Users },
            { id: 'terms' as const, label: 'School Terms', icon: CalendarRange },
            { id: 'backup' as const, label: 'Backup & Restore', icon: Database },
            { id: 'cloud' as const, label: 'Cloud Sync', icon: Cloud },
            { id: 'activity' as const, label: 'Activity Log', icon: History },
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

              {/* Master access code */}
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-semibold text-amber-900">Master Access Code</p>
                  {hasMasterCode && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">set</span>}
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  A backup code you can give a staff member to prove it's really you granting access —
                  or keep as an emergency admin key. Generate it, copy it, and store it somewhere safe.
                  Setting a new code replaces the old one.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <input type="text" value={masterDraft} onChange={e => setMasterDraft(e.target.value)}
                    placeholder="Generate or type a code"
                    className="flex-1 min-w-[160px] px-3 py-2 border border-amber-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                  <button type="button" onClick={() => setMasterDraft(generateMasterCode())}
                    className="flex items-center gap-1 px-3 py-2 border border-amber-300 rounded-lg text-xs text-amber-800 hover:bg-amber-100 whitespace-nowrap">
                    <RefreshCw className="h-3.5 w-3.5" />Generate
                  </button>
                  <CopyButton value={masterDraft} />
                  <button type="button" disabled={!masterDraft.trim()}
                    onClick={async () => { await setMasterCode(masterDraft.trim()); toast('Master code saved. Keep the copied code safe!', 'success'); }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-40">
                    Save Code
                  </button>
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

              <div className={`border rounded-lg p-5 ${liveOn ? 'border-green-300 bg-green-50' : 'border-purple-200 bg-purple-50'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className={`font-semibold ${liveOn ? 'text-green-900' : 'text-purple-900'}`}>
                      ⚡ Live Sync {liveOn && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full ml-1">ON</span>}
                    </p>
                    <p className={`text-sm mt-1 ${liveOn ? 'text-green-700' : 'text-purple-700'}`}>
                      Changes sync between computers automatically within seconds — each section
                      syncs on its own, so two people can work in different sections at the same time.
                      Run the Live Sync SQL below once before enabling.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={liveOn}
                      onChange={e => {
                        setLiveSyncEnabled(e.target.checked);
                        setLiveOn(e.target.checked);
                        toast(e.target.checked ? 'Live sync ON — reloading to connect…' : 'Live sync turned off.', 'success');
                        if (e.target.checked) setTimeout(() => window.location.reload(), 800);
                      }}
                      className="h-5 w-5 rounded border-gray-300" />
                    Enable
                  </label>
                </div>
                <button disabled={cloudBusy} onClick={async () => {
                    setCloudBusy(true);
                    const data = await pullAllLive();
                    setCloudBusy(false);
                    if (!data || Object.keys(data).length === 0) { toast('No live data found yet — enable live sync on the main computer first.', 'warning'); return; }
                    if (!window.confirm('Load the latest live data onto this computer? Local changes to synced sections will be replaced.')) return;
                    Object.entries(data).forEach(([k, v]) => { if (v !== null) localStorage.setItem(k, JSON.stringify(v)); });
                    window.location.reload();
                  }}
                  className="mt-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 disabled:opacity-50">
                  Pull Latest Live Data Now
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <button onClick={() => setShowSql(!showSql)} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  {showSql ? '▾' : '▸'} One-time setup — run this SQL in Supabase (SQL Editor → New query)
                </button>
                {showSql && (
                  <>
                    <p className="mt-3 text-xs font-semibold text-gray-500">1) Backup table (already done if push/pull works):</p>
                    <pre className="mt-1 bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">{SETUP_SQL}</pre>
                    <p className="mt-3 text-xs font-semibold text-gray-500">2) Live Sync table (run before enabling Live Sync):</p>
                    <pre className="mt-1 bg-gray-900 text-purple-300 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">{SETUP_SQL_LIVE}</pre>
                    <button onClick={() => { navigator.clipboard.writeText(SETUP_SQL + '\n\n' + SETUP_SQL_LIVE); toast('Both SQL blocks copied.', 'success'); }}
                      className="mt-2 text-xs text-blue-600 hover:underline">Copy All SQL</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---------------- ACTIVITY LOG ---------------- */}
          {tab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-900">Account & money activity</p>
                  <p className="text-sm text-gray-500">Sign-ins, password changes, user management and edits to payments. Newest first.</p>
                </div>
                {audit.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Clear the entire activity log? This cannot be undone.')) { clearAudit(); }
                    }}
                    className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-1.5">
                    <Trash2 className="h-4 w-4" /> Clear log
                  </button>
                )}
              </div>

              <input value={auditFilter} onChange={e => setAuditFilter(e.target.value)}
                placeholder="Filter by user, action or detail…"
                className="w-full sm:max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {(() => {
                  const q = auditFilter.trim().toLowerCase();
                  const rows = audit.filter(e => {
                    if (!q) return true;
                    const label = AUDIT_LABELS[e.action] || e.action;
                    return `${e.actor} ${label} ${e.detail || ''}`.toLowerCase().includes(q);
                  });
                  if (rows.length === 0) {
                    return <p className="px-4 py-12 text-sm text-gray-400 text-center">
                      {audit.length === 0 ? 'No activity recorded yet.' : 'Nothing matches that filter.'}
                    </p>;
                  }
                  return (
                    <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-50">
                      {rows.map(e => {
                        const label = AUDIT_LABELS[e.action] || e.action;
                        const danger = e.action.includes('deleted') || e.action.includes('wiped') || e.action.includes('failed') || e.action.includes('locked');
                        return (
                          <div key={e.id} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${danger ? 'bg-red-400' : 'bg-green-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900">
                                <span className="font-medium">{e.actor}</span>
                                <span className="text-gray-500"> — {label}</span>
                              </p>
                              {e.detail && <p className="text-xs text-gray-500 truncate">{e.detail}</p>}
                            </div>
                            <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                              {new Date(e.at).toLocaleString('en-ZM', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <p className="text-xs text-gray-400">The log keeps the most recent 500 events and is included in your backups.</p>
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
                      logAudit('data-wiped', `Sections: ${[...wipeSelection].join(', ')}`);
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
        />
      )}
    </div>
  );
}
