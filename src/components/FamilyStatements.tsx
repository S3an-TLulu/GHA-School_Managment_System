import { useState } from 'react';
import { Search, Printer, Users, ChevronDown, ChevronRight, FileDown, MessageCircle, Phone, Mail, Plus, UserPlus, Pencil, Trash2, X, Link2, Heart } from 'lucide-react';
import { printHtml, exportPdf } from '../lib/print';
import { useAppContext, Family, FamilyGuardian } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { waLink, buildFeeReminder } from '../lib/notify';
import { PersonDocuments } from './PersonDocs';

const RELATIONS = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Other'];
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// A normalised family unit — either an explicit managed Family, or an auto-derived
// group of students that share a guardian name + phone.
interface Unit {
  id: string;
  explicit: boolean;
  family?: Family;
  name: string;
  guardians: FamilyGuardian[];
  students: Array<{ id: string; name: string; grade: string }>;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  docOwnerId: string;
}

export function FamilyStatements() {
  const { students, payments, branding, currentTerm, addPayment, families, addFamily, updateFamily, deleteFamily } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Family | 'new' | null>(null);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');

  const totalsFor = (ids: string[]) => {
    const ps = payments.filter(p => ids.includes(p.studentId));
    return {
      totalPaid: ps.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
      totalPending: ps.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
      totalOverdue: ps.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
    };
  };

  // Explicit managed families first, then derived groups for any remaining students.
  const assigned = new Set(families.flatMap(f => f.studentIds));
  const explicitUnits: Unit[] = families.map(f => {
    const sts = f.studentIds
      .map(id => students.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(s => ({ id: s.id, name: s.name, grade: s.grade }));
    return { id: f.id, explicit: true, family: f, name: f.name || 'Family', guardians: f.guardians, students: sts, ...totalsFor(sts.map(s => s.id)), docOwnerId: `fam-${f.id}` };
  });

  const derivedMap = new Map<string, Unit>();
  activeStudents.filter(s => !assigned.has(s.id)).forEach(student => {
    const key = `${student.guardianName}-${student.guardianPhone}`;
    if (!derivedMap.has(key)) {
      derivedMap.set(key, {
        id: `derived-${key}`, explicit: false, name: student.guardianName || 'Guardian',
        guardians: [{ id: 'g', name: student.guardianName, phone: student.guardianPhone, email: student.guardianEmail }],
        students: [], totalPaid: 0, totalPending: 0, totalOverdue: 0, docOwnerId: student.guardianPhone || key,
      });
    }
    derivedMap.get(key)!.students.push({ id: student.id, name: student.name, grade: student.grade });
  });
  derivedMap.forEach(u => { Object.assign(u, totalsFor(u.students.map(s => s.id))); });

  const units = [...explicitUnits, ...derivedMap.values()];
  const q = searchTerm.toLowerCase();
  const filtered = units.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.guardians.some(g => g.name.toLowerCase().includes(q) || (g.phone || '').includes(searchTerm)) ||
    u.students.some(s => s.name.toLowerCase().includes(q))
  );

  const primaryPhone = (u: Unit) => u.guardians.find(g => g.phone)?.phone || '';

  const remindUnit = (u: Unit) => {
    const balance = u.totalPending + u.totalOverdue;
    const phone = primaryPhone(u);
    if (!phone) { toast('No phone number on this family.', 'warning'); return; }
    if (balance <= 0) { toast('This family has no outstanding balance.', 'info'); return; }
    const msg = buildFeeReminder({
      schoolName: branding.schoolName, recipientName: u.guardians[0]?.name || u.name,
      what: 'school fees', balance, studentName: u.students.map(s => s.name).join(', '),
    });
    window.open(waLink(phone, msg), '_blank', 'noopener');
  };

  const quickPay = (studentId: string, studentName: string) => {
    const input = window.prompt(`Record a payment for ${studentName}\n\nAmount received (K):`);
    if (!input) return;
    const amt = parseFloat(input);
    if (isNaN(amt) || amt <= 0) { toast('Invalid amount.', 'error'); return; }
    const now = new Date().toISOString();
    addPayment({
      id: `pay-${Date.now()}`, studentId, type: 'Fees', amount: amt,
      dueDate: now, status: 'paid', paidDate: now, createdDate: now,
      term: currentTerm, receiptNumber: `RCP-${Date.now().toString().slice(-6)}`, paymentMethod: 'Cash',
    });
    toast(`K${amt.toLocaleString()} recorded for ${studentName}.`, 'success');
  };

  // Turn a derived guardian group into a managed family (opens the editor prefilled).
  const linkDerived = (u: Unit) => setEditing({
    id: uid('fam'), name: `${u.guardians[0]?.name || 'Family'} family`,
    guardians: u.guardians.map(g => ({ ...g, id: uid('g'), relation: g.relation || 'Guardian' })),
    studentIds: u.students.map(s => s.id), createdAt: new Date().toISOString(),
  } as Family);

  const handlePrint = (u: Unit, pdf = false) => {
    const studentRows = u.students.map(s => {
      const sp = payments.filter(p => p.studentId === s.id);
      const paid = sp.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const pending = sp.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
      const overdue = sp.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
      return `<tr><td style="padding:8px;border:1px solid #ddd">${s.name}</td><td style="padding:8px;border:1px solid #ddd">${s.grade}</td><td style="padding:8px;border:1px solid #ddd;color:#16a34a">K${paid.toLocaleString()}</td><td style="padding:8px;border:1px solid #ddd;color:#d97706">K${pending.toLocaleString()}</td><td style="padding:8px;border:1px solid #ddd;color:#dc2626">K${overdue.toLocaleString()}</td></tr>`;
    }).join('');
    const paymentRows = u.students.flatMap(s =>
      payments.filter(p => p.studentId === s.id).map(p => `<tr><td style="padding:6px;border:1px solid #eee">${s.name}</td><td style="padding:6px;border:1px solid #eee">${p.type}</td><td style="padding:6px;border:1px solid #eee">${p.term || '—'}</td><td style="padding:6px;border:1px solid #eee">K${p.amount.toLocaleString()}</td><td style="padding:6px;border:1px solid #eee;color:${p.status === 'paid' ? '#16a34a' : p.status === 'overdue' ? '#dc2626' : '#d97706'}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</td><td style="padding:6px;border:1px solid #eee">${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td></tr>`)
    ).join('');
    const guardianRows = u.guardians.map(g => `<p><strong>${g.relation ? g.relation + ': ' : ''}</strong>${g.name}${g.phone ? ' · ' + g.phone : ''}${g.email ? ' · ' + g.email : ''}</p>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Family Statement - ${u.name}</title>
      <style>body{font-family:'Century Gothic',Calibri,Arial,sans-serif;margin:20px;color:#222}h1{color:#1d4ed8}h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1d4ed8;color:#fff;padding:8px;text-align:left;font-size:12px}.summary{display:flex;gap:16px;margin:16px 0}.summary-box{padding:12px 20px;border-radius:8px;flex:1;text-align:center}@media print{button{display:none}}</style></head>
      <body>
        <div style="display:flex;justify-content:space-between;margin-bottom:20px">
          <div><h1>${branding.schoolName || 'Great Highway Academy'}</h1><p style="color:#6b7280">Family Payment Statement</p><p style="color:#6b7280">Generated: ${new Date().toLocaleDateString()}</p></div>
          <div style="text-align:right"><p><strong>${u.name}</strong></p></div>
        </div>
        <h2>Guardians</h2>${guardianRows || '<p>—</p>'}
        <div class="summary">
          <div class="summary-box" style="background:#dcfce7;color:#166534"><div style="font-size:12px">Total Paid</div><div style="font-size:20px;font-weight:bold">K${u.totalPaid.toLocaleString()}</div></div>
          <div class="summary-box" style="background:#fef9c3;color:#854d0e"><div style="font-size:12px">Pending</div><div style="font-size:20px;font-weight:bold">K${u.totalPending.toLocaleString()}</div></div>
          <div class="summary-box" style="background:#fee2e2;color:#991b1b"><div style="font-size:12px">Overdue</div><div style="font-size:20px;font-weight:bold">K${u.totalOverdue.toLocaleString()}</div></div>
        </div>
        <h2>Children Summary</h2>
        <table><thead><tr><th>Student Name</th><th>Grade</th><th>Paid</th><th>Pending</th><th>Overdue</th></tr></thead><tbody>${studentRows || '<tr><td colspan="5" style="padding:8px">No children linked.</td></tr>'}</tbody></table>
        <h2>Detailed Payment History</h2>
        <table><thead><tr><th>Student</th><th>Type</th><th>Term</th><th>Amount</th><th>Status</th><th>Date Paid</th></tr></thead><tbody>${paymentRows}</tbody></table>
        <p style="color:#6b7280;font-size:12px;margin-top:30px">Computer-generated statement — ${branding.schoolName || 'Great Highway Academy'}.</p>
        <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`;
    if (pdf) exportPdf(html, `Family_Statement_${u.name}`); else printHtml(html);
  };

  const totalOutstanding = units.reduce((sum, u) => sum + u.totalPending + u.totalOverdue, 0);
  const withBalance = units.filter(u => u.totalPending + u.totalOverdue > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Families</h1>
          <p className="text-gray-600">Link siblings and partner/guardians, and see each family's balances & statements</p>
        </div>
        <button onClick={() => setEditing('new')} className={`flex items-center gap-1.5 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>
          <UserPlus className="h-4 w-4" />New Family
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Families</p><p className="text-2xl font-bold text-gray-900">{units.length}<span className="text-sm font-normal text-gray-400"> · {families.length} managed</span></p></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="text-sm text-yellow-700">With Outstanding Balance</p><p className="text-2xl font-bold text-yellow-900">{withBalance}</p></div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-sm text-red-700">Total Outstanding</p><p className="text-2xl font-bold text-red-900">K{totalOutstanding.toLocaleString()}</p></div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by family, guardian, phone or student…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filtered.map(u => {
            const isExpanded = expanded === u.id;
            const totalBalance = u.totalPending + u.totalOverdue;
            const phone = primaryPhone(u);
            return (
              <div key={u.id} className="p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : u.id)}>
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.explicit ? tc.light : 'bg-gray-100'}`}>
                      <Users className={`h-5 w-5 ${u.explicit ? tc.text : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">{u.name}
                        {u.explicit ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tc.light} ${tc.text} font-semibold`}>MANAGED</span> : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">auto</span>}
                        {u.guardians.length > 1 && <span className="inline-flex items-center gap-0.5 text-[10px] text-pink-600"><Heart className="h-3 w-3" />{u.guardians.length} partners</span>}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{u.guardians.map(g => g.name).join(' & ') || '—'} &bull; {u.students.length} child{u.students.length !== 1 ? 'ren' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-right hidden sm:block mr-1">
                      <p className="text-sm text-green-600 font-medium">Paid: K{u.totalPaid.toLocaleString()}</p>
                      <p className={`text-sm font-medium ${totalBalance > 0 ? 'text-red-600' : 'text-gray-400'}`}>Balance: K{totalBalance.toLocaleString()}</p>
                    </div>
                    {u.explicit ? (
                      <button onClick={e => { e.stopPropagation(); setEditing(u.family!); }} title="Edit family" className="p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); linkDerived(u); }} title="Link into a managed family" className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm rounded-lg"><Link2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Link</span></button>
                    )}
                    {totalBalance > 0 && phone && (
                      <button onClick={e => { e.stopPropagation(); remindUnit(u); }} title="Send WhatsApp fee reminder" className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"><MessageCircle className="h-3.5 w-3.5" /><span className="hidden sm:inline">Remind</span></button>
                    )}
                    <button onClick={e => { e.stopPropagation(); handlePrint(u); }} className={`flex items-center space-x-1 px-3 py-1.5 ${tc.btn} text-white text-sm rounded-lg`}><Printer className="h-3.5 w-3.5" /><span className="hidden sm:inline">Print</span></button>
                    <button title="Export statement to PDF" onClick={e => { e.stopPropagation(); handlePrint(u, true); }} className="flex items-center px-2 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm rounded-lg"><FileDown className="h-3.5 w-3.5" /></button>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 sm:pl-13">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {u.guardians.map((g, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700">
                          {g.relation && <span className="font-semibold">{g.relation}:</span>}{g.name}
                          {g.phone && <a href={`tel:${g.phone}`} className="text-blue-600 flex items-center gap-0.5"><Phone className="h-3 w-3" />{g.phone}</a>}
                          {g.email && <a href={`mailto:${g.email}`} className="text-blue-600 flex items-center gap-0.5"><Mail className="h-3 w-3" /></a>}
                        </span>
                      ))}
                      {phone && totalBalance > 0 && <button onClick={() => remindUnit(u)} className="inline-flex items-center gap-1.5 text-xs border border-green-200 text-green-700 rounded-lg px-2.5 py-1.5 hover:bg-green-50"><MessageCircle className="h-3.5 w-3.5" />WhatsApp reminder</button>}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-xs text-green-600">Paid</p><p className="font-bold text-green-800">K{u.totalPaid.toLocaleString()}</p></div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center"><p className="text-xs text-yellow-600">Pending</p><p className="font-bold text-yellow-800">K{u.totalPending.toLocaleString()}</p></div>
                      <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-xs text-red-600">Overdue</p><p className="font-bold text-red-800">K{u.totalOverdue.toLocaleString()}</p></div>
                    </div>
                    <div className="mb-4"><PersonDocuments ownerType="family" ownerId={u.docOwnerId} title={`${u.name} — Family Documents`} /></div>
                    <div className="space-y-3">
                      {u.students.map(student => {
                        const sp = payments.filter(p => p.studentId === student.id);
                        return (
                          <div key={student.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900">{student.name} — <span className="text-gray-500">{student.grade}</span></p>
                              <button onClick={() => quickPay(student.id, student.name)} title="Record a payment" className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded px-2 py-1"><Plus className="h-3 w-3" />Payment</button>
                            </div>
                            {sp.length === 0 ? <p className="text-xs text-gray-400">No payment records</p> : (
                              <div className="overflow-x-auto"><table className="w-full text-xs"><tbody>
                                {sp.map(p => (
                                  <tr key={p.id}><td className="pr-4 py-0.5">{p.type}</td><td className="pr-4 py-0.5 text-gray-500">{p.term || '—'}</td><td className="pr-4 py-0.5 font-medium">K{p.amount.toLocaleString()}</td><td className="py-0.5"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : p.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></td></tr>
                                ))}
                              </tbody></table></div>
                            )}
                          </div>
                        );
                      })}
                      {u.students.length === 0 && <p className="text-sm text-gray-400">No children linked yet — use Edit to add some.</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="p-8 text-center text-gray-500">No families found.</div>}
        </div>
      </div>

      {editing && (
        <FamilyEditor
          initial={editing === 'new' ? null : editing}
          activeStudents={activeStudents}
          onClose={() => setEditing(null)}
          onSave={(fam) => {
            if (families.some(f => f.id === fam.id)) updateFamily(fam.id, fam);
            else addFamily(fam);
            setEditing(null);
            toast('Family saved.', 'success');
          }}
          onDelete={editing !== 'new' && families.some(f => f.id === (editing as Family).id) ? () => { deleteFamily((editing as Family).id); setEditing(null); toast('Family removed.', 'info'); } : undefined}
        />
      )}
    </div>
  );
}

function FamilyEditor({ initial, activeStudents, onClose, onSave, onDelete }: {
  initial: Family | null;
  activeStudents: Array<{ id: string; name: string; grade: string }>;
  onClose: () => void; onSave: (f: Family) => void; onDelete?: () => void;
}) {
  const tc = useThemeClasses();
  const [name, setName] = useState(initial?.name || '');
  const [guardians, setGuardians] = useState<FamilyGuardian[]>(initial?.guardians?.length ? initial.guardians : [{ id: uid('g'), name: '', phone: '', email: '', relation: 'Mother' }]);
  const [studentIds, setStudentIds] = useState<string[]>(initial?.studentIds || []);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [find, setFind] = useState('');

  const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm';
  const setGuardian = (id: string, patch: Partial<FamilyGuardian>) => setGuardians(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
  const toggleStudent = (id: string) => setStudentIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

  const save = () => {
    const cleanGuardians = guardians.filter(g => g.name.trim()).map(g => ({ ...g, name: g.name.trim() }));
    onSave({
      id: initial?.id || uid('fam'),
      name: name.trim() || cleanGuardians[0]?.name || 'Family',
      guardians: cleanGuardians, studentIds, notes: notes.trim() || undefined,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  const shown = activeStudents.filter(s => !find || s.name.toLowerCase().includes(find.toLowerCase()) || s.grade.toLowerCase().includes(find.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">{initial ? 'Edit family' : 'New family'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <label className="block text-xs font-medium text-gray-500">Family name
            <input className={`${inp} w-full mt-1`} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Banda Family" />
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-pink-500" />Guardians / partners</p>
              <button onClick={() => setGuardians(gs => [...gs, { id: uid('g'), name: '', phone: '', email: '', relation: 'Father' }])} className="text-xs text-blue-600 flex items-center gap-1"><Plus className="h-3 w-3" />Add partner</button>
            </div>
            <div className="space-y-2">
              {guardians.map(g => (
                <div key={g.id} className="flex flex-wrap gap-2 items-center border border-gray-100 rounded-lg p-2 bg-gray-50">
                  <select className={inp} value={g.relation || ''} onChange={e => setGuardian(g.id, { relation: e.target.value })}>{RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  <input className={`${inp} flex-1 min-w-[120px]`} placeholder="Name" value={g.name} onChange={e => setGuardian(g.id, { name: e.target.value })} />
                  <input className={`${inp} w-32`} placeholder="Phone" value={g.phone || ''} onChange={e => setGuardian(g.id, { phone: e.target.value })} />
                  <input className={`${inp} w-40`} placeholder="Email" value={g.email || ''} onChange={e => setGuardian(g.id, { email: e.target.value })} />
                  {guardians.length > 1 && <button onClick={() => setGuardians(gs => gs.filter(x => x.id !== g.id))} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Children ({studentIds.length} linked)</p>
            <input className={`${inp} w-full mb-2`} placeholder="Search pupils by name or grade…" value={find} onChange={e => setFind(e.target.value)} />
            <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-50">
              {shown.map(s => (
                <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={studentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                  <span className="text-gray-900">{s.name}</span><span className="text-xs text-gray-400">{s.grade}</span>
                </label>
              ))}
              {shown.length === 0 && <p className="px-3 py-4 text-xs text-gray-400 text-center">No pupils match.</p>}
            </div>
          </div>

          <label className="block text-xs font-medium text-gray-500">Notes
            <input className={`${inp} w-full mt-1`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </label>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          {onDelete ? <button onClick={onDelete} className="text-sm text-red-600 hover:underline flex items-center gap-1"><Trash2 className="h-4 w-4" />Delete family</button> : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button onClick={save} className={`${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>Save family</button>
          </div>
        </div>
      </div>
    </div>
  );
}
