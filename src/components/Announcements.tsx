import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAppContext, Announcement } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const PRIORITIES = ['normal', 'important', 'urgent'] as const;
const AUDIENCES = ['All', 'Students', 'Teachers', 'Parents'] as const;

function AnnouncementModal({ announcement, onSave, onClose }: {
  announcement: Announcement | null;
  onSave: (data: Announcement) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: announcement?.title || '',
    message: announcement?.message || '',
    priority: announcement?.priority || ('normal' as Announcement['priority']),
    targetAudience: announcement?.targetAudience || ('All' as Announcement['targetAudience']),
    date: announcement?.date ? announcement.date.split('T')[0] : new Date().toISOString().split('T')[0],
    createdBy: announcement?.createdBy || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: announcement?.id || `ann-${Date.now()}`,
      ...form,
      date: new Date(form.date).toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{announcement ? 'Edit Announcement' : 'New Announcement'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Full announcement message..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
              <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value as Announcement['targetAudience'] })}>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posted By *</label>
              <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.createdBy} onChange={e => setForm({ ...form, createdBy: e.target.value })}
                placeholder="e.g. Mrs. Tembo" />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg text-sm font-medium">{announcement ? 'Update' : 'Post Announcement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const priorityConfig = {
  normal: { border: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', icon: Info, iconColor: 'text-blue-500' },
  important: { border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, iconColor: 'text-yellow-500' },
  urgent: { border: 'border-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800', icon: AlertTriangle, iconColor: 'text-red-500' }
};

export function Announcements() {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');

  const filtered = announcements
    .filter(a => filterPriority === 'all' || a.priority === filterPriority)
    .filter(a => filterAudience === 'all' || a.targetAudience === filterAudience)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const importantCount = announcements.filter(a => a.priority === 'important').length;
  const urgentCount = announcements.filter(a => a.priority === 'urgent').length;

  const handleEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    toast('Announcement deleted.', 'info');
  };

  const handleSave = (data: Announcement) => {
    if (editingAnn) {
      updateAnnouncement(editingAnn.id, data);
      toast('Announcement updated.', 'success');
    } else {
      addAnnouncement(data);
      toast('Announcement posted.', 'success');
    }
    setIsModalOpen(false);
    setEditingAnn(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">School notice board and communications</p>
        </div>
        <button onClick={() => { setEditingAnn(null); setIsModalOpen(true); }}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}>
          <Plus className="h-5 w-5" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-2.5 rounded-lg"><Bell className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-50 p-2.5 rounded-lg"><AlertCircle className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Important</p>
              <p className="text-2xl font-bold text-gray-900">{importantCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-red-50 p-2.5 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{urgentCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="all">All Priorities</option>
          <option value="normal">Normal</option>
          <option value="important">Important</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={filterAudience} onChange={e => setFilterAudience(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="all">All Audiences</option>
          <option value="All">All</option>
          <option value="Students">Students</option>
          <option value="Teachers">Teachers</option>
          <option value="Parents">Parents</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No announcements found</p>
          <p className="text-gray-400 text-sm mt-1">Post a new announcement to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ann => {
            const config = priorityConfig[ann.priority];
            const Icon = config.icon;
            return (
              <div key={ann.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${config.border} overflow-hidden`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge} capitalize`}>
                            {ann.priority}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                            {ann.targetAudience}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">{ann.message}</p>
                        <p className="text-xs text-gray-400 mt-3">
                          Posted by {ann.createdBy} &bull; {new Date(ann.date).toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-4 flex-shrink-0">
                      <button onClick={() => handleEdit(ann)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(ann.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <AnnouncementModal
          announcement={editingAnn}
          onSave={handleSave}
          onClose={() => { setIsModalOpen(false); setEditingAnn(null); }}
        />
      )}
    </div>
  );
}
