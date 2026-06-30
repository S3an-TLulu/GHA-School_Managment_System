import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCheck, X, GraduationCap } from 'lucide-react';
import { useAppContext, Teacher } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const ROLES = ['Teacher', 'Deputy Head', 'Head Teacher', 'Support Staff'] as const;
const CLASSES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

function TeacherModal({ teacher, onSave, onClose }: {
  teacher: Teacher | null;
  onSave: (data: Teacher) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Teacher, 'id'>>({
    name: teacher?.name || '',
    subject: teacher?.subject || '',
    phone: teacher?.phone || '',
    email: teacher?.email || '',
    qualification: teacher?.qualification || '',
    joinDate: teacher?.joinDate || new Date().toISOString().split('T')[0],
    role: teacher?.role || 'Teacher',
    assignedClass: teacher?.assignedClass || '',
    status: teacher?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: teacher?.id || `teacher-${Date.now()}`,
      ...form
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{teacher ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mrs. Tembo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Teacher['role'] })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Class</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.assignedClass} onChange={e => setForm({ ...form, assignedClass: e.target.value })}>
                <option value="">None / Multiple</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject(s) / Duties *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. English & Mathematics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. B.Ed Primary Education" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="097XXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="teacher@gha.edu.zm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
              <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.joinDate.split('T')[0]} onChange={e => setForm({ ...form, joinDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Teacher['status'] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {teacher ? 'Update' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ className, currentTeacherId, teachers, onAssign, onClose }: {
  className: string;
  currentTeacherId: string;
  teachers: Teacher[];
  onAssign: (teacherId: string) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(currentTeacherId);
  const activeTeachers = teachers.filter(t => t.status === 'active');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Assign Teacher to {className}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Select Teacher</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {activeTeachers.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
            ))}
          </select>
          <div className="flex space-x-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { onAssign(selectedId); onClose(); }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Assign</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const roleColors: Record<string, string> = {
  'Head Teacher': 'bg-purple-100 text-purple-800',
  'Deputy Head': 'bg-blue-100 text-blue-800',
  'Teacher': 'bg-green-100 text-green-800',
  'Support Staff': 'bg-gray-100 text-gray-800'
};

export function Teachers() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [activeTab, setActiveTab] = useState<'staff' | 'assignments'>('staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningClass, setAssigningClass] = useState<string | null>(null);

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const t = teachers.find(t => t.id === id);
    deleteTeacher(id);
    toast(`${t?.name || 'Staff member'} removed.`, 'info');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const activeCount = teachers.filter(t => t.status === 'active').length;

  const getAssignedTeacher = (className: string): Teacher | undefined =>
    teachers.find(t => t.assignedClass === className && t.status === 'active');

  const handleAssign = (className: string, teacherId: string) => {
    // Unassign any teacher that currently has this class
    teachers.forEach(t => {
      if (t.assignedClass === className) {
        updateTeacher(t.id, { assignedClass: '' });
      }
    });
    // Assign selected teacher
    if (teacherId) {
      updateTeacher(teacherId, { assignedClass: className });
    }
  };

  const assigningTeacherId = assigningClass
    ? (getAssignedTeacher(assigningClass)?.id || '')
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & Teachers</h1>
          <p className="text-gray-600">{activeCount} active staff members</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}>
          <Plus className="h-4 w-4" />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['Head Teacher', 'Deputy Head', 'Teacher', 'Support Staff'] as const).map(role => {
          const count = teachers.filter(t => t.role === role && t.status === 'active').length;
          return (
            <div key={role} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{role}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'staff' ? `border-current ${tc.text}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Staff List
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assignments' ? `border-current ${tc.text}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Class Assignments
            </button>
          </div>
        </div>

        {activeTab === 'staff' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Search staff..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Staff Member', 'Role', 'Subject / Duties', 'Class', 'Contact', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${tc.light} rounded-full flex items-center justify-center`}>
                            <UserCheck className={`h-5 w-5 ${tc.text}`} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                            <p className="text-xs text-gray-500">{teacher.qualification}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[teacher.role] || 'bg-gray-100 text-gray-800'}`}>
                          {teacher.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{teacher.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.assignedClass || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{teacher.phone}</p>
                        {teacher.email && <p className="text-xs text-gray-500">{teacher.email}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${teacher.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {teacher.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(teacher)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(teacher.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No staff members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'assignments' && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Click a class card to assign or change the teacher.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CLASSES.map(className => {
                const assigned = getAssignedTeacher(className);
                return (
                  <button
                    key={className}
                    onClick={() => setAssigningClass(className)}
                    className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className={`w-10 h-10 ${tc.light} rounded-lg flex items-center justify-center mb-3 transition-colors`}>
                      <GraduationCap className={`h-5 w-5 ${tc.text}`} />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{className}</p>
                    {assigned ? (
                      <p className="text-xs text-green-700 mt-1 font-medium">{assigned.name}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Unassigned</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          onSave={data => {
            if (editingTeacher) {
              updateTeacher(editingTeacher.id, data);
              toast(`${data.name}'s record updated.`, 'success');
            } else {
              addTeacher(data);
              toast(`${data.name} added to staff.`, 'success');
            }
            handleModalClose();
          }}
          onClose={handleModalClose}
        />
      )}

      {assigningClass && (
        <AssignModal
          className={assigningClass}
          currentTeacherId={assigningTeacherId}
          teachers={teachers}
          onAssign={(teacherId) => handleAssign(assigningClass, teacherId)}
          onClose={() => setAssigningClass(null)}
        />
      )}
    </div>
  );
}
