import { useState } from 'react';
import { School, ArrowLeft, UserCircle, CreditCard, GraduationCap, Shirt, LogOut, Printer, CalendarCheck, Megaphone, Users } from 'lucide-react';
import { useAppContext, Student } from '../context/AppContext';
import { normalizeZmPhone } from '../lib/notify';

// Read-only, code-gated view for parents/guardians. A guardian enters the
// child's admission number and their phone number; if both match a student
// record they see that child's fees, results and uniform account. Everything is
// read-only — nothing can be changed here. This is light privacy on a
// client-side app, not strong authentication (noted for the school).
export function ParentPortal({ onBack }: { onBack: () => void }) {
  const { students, payments, results, uniformIssues, uniformItems, branding, attendance, announcements } = useAppContext();
  const [adm, setAdm] = useState('');
  const [phone, setPhone] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const admKey = adm.trim().toLowerCase();
    const phoneKey = normalizeZmPhone(phone);
    const match = students.find(s =>
      (s.admissionNumber || '').toLowerCase() === admKey &&
      normalizeZmPhone(s.guardianPhone || '') === phoneKey && phoneKey.length >= 9);
    if (match) setStudent(match);
    else setError('No match found. Check the admission number and the guardian phone on file, or contact the school office.');
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"><ArrowLeft className="h-4 w-4" />Back</button>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-3">{branding.logoUrl ? <img src={branding.logoUrl} alt="" className="w-14 h-14 rounded-full object-cover" /> : <School className="h-7 w-7 text-blue-600" />}</div>
            <h1 className="text-xl font-bold text-gray-900">{branding.schoolName}</h1>
            <p className="text-gray-600 text-sm mt-1">Parent / Guardian Portal</p>
          </div>
          <form onSubmit={lookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Admission Number</label>
              <input value={adm} onChange={e => setAdm(e.target.value)} required placeholder="e.g. GHA-2026-014"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone Number (on file)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 0977 123 456"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">View my child's account</button>
          </form>
          <p className="text-xs text-gray-400 mt-4 text-center">This shows a read-only summary. For changes or questions, contact the school office.</p>
        </div>
      </div>
    );
  }

  // ---- Signed-in view ----
  // Siblings: other children on the same guardian phone, so a parent can switch.
  const guardianKey = normalizeZmPhone(student.guardianPhone || '');
  const siblings = students.filter(s => normalizeZmPhone(s.guardianPhone || '') === guardianKey && (!s.status || s.status === 'active'));

  const myPayments = payments.filter(p => p.studentId === student.id);
  const paid = myPayments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const owing = myPayments.filter(p => p.status !== 'paid').reduce((a, p) => a + p.amount, 0);
  const latestTerm = [...new Set(results.filter(r => r.studentId === student.id).map(r => r.term))].sort().reverse()[0];
  const myResult = results.find(r => r.studentId === student.id && r.term === latestTerm);
  const resultAvg = myResult ? (() => { const v = Object.values(myResult.subjects); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; })() : null;
  const myUniforms = uniformIssues.filter(i => i.studentId === student.id);
  const itemName = (id: string) => uniformItems.find(i => i.id === id)?.name || id;

  // Attendance summary for this child.
  const myAttendance = attendance.filter(a => a.studentId === student.id);
  const attCount = (st: string) => myAttendance.filter(a => a.status === st).length;
  const present = attCount('present'), absent = attCount('absent'), late = attCount('late'), excused = attCount('excused');
  const attRate = myAttendance.length ? Math.round(((present + late) / myAttendance.length) * 100) : null;

  // Announcements a parent should see.
  const parentAnnouncements = announcements
    .filter(a => a.targetAudience === 'All' || a.targetAudience === 'Parents')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 4);
  const priColor: Record<string, string> = { urgent: 'border-red-300 bg-red-50', important: 'border-amber-300 bg-amber-50', normal: 'border-gray-200 bg-gray-50' };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <School className="h-6 w-6 text-blue-600" />}
          <span className="font-bold text-gray-900 text-sm">{branding.schoolName}</span>
        </div>
        <button onClick={() => { setStudent(null); setAdm(''); setPhone(''); }} className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"><LogOut className="h-4 w-4" />Exit</button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5">
        {siblings.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Users className="h-3.5 w-3.5" />Your children</p>
            <div className="flex flex-wrap gap-2">
              {siblings.map(s => (
                <button key={s.id} onClick={() => setStudent(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${s.id === student.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-300'}`}>
                  {s.name} <span className={`text-xs ${s.id === student.id ? 'text-blue-100' : 'text-gray-400'}`}>· {s.grade}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          {student.photoUrl ? <img src={student.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" /> : <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center"><UserCircle className="h-9 w-9 text-blue-400" /></div>}
          <div><p className="text-lg font-bold text-gray-900">{student.name}</p><p className="text-sm text-gray-500">{student.grade}{student.admissionNumber ? ` · ${student.admissionNumber}` : ''}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"><p className="text-xs text-gray-500 flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" />Paid</p><p className="text-2xl font-bold text-green-600">K{paid.toLocaleString()}</p></div>
          <div className={`rounded-xl border shadow-sm p-4 ${owing > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}><p className="text-xs text-gray-500">Outstanding</p><p className={`text-2xl font-bold ${owing > 0 ? 'text-red-600' : 'text-gray-900'}`}>K{owing.toLocaleString()}</p></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">Fees &amp; Payments</div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {myPayments.length === 0 ? <p className="px-4 py-6 text-sm text-gray-400 text-center">No payment records.</p> :
              [...myPayments].sort((a, b) => (b.paidDate || b.dueDate || '').localeCompare(a.paidDate || a.dueDate || '')).map(p => (
                <div key={p.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div className="min-w-0"><p className="text-gray-900 truncate">{p.type}</p><p className="text-xs text-gray-400">{[p.term, p.paidDate ? `Paid ${new Date(p.paidDate).toLocaleDateString('en-GB')}` : (p.dueDate ? `Due ${new Date(p.dueDate).toLocaleDateString('en-GB')}` : ''), p.paymentMethod, p.receiptNumber].filter(Boolean).join(' · ')}</p></div>
                  <div className="text-right flex-shrink-0"><p className="font-medium text-gray-900">K{p.amount.toLocaleString()}</p><span className={`text-xs px-1.5 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span></div>
                </div>
              ))}
          </div>
        </div>

        {myAttendance.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-600" />Attendance
              {attRate !== null && <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${attRate >= 90 ? 'bg-green-100 text-green-700' : attRate >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{attRate}% present</span>}
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-50 text-center">
              {[['Present', present, 'text-green-600'], ['Absent', absent, 'text-red-600'], ['Late', late, 'text-amber-600'], ['Excused', excused, 'text-gray-500']].map(([label, n, c]) => (
                <div key={label as string} className="px-2 py-3"><p className={`text-xl font-bold ${c}`}>{n as number}</p><p className="text-xs text-gray-400">{label}</p></div>
              ))}
            </div>
          </div>
        )}

        {parentAnnouncements.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-blue-600" />School announcements</div>
            <div className="p-3 space-y-2">
              {parentAnnouncements.map(a => (
                <div key={a.id} className={`rounded-lg border p-3 ${priColor[a.priority] || priColor.normal}`}>
                  <div className="flex items-center justify-between gap-2"><p className="font-medium text-gray-900 text-sm">{a.title}</p><span className="text-xs text-gray-400 flex-shrink-0">{a.date ? new Date(a.date).toLocaleDateString('en-GB') : ''}</span></div>
                  <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {myResult && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" />Results — {latestTerm} {resultAvg !== null && <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${resultAvg >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Avg {resultAvg}%</span>}</div>
            <div className="divide-y divide-gray-50">
              {Object.entries(myResult.subjects).map(([sub, mark]) => (
                <div key={sub} className="px-4 py-2 flex justify-between text-sm"><span className="text-gray-700">{sub}</span><span className={`font-medium ${mark >= 50 ? 'text-gray-900' : 'text-red-600'}`}>{mark}%</span></div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center gap-2"><Shirt className="h-4 w-4 text-blue-600" />Uniform account</div>
          <div className="divide-y divide-gray-50">
            {myUniforms.length === 0 ? <p className="px-4 py-6 text-sm text-gray-400 text-center">No uniforms on record.</p> :
              myUniforms.map(u => <div key={u.id} className="px-4 py-2 flex justify-between text-sm"><span className="text-gray-700">{itemName(u.itemId)} <span className="text-xs text-gray-400">· {u.size}</span></span><span className="text-gray-500">×{u.quantity}</span></div>)}
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-white"><Printer className="h-4 w-4" />Print this summary</button>
        </div>
        <p className="text-center text-xs text-gray-400 pb-6">Read-only summary from {branding.schoolName}. Contact the office for anything that looks wrong.</p>
      </main>
    </div>
  );
}
