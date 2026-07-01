import React, { useState } from 'react';
import { Plus, Calendar, Pencil, Trash2, X } from 'lucide-react';
import { useAppContext, SchoolEvent } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const EVENT_TYPES = ['Academic', 'Sports', 'Cultural', 'Meeting', 'Holiday', 'Other'] as const;
const AUDIENCES = ['All', 'Students', 'Teachers', 'Parents'] as const;

const typeColors: Record<string, string> = {
  Academic: 'bg-blue-100 text-blue-800',
  Sports: 'bg-green-100 text-green-800',
  Cultural: 'bg-purple-100 text-purple-800',
  Meeting: 'bg-yellow-100 text-yellow-800',
  Holiday: 'bg-red-100 text-red-800',
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
    targetAudience: event?.targetAudience || 'All'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: event?.id || `event-${Date.now()}`, ...form });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
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
  const { events, addEvent, updateEvent, deleteEvent } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [filterType, setFilterType] = useState('all');

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

  const renderEventCard = (event: SchoolEvent, isPast = false) => (
    <div key={event.id} className={`bg-white rounded-lg border shadow-sm p-4 ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-blue-600">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </span>
            <span className="text-lg font-bold text-blue-800 leading-none">
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
          </div>
        </div>
        <div className="flex space-x-1 ml-2">
          <button onClick={() => handleEdit(event)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => handleDelete(event.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
