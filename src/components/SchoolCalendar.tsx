import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react';
import { useAppContext, SchoolEvent } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Academic: { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  Sports:   { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  Cultural: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  Meeting:  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  Holiday:  { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  Other:    { bg: 'bg-gray-100',   text: 'text-gray-800',   dot: 'bg-gray-500' },
};

const EVENT_TYPES = ['Academic', 'Sports', 'Cultural', 'Meeting', 'Holiday', 'Other'] as const;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

interface EventFormData {
  title: string;
  description: string;
  date: string;
  endDate: string;
  type: typeof EVENT_TYPES[number];
  targetAudience: 'All' | 'Students' | 'Teachers' | 'Parents';
}

const EMPTY_FORM: EventFormData = {
  title: '', description: '', date: '', endDate: '',
  type: 'Academic', targetAudience: 'All'
};

export function SchoolCalendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [filterType, setFilterType] = useState<string>('All');

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function dateStr(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const eventsOnDay = useMemo(() => {
    const map: Record<string, SchoolEvent[]> = {};
    events.forEach(e => {
      const d = e.date.split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [events]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const openNewEvent = (date?: string) => {
    setEditingEvent(null);
    setForm({ ...EMPTY_FORM, date: date || todayStr });
    setShowForm(true);
  };

  const openEdit = (event: SchoolEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.split('T')[0],
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      type: event.type as typeof EVENT_TYPES[number],
      targetAudience: event.targetAudience
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.date) return;
    const payload = {
      title: form.title,
      description: form.description,
      date: new Date(form.date + 'T00:00:00').toISOString(),
      endDate: form.endDate ? new Date(form.endDate + 'T00:00:00').toISOString() : undefined,
      type: form.type,
      targetAudience: form.targetAudience
    };
    if (editingEvent) {
      updateEvent(editingEvent.id, payload);
      toast('Event updated.', 'success');
    } else {
      addEvent({ id: `event-${Date.now()}`, ...payload });
      toast('Event added to calendar.', 'success');
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingEvent(null);
  };

  const selectedDayEvents = selectedDay ? (eventsOnDay[selectedDay] || []) : [];

  const upcomingEvents = useMemo(() => {
    const filtered = filterType === 'All' ? events : events.filter(e => e.type === filterType);
    return filtered
      .filter(e => e.date.split('T')[0] >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [events, filterType, todayStr]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Calendar</h1>
          <p className="text-gray-600">View and manage all school events and dates</p>
        </div>
        <button onClick={() => openNewEvent()}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg transition-colors`}>
          <Plus className="h-4 w-4" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Month navigation */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{MONTHS[viewMonth]} {viewYear}</p>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(d => (
              <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-100 bg-gray-50/50" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const ds = dateStr(day);
              const dayEvents = eventsOnDay[ds] || [];
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;
              const isWeekend = new Date(viewYear, viewMonth, day).getDay() === 0 || new Date(viewYear, viewMonth, day).getDay() === 6;

              return (
                <div key={day}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50' : isWeekend ? 'bg-gray-50/50' : 'hover:bg-gray-50'
                  }`}>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => {
                      const cfg = EVENT_COLORS[e.type] || EVENT_COLORS.Other;
                      return (
                        <div key={e.id} className={`text-xs px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.text}`}>
                          {e.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-100 flex flex-wrap gap-3">
            {EVENT_TYPES.map(type => {
              const cfg = EVENT_COLORS[type];
              return (
                <div key={type} className="flex items-center space-x-1.5 text-xs text-gray-600">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span>{type}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Selected day events */}
          {selectedDay && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs text-gray-500">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => openNewEvent(selectedDay)}
                  className={`flex items-center space-x-1 text-xs ${tc.btn} text-white px-2.5 py-1.5 rounded-lg`}>
                  <Plus className="h-3 w-3" /><span>Add</span>
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <div className="p-4 text-sm text-gray-400 text-center">No events on this day.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {selectedDayEvents.map(e => {
                    const cfg = EVENT_COLORS[e.type] || EVENT_COLORS.Other;
                    return (
                      <div key={e.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{e.title}</p>
                              {e.description && <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>}
                              <div className="flex gap-2 mt-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{e.type}</span>
                                <span className="text-xs text-gray-400">{e.targetAudience}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => openEdit(e)} className="text-xs text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => { deleteEvent(e.id); toast('Event deleted.', 'info'); }} className="text-xs text-red-500 hover:underline">Del</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="font-semibold text-gray-900">Upcoming Events</p>
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500">
                <option value="All">All Types</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="p-6 text-sm text-gray-400 text-center">No upcoming events.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingEvents.map(e => {
                  const cfg = EVENT_COLORS[e.type] || EVENT_COLORS.Other;
                  const eventDate = new Date(e.date);
                  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={e.id} className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const d = e.date.split('T')[0];
                        const [y, m] = d.split('-').map(Number);
                        setViewYear(y); setViewMonth(m - 1); setSelectedDay(d);
                      }}>
                      <div className="flex items-start space-x-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                          <p className="text-xs text-gray-500">
                            {eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {diffDays === 0 ? ' — Today' : diffDays === 1 ? ' — Tomorrow' : diffDays <= 7 ? ` — in ${diffDays} days` : ''}
                          </p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{e.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingEvent(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Sports Day"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof EVENT_TYPES[number] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value as EventFormData['targetAudience'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {['All', 'Students', 'Teachers', 'Parents'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Event details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingEvent(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={!form.title || !form.date}
                  className={`flex-1 ${tc.btn} text-white py-2 px-4 rounded-lg disabled:opacity-40`}>
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
