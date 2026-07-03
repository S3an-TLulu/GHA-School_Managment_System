import React, { useState } from 'react';
import { Plus, Calendar, Pencil, Trash2, X, DollarSign, Users, ChevronDown, ChevronUp, Check, Download } from 'lucide-react';
import { useAppContext, SchoolEvent } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

const EVENT_TYPES = ['Academic', 'Sports', 'Cultural', 'Meeting', 'Holiday', 'Fundraiser', 'Other'] as const;
const AUDIENCES = ['All', 'Students', 'Teachers', 'Parents'] as const;

const FUNDRAISER_SUBCATEGORIES = [
  'Sports Day',
  'Aerobics Day',
  'Graduation Participation',
  'School Concert',
  'Charity Walk',
  'Bake Sale',
  'Fun Run',
  'Talent Show',
  'Quiz Night',
  'Other Fundraiser',
];

const typeColors: Record<string, string> = {
  Academic: 'bg-blue-100 text-blue-800',
  Sports: 'bg-green-100 text-green-800',
  Cultural: 'bg-purple-100 text-purple-800',
  Meeting: 'bg-yellow-100 text-yellow-800',
  Holiday: 'bg-red-100 text-red-800',
  Fundraiser: 'bg-amber-100 text-amber-800',
  Other: 'bg-gray-100 text-gray-800'
};

function EventModal({ event, onSave, onClose }: {
  event: SchoolEvent | null;
  onSave: (data: SchoolEvent) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<SchoolEvent, 'id'>>({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date ? event.date.split('T')[0] : '',
    endDate: event?.endDate ? event.endDate.split('T')[0] : '',
    type: event?.type || 'Academic',
    targetAudience: event?.targetAudience || 'All',
    participationFee: event?.participationFee,
    expectedParticipants: event?.expectedParticipants,
    actualRevenue: event?.actualRevenue,
    collectionStartDate: event?.collectionStartDate ? event.collectionStartDate.split('T')[0] : '',
    collectionEndDate: event?.collectionEndDate ? event.collectionEndDate.split('T')[0] : '',
  });

  const isFundraiser = form.type === 'Fundraiser';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved: SchoolEvent = { id: event?.id || `event-${Date.now()}`, ...form };
    if (!isFundraiser) {
      delete saved.participationFee;
      delete saved.expectedParticipants;
      delete saved.actualRevenue;
    }
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{event ? 'Edit Event' : 'Add Event'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sports Day" />
          </div>

          {isFundraiser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fundraiser Subcategory</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={FUNDRAISER_SUBCATEGORIES.includes(form.title) ? form.title : ''}
                onChange={e => { if (e.target.value) setForm({ ...form, title: e.target.value }); }}>
                <option value="">— pick a template or type your own above —</option>
                {FUNDRAISER_SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value as SchoolEvent['type'] })}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value as SchoolEvent['targetAudience'] })}>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          {isFundraiser && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Fundraiser Tracking</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fee Collection Opens</label>
                  <input type="date"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    value={form.collectionStartDate || ''} onChange={e => setForm({ ...form, collectionStartDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fee Collection Closes</label>
                  <input type="date"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    value={form.collectionEndDate || ''} onChange={e => setForm({ ...form, collectionEndDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fee per Person (K)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    value={form.participationFee ?? ''} onChange={e => setForm({ ...form, participationFee: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expected Participants</label>
                  <input type="number" min="0" step="1" placeholder="0"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    value={form.expectedParticipants ?? ''} onChange={e => setForm({ ...form, expectedParticipants: e.target.value ? parseInt(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Actual Revenue (K)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    value={form.actualRevenue ?? ''} onChange={e => setForm({ ...form, actualRevenue: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>
              </div>
              {form.participationFee && form.expectedParticipants && (
                <p className="text-xs text-amber-700">
                  Target revenue: <strong>K{(form.participationFee * form.expectedParticipants).toLocaleString()}</strong>
                  {form.actualRevenue !== undefined && form.actualRevenue > 0 && (
                    <> &bull; Collected: <strong>K{form.actualRevenue.toLocaleString()}</strong>
                      {' '}({Math.round((form.actualRevenue / (form.participationFee * form.expectedParticipants)) * 100)}% of target)
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Event details..." />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg transition-colors">
              {event ? 'Update' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Events() {
  const { events, addEvent, updateEvent, deleteEvent, students, fundraiserParticipants, toggleFundraiserParticipant } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());

  const activeStudents = students.filter(s => !s.status || s.status === 'active');

  const toggleParticipantPanel = (eventId: string) =>
    setExpandedParticipants(prev => {
      const next = new Set(prev);
      next.has(eventId) ? next.delete(eventId) : next.add(eventId);
      return next;
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcoming = sortedEvents.filter(e => new Date(e.date) >= today);
  const past = sortedEvents.filter(e => new Date(e.date) < today);

  const filtered = (filterType === 'all' ? sortedEvents : sortedEvents.filter(e => e.type === filterType));

  const handleEdit = (event: SchoolEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    toast('Event deleted.', 'info');
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const renderEventCard = (event: SchoolEvent, isPast = false) => {
    const isFundraiser = event.type === 'Fundraiser';
    const target = isFundraiser && event.participationFee && event.expectedParticipants
      ? event.participationFee * event.expectedParticipants : null;
    const pct = target && event.actualRevenue ? Math.round((event.actualRevenue / target) * 100) : null;

    return (
      <div key={event.id} className={`bg-white rounded-lg border shadow-sm p-4 ${isPast ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`flex-shrink-0 w-12 h-12 ${isFundraiser ? 'bg-amber-50' : 'bg-blue-50'} rounded-lg flex flex-col items-center justify-center`}>
              <span className={`text-xs font-bold ${isFundraiser ? 'text-amber-600' : 'text-blue-600'}`}>
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </span>
              <span className={`text-lg font-bold ${isFundraiser ? 'text-amber-800' : 'text-blue-800'} leading-none`}>
                {new Date(event.date).getDate()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[event.type]}`}>{event.type}</span>
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{event.targetAudience}</span>
              </div>
              {event.description && <p className="text-xs text-gray-500 mt-1">{event.description}</p>}
              {event.endDate && (
                <p className="text-xs text-gray-400 mt-1">
                  Until {new Date(event.endDate).toLocaleDateString()}
                </p>
              )}
              {isFundraiser && (event.collectionStartDate || event.collectionEndDate) && (
                <p className="text-xs text-amber-700 mt-1">
                  Collection: {event.collectionStartDate ? new Date(event.collectionStartDate).toLocaleDateString() : '…'}
                  {' → '}{event.collectionEndDate ? new Date(event.collectionEndDate).toLocaleDateString() : '…'}
                </p>
              )}
              {isFundraiser && (event.participationFee || event.actualRevenue !== undefined) && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {event.participationFee !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      <DollarSign className="h-3 w-3" />
                      K{event.participationFee}/person
                    </span>
                  )}
                  {event.expectedParticipants !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                      <Users className="h-3 w-3" />
                      {event.expectedParticipants} expected
                    </span>
                  )}
                  {target !== null && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      Target: K{target.toLocaleString()}
                    </span>
                  )}
                  {event.actualRevenue !== undefined && event.actualRevenue > 0 && (
                    <span className={`inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 border font-semibold ${
                      pct !== null && pct >= 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      Collected: K{event.actualRevenue.toLocaleString()}{pct !== null ? ` (${pct}%)` : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-1 ml-2 flex-shrink-0">
            {isFundraiser && event.participationFee && (
              <button onClick={() => toggleParticipantPanel(event.id)}
                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="View participants">
                <Users className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => handleEdit(event)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => handleDelete(event.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Fundraiser participants panel */}
        {isFundraiser && event.participationFee && expandedParticipants.has(event.id) && (() => {
          const paid = fundraiserParticipants.filter(p => p.eventId === event.id);
          const paidIds = new Set(paid.map(p => p.studentId));
          const collected = paid.reduce((s, p) => s + p.amountPaid, 0);
          const target = event.participationFee! * (event.expectedParticipants ?? activeStudents.length);
          const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;

          const exportParticipants = () => {
            const rows = [
              ['Student', 'Grade', 'Guardian', 'Phone', 'Status', 'Amount', 'Date Paid'],
              ...activeStudents.map(s => {
                const rec = paid.find(p => p.studentId === s.id);
                return [s.name, s.grade, s.guardianName, s.guardianPhone,
                  rec ? 'Paid' : 'Not Paid',
                  rec ? `K${event.participationFee}` : '—',
                  rec ? new Date(rec.paidDate).toLocaleDateString() : '—'];
              })
            ];
            downloadCSV(rows as string[][], `${event.title.replace(/\s+/g,'_')}_participants.csv`);
          };

          return (
            <div className="mt-3 border-t border-amber-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    {paidIds.size} / {event.expectedParticipants ?? activeStudents.length} paid
                    &nbsp;&bull;&nbsp;K{collected.toLocaleString()} collected
                    {target > 0 && <> / K{target.toLocaleString()} target ({pct}%)</>}
                  </p>
                  <div className="mt-1 w-48 bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button onClick={exportParticipants}
                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 border border-amber-200 hover:border-amber-400 rounded px-2 py-1 transition-colors">
                  <Download className="h-3 w-3" />
                  Export
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                {activeStudents.map(student => {
                  const hasPaid = paidIds.has(student.id);
                  const rec = paid.find(p => p.studentId === student.id);
                  return (
                    <button key={student.id}
                      onClick={() => toggleFundraiserParticipant(event.id, student.id, event.participationFee!)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-left transition-all ${
                        hasPaid ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-50 border-gray-200 hover:bg-amber-50'
                      }`}>
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${hasPaid ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {hasPaid && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        <span className="text-xs text-gray-900 truncate">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-400">{student.grade}</span>
                        {hasPaid && rec && (
                          <span className="text-xs text-green-600 font-medium">{new Date(rec.paidDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Events</h1>
          <p className="text-gray-600">{upcoming.length} upcoming events</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg transition-colors`}>
          <Plus className="h-5 w-5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {EVENT_TYPES.map(type => {
          const count = events.filter(e => e.type === type).length;
          return (
            <div key={type} className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => setFilterType(filterType === type ? 'all' : type)}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{type}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${typeColors[type]}`}>{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filterType !== 'all' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{filterType} Events</h2>
            <button onClick={() => setFilterType('all')} className="text-sm text-blue-600 hover:text-blue-800">Show All</button>
          </div>
          <div className="space-y-3">
            {filtered.map(e => renderEventCard(e, new Date(e.date) < today))}
            {filtered.length === 0 && <p className="text-gray-500 text-sm">No {filterType} events.</p>}
          </div>
        </div>
      )}

      {filterType === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">{upcoming.length}</span>
            </div>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center bg-white border border-dashed border-gray-200 rounded-lg">
                  No upcoming events. Add some!
                </p>
              ) : upcoming.map(e => renderEventCard(e))}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Past Events</h2>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">{past.length}</span>
            </div>
            <div className="space-y-3">
              {past.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No past events.</p>
              ) : past.slice(-5).reverse().map(e => renderEventCard(e, true))}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <EventModal
          event={editingEvent}
          onSave={data => {
            if (editingEvent) { updateEvent(editingEvent.id, data); toast('Event updated.', 'success'); }
            else { addEvent(data); toast('Event added.', 'success'); }
            handleClose();
          }}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
