import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Heart, Check, Download, Users, UserPlus, Phone } from 'lucide-react';
import { useAppContext, SchoolEvent } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const FUNDRAISER_TYPES = [
  'Sports Day', 'Aerobics Day', 'Graduation Participation', 'School Concert',
  'Charity Walk', 'Bake Sale', 'Fun Run', 'Talent Show', 'Quiz Night', 'Other Fundraiser',
];

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function FundraiserModal({ event, onSave, onClose }: {
  event: SchoolEvent | null;
  onSave: (e: SchoolEvent) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date ? event.date.split('T')[0] : '',
    participationFee: event?.participationFee?.toString() || '',
    expectedParticipants: event?.expectedParticipants?.toString() || '',
    collectionStartDate: event?.collectionStartDate ? event.collectionStartDate.split('T')[0] : '',
    collectionEndDate: event?.collectionEndDate ? event.collectionEndDate.split('T')[0] : '',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{event ? 'Edit Fundraiser' : 'New Fundraiser'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => {
          e.preventDefault();
          onSave({
            id: event?.id || `event-${Date.now()}`,
            title: form.title,
            description: form.description,
            date: form.date,
            type: 'Fundraiser',
            targetAudience: 'All',
            participationFee: form.participationFee ? parseFloat(form.participationFee) : undefined,
            expectedParticipants: form.expectedParticipants ? parseInt(form.expectedParticipants) : undefined,
            collectionStartDate: form.collectionStartDate || undefined,
            collectionEndDate: form.collectionEndDate || undefined,
          });
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fundraiser Name *</label>
            <input required list="fundraiser-types" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Sports Day — pick a preset or type your own" />
            <datalist id="fundraiser-types">
              {FUNDRAISER_TYPES.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee / Person (K) *</label>
              <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.participationFee} onChange={e => setForm({ ...form, participationFee: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected People</label>
              <input type="number" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.expectedParticipants} onChange={e => setForm({ ...form, expectedParticipants: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Opens</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.collectionStartDate} onChange={e => setForm({ ...form, collectionStartDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Closes</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.collectionEndDate} onChange={e => setForm({ ...form, collectionEndDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details…" />
          </div>
          <p className="text-xs text-gray-400">Fundraisers automatically appear on the School Calendar and Events page too.</p>
          <div className="flex space-x-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{event ? 'Update' : 'Create Fundraiser'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Fundraisers() {
  const {
    events, addEvent, updateEvent, deleteEvent, students,
    fundraiserParticipants, toggleFundraiserParticipant,
    externalFundraiserPayments, addExternalFundraiserPayment, deleteExternalFundraiserPayment,
  } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [extForm, setExtForm] = useState({ name: '', phone: '', amount: '' });

  const fundraisers = events
    .filter(e => e.type === 'Fundraiser')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const active = fundraisers.find(f => f.id === activeEventId) || fundraisers[0] || null;

  const studentPaid = active ? fundraiserParticipants.filter(p => p.eventId === active.id) : [];
  const externalPaid = active ? externalFundraiserPayments.filter(p => p.eventId === active.id) : [];
  const paidIds = new Set(studentPaid.map(p => p.studentId));
  const studentTotal = studentPaid.reduce((s, p) => s + p.amountPaid, 0);
  const externalTotal = externalPaid.reduce((s, p) => s + p.amountPaid, 0);
  const grandTotal = studentTotal + externalTotal;
  const target = active?.participationFee
    ? active.participationFee * (active.expectedParticipants ?? activeStudents.length)
    : 0;
  const pct = target > 0 ? Math.min(100, Math.round((grandTotal / target) * 100)) : 0;

  const totalRaisedAllEvents = fundraiserParticipants.reduce((s, p) => s + p.amountPaid, 0)
    + externalFundraiserPayments.reduce((s, p) => s + p.amountPaid, 0);

  const handleExport = () => {
    if (!active) return;
    const rows: string[][] = [
      [`Fundraiser: ${active.title}`],
      [`Date: ${new Date(active.date).toLocaleDateString()}`],
      [`Fee: K${active.participationFee ?? 0} per person`],
      [],
      ['STUDENTS'],
      ['Name', 'Grade', 'Guardian', 'Phone', 'Status', 'Amount', 'Date Paid'],
      ...activeStudents.map(s => {
        const rec = studentPaid.find(p => p.studentId === s.id);
        return [s.name, s.grade, s.guardianName, s.guardianPhone,
          rec ? 'Paid' : 'Not Paid', rec ? `K${rec.amountPaid}` : '—',
          rec ? new Date(rec.paidDate).toLocaleDateString() : '—'];
      }),
      [],
      ['EXTERNAL / GUESTS'],
      ['Name', 'Phone', 'Amount', 'Date Paid'],
      ...externalPaid.map(p => [p.name, p.phone || '—', `K${p.amountPaid}`, new Date(p.paidDate).toLocaleDateString()]),
      [],
      ['SUMMARY'],
      ['Students collected', `K${studentTotal}`],
      ['External collected', `K${externalTotal}`],
      ['Grand total', `K${grandTotal}`],
      ['Target', `K${target}`],
    ];
    downloadCSV(rows, `Fundraiser_${active.title.replace(/\s+/g, '_')}.csv`);
  };

  const addExternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const amount = parseFloat(extForm.amount);
    if (!extForm.name.trim() || isNaN(amount) || amount <= 0) {
      toast('Enter a name and a valid amount.', 'warning'); return;
    }
    addExternalFundraiserPayment({
      id: `ext-${Date.now()}`,
      eventId: active.id,
      name: extForm.name.trim(),
      phone: extForm.phone.trim() || undefined,
      amountPaid: amount,
      paidDate: new Date().toISOString(),
    });
    setExtForm({ name: '', phone: '', amount: '' });
    toast(`K${amount.toLocaleString()} recorded from ${extForm.name.trim()}.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fundraisers</h1>
          <p className="text-gray-600">
            Participation fees, collections and guest contributions
            {totalRaisedAllEvents > 0 && <> &bull; <strong className="text-amber-700">K{totalRaisedAllEvents.toLocaleString()} raised all-time</strong></>}
          </p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg`}>
          <Plus className="h-5 w-5" /><span>New Fundraiser</span>
        </button>
      </div>

      {fundraisers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No fundraisers yet.</p>
          <p className="text-sm mt-1">Create one — like Sports Day or Aerobics Day — and start collecting.</p>
        </div>
      ) : (
        <>
          {/* Event picker chips */}
          <div className="flex flex-wrap gap-2">
            {fundraisers.map(f => {
              const isPast = new Date(f.date) < new Date();
              const isActive = active?.id === f.id;
              return (
                <button key={f.id} onClick={() => setActiveEventId(f.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isActive ? 'bg-amber-100 border-amber-400 text-amber-900' :
                    'bg-white border-gray-200 text-gray-600 hover:border-amber-300'
                  } ${isPast && !isActive ? 'opacity-60' : ''}`}>
                  <Heart className="h-3.5 w-3.5" />
                  {f.title}
                  <span className="text-xs opacity-70">{new Date(f.date).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}</span>
                </button>
              );
            })}
          </div>

          {active && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-amber-900">{active.title}</h2>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {new Date(active.date).toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {active.participationFee !== undefined && <> &bull; K{active.participationFee}/person</>}
                    {active.collectionStartDate && active.collectionEndDate && (
                      <> &bull; Collection {new Date(active.collectionStartDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })} – {new Date(active.collectionEndDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}</>
                    )}
                  </p>
                  {active.description && <p className="text-xs text-gray-500 mt-1">{active.description}</p>}
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={handleExport} title="Export CSV"
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-300 hover:bg-amber-100 rounded-lg px-3 py-1.5">
                    <Download className="h-3.5 w-3.5" />Export
                  </button>
                  <button onClick={() => { setEditing(active); setModalOpen(true); }}
                    className="p-2 text-blue-600 hover:bg-white rounded-lg"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => {
                    if (window.confirm(`Delete "${active.title}" and all its collection records?`)) {
                      deleteEvent(active.id);
                      externalPaid.forEach(p => deleteExternalFundraiserPayment(p.id));
                      setActiveEventId(null);
                      toast('Fundraiser deleted.', 'info');
                    }
                  }} className="p-2 text-red-600 hover:bg-white rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100">
                {[
                  { label: 'Students Paid', value: `${paidIds.size} / ${active.expectedParticipants ?? activeStudents.length}`, cls: 'bg-green-50 text-green-700' },
                  { label: 'From Students', value: `K${studentTotal.toLocaleString()}`, cls: 'bg-green-50 text-green-700' },
                  { label: 'From Guests', value: `K${externalTotal.toLocaleString()}`, cls: 'bg-blue-50 text-blue-700' },
                  { label: target > 0 ? `Total (${pct}% of K${target.toLocaleString()})` : 'Total Raised', value: `K${grandTotal.toLocaleString()}`, cls: 'bg-amber-50 text-amber-800' },
                ].map(s => (
                  <div key={s.label} className={`${s.cls.split(' ')[0]} rounded-lg p-3 text-center`}>
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-lg font-bold ${s.cls.split(' ')[1]}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {target > 0 && (
                <div className="px-6 pt-3">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-700">Students — tick when paid</p>
                  </div>
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {activeStudents.map(student => {
                      const rec = studentPaid.find(p => p.studentId === student.id);
                      const hasPaid = !!rec;
                      return (
                        <button key={student.id}
                          onClick={() => {
                            if (!active.participationFee) { toast('Set a participation fee first (edit the fundraiser).', 'warning'); return; }
                            toggleFundraiserParticipant(active.id, student.id, active.participationFee);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                            hasPaid ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-50 border-gray-200 hover:bg-amber-50'
                          }`}>
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${hasPaid ? 'bg-green-500' : 'border-2 border-gray-300 bg-white'}`}>
                              {hasPaid && <Check className="h-3 w-3 text-white" />}
                            </span>
                            <span className="text-sm text-gray-900 truncate">{student.name}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2 text-xs text-gray-500">
                            {student.grade}
                            {hasPaid && rec && <span className="ml-2 text-green-700 font-semibold">K{rec.amountPaid}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* External / guests */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-700">Guests &amp; others not on the system</p>
                  </div>

                  <form onSubmit={addExternal} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input value={extForm.name} onChange={e => setExtForm({ ...extForm, name: e.target.value })}
                        placeholder="Name *" className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                      <input value={extForm.phone} onChange={e => setExtForm({ ...extForm, phone: e.target.value })}
                        placeholder="Phone (optional)" className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                    </div>
                    <div className="flex gap-2">
                      <input value={extForm.amount} onChange={e => setExtForm({ ...extForm, amount: e.target.value })}
                        type="number" min="0" step="0.01"
                        placeholder={`Amount (K)${active.participationFee ? ` — fee is K${active.participationFee}` : ''}`}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                      <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                        Record
                      </button>
                    </div>
                  </form>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {externalPaid.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No guest contributions yet.</p>
                    ) : externalPaid.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.phone && <><Phone className="h-3 w-3 inline mr-0.5" />{p.phone} &bull; </>}
                            {new Date(p.paidDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-sm font-bold text-blue-700">K{p.amountPaid.toLocaleString()}</span>
                          <button onClick={() => { deleteExternalFundraiserPayment(p.id); toast('Entry removed.', 'info'); }}
                            className="p-1 text-gray-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <FundraiserModal
          event={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={ev => {
            if (editing) { updateEvent(editing.id, ev); toast('Fundraiser updated.', 'success'); }
            else { addEvent(ev); setActiveEventId(ev.id); toast('Fundraiser created — it now appears on the calendar too.', 'success'); }
            setModalOpen(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}
