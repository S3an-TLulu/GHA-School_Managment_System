import { useState } from 'react';
import { UserCircle, Shield, KeyRound, Check, Mail, Briefcase } from 'lucide-react';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { verifyPassword, passwordStrength } from '../lib/auth';

const ROLE_BLURB: Record<string, string> = {
  Admin: 'Full access to every section, including Settings and user management.',
  Cashier: 'Front-desk finance: payments, cashier, debtors, uniforms, transport, fundraisers, kitchen and reports.',
  Teacher: 'Academics: attendance, results, timetable, class manager, calendar, events and announcements.',
  Viewer: 'Read-only overview: dashboard, calendar, events and announcements.',
};

export function Profile() {
  const { currentUser, setUserPassword } = useAuth();
  const { teachers, students, payments } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();

  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  if (!currentUser) return null;

  const perms = ROLE_PERMISSIONS[currentUser.role];
  const sectionCount = perms === 'all' ? 'all' : `${perms.length}`;

  // If this user's full name matches a staff record, surface a bit of their world
  const staff = teachers.find(t => t.name === currentUser.fullName);
  const staffPhoto = staff?.photoUrl;
  const myClass = staff?.assignedClass;
  const classStudents = myClass ? students.filter(s => s.grade === myClass && (!s.status || s.status === 'active')).length : 0;

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 5) { toast('New password must be at least 5 characters.', 'warning'); return; }
    if (next !== confirm) { toast('New password and confirmation do not match.', 'error'); return; }
    setBusy(true);
    const valid = await verifyPassword(currentUser.username, cur, currentUser.password);
    if (!valid) {
      setBusy(false);
      toast('Your current password is incorrect.', 'error');
      return;
    }
    await setUserPassword(currentUser.id, next);
    setBusy(false);
    setCur(''); setNext(''); setConfirm('');
    toast('Your password has been changed.', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Your account, access level and password</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-4 flex-wrap">
          {staffPhoto ? (
            <img src={staffPhoto} alt={currentUser.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
          ) : (
            <div className={`w-20 h-20 rounded-full ${tc.light} flex items-center justify-center`}>
              <UserCircle className={`h-10 w-10 ${tc.text}`} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900">{currentUser.fullName}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                currentUser.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                currentUser.role === 'Cashier' ? 'bg-green-100 text-green-800' :
                currentUser.role === 'Teacher' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="h-3 w-3" />{currentUser.role}
              </span>
              <span className="text-xs text-gray-500">@{currentUser.username}</span>
              {currentUser.email && (
                <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{currentUser.email}</span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">{ROLE_BLURB[currentUser.role]}</p>
        <p className="text-xs text-gray-400 mt-1">You can access {sectionCount === 'all' ? 'all' : sectionCount} sections of the system.</p>
      </div>

      {/* Staff snapshot (only if this account maps to a teacher record) */}
      {staff && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className={`h-5 w-5 ${tc.text}`} />
            <h2 className="font-semibold text-gray-900">Staff Record</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-gray-500">Subject</p><p className="font-medium text-gray-900">{staff.subject || '—'}</p></div>
            <div><p className="text-xs text-gray-500">Role</p><p className="font-medium text-gray-900">{staff.role}</p></div>
            <div><p className="text-xs text-gray-500">Assigned Class</p><p className="font-medium text-gray-900">{myClass || '—'}</p></div>
            <div><p className="text-xs text-gray-500">Pupils in Class</p><p className="font-medium text-gray-900">{myClass ? classStudents : '—'}</p></div>
          </div>
        </div>
      )}

      {/* Change own password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className={`h-5 w-5 ${tc.text}`} />
          <h2 className="font-semibold text-gray-900">Change My Password</h2>
        </div>
        <form className="space-y-3" onSubmit={changePassword}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" required value={cur} onChange={e => setCur(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" required value={next} onChange={e => setNext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          {next && (
            <div>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => {
                  const s = passwordStrength(next).score;
                  const color = s <= 1 ? 'bg-red-400' : s === 2 ? 'bg-amber-400' : s === 3 ? 'bg-lime-500' : 'bg-green-500';
                  return <span key={i} className={`h-1.5 flex-1 rounded-full ${i < s ? color : 'bg-gray-200'}`} />;
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">{passwordStrength(next).label}</p>
            </div>
          )}
          <button type="submit" disabled={busy}
            className={`flex items-center gap-1.5 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`}>
            <Check className="h-4 w-4" />{busy ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
