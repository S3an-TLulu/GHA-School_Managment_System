import { useState, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Users, Download, Upload } from 'lucide-react';
import { useAppContext, Student } from '../context/AppContext';
import { StudentModal } from './StudentModal';
import { StudentProfile } from './StudentProfile';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { exportCSV } from '../lib/exports';
import { parseCSVObjects } from '../lib/exports';

const STATUS_BADGE: Record<string, string> = {
  active:      'bg-green-100 text-green-700',
  inactive:    'bg-gray-100 text-gray-600',
  transferred: 'bg-amber-100 text-amber-700',
};

export function Students() {
  const { students, addStudent, updateStudent, deleteStudent, addStudentsBulk } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (students.length === 0) { toast('No students to export.', 'warning'); return; }
    exportCSV('GHA_Students',
      ['Name', 'Grade', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Admission Number', 'Gender', 'Date of Birth', 'Enrollment Date', 'Status', 'Address'],
      students.map(s => [
        s.name, s.grade, s.guardianName, s.guardianPhone, s.guardianEmail || '',
        s.admissionNumber || '', s.gender || '', s.dateOfBirth || '',
        s.enrollmentDate ? s.enrollmentDate.split('T')[0] : '', s.status || 'active', s.address || '',
      ]));
    toast(`Exported ${students.length} students.`, 'success');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSVObjects(String(reader.result));
      // Required: a name. Grade defaults to "Unassigned" if missing.
      const valid = rows.filter(r => (r.name || r.studentname || r.fullname || '').trim());
      if (valid.length === 0) { toast('No rows with a Name column were found.', 'error'); return; }
      const gender = (v: string): Student['gender'] => /^m/i.test(v) ? 'Male' : /^f/i.test(v) ? 'Female' : undefined;
      const now = new Date().toISOString();
      const newStudents: Student[] = valid.map((r, i) => ({
        id: `student-${Date.now()}-${i}`,
        name: (r.name || r.studentname || r.fullname).trim(),
        grade: (r.grade || r.class || 'Unassigned').trim(),
        guardianName: (r.guardianname || r.parentname || r.guardian || '').trim(),
        guardianPhone: (r.guardianphone || r.parentphone || r.phone || '').trim(),
        guardianEmail: (r.guardianemail || r.parentemail || r.email || '').trim() || undefined,
        admissionNumber: (r.admissionnumber || r.admissionno || r.admno || '').trim() || undefined,
        gender: gender(r.gender || r.sex || ''),
        dateOfBirth: (r.dateofbirth || r.dob || '').trim() || undefined,
        address: (r.address || '').trim() || undefined,
        enrollmentDate: (r.enrollmentdate || r.enrolmentdate || '').trim() || now,
        status: 'active',
      }));
      addStudentsBulk(newStudents);
      toast(`Imported ${newStudents.length} student${newStudents.length !== 1 ? 's' : ''}.`, 'success');
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = (student: Student) => setDeleteConfirm(student);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteStudent(deleteConfirm.id);
    toast(`${deleteConfirm.name} has been removed.`, 'info');
    setDeleteConfirm(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSave = (studentData: Student) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, studentData);
      toast(`${studentData.name}'s record updated.`, 'success');
    } else {
      addStudent(studentData);
      toast(`${studentData.name} enrolled successfully.`, 'success');
    }
    handleModalClose();
  };

  const activeCount   = students.filter(s => !s.status || s.status === 'active').length;
  const inactiveCount = students.filter(s => s.status === 'inactive').length;
  const transferCount = students.filter(s => s.status === 'transferred').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm">Manage student registrations and information</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleImport(f); }} />
          <button onClick={() => fileInput.current?.click()}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">
            <Upload className="h-4 w-4" /><span className="hidden sm:inline">Import CSV</span>
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">
            <Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1`}
          >
            <Plus className="h-4 w-4" />
            <span>Enrol Student</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active',      value: activeCount,   color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Inactive',    value: inactiveCount, color: 'bg-gray-50 text-gray-600 border-gray-100' },
          { label: 'Transferred', value: transferCount, color: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, grade or admission number…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': 'var(--gha-primary, #3b82f6)' } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Grade', 'Status', 'Guardian Contact', 'Enrolled', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 ${tc.light} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm font-bold ${tc.text}`}>{student.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.admissionNumber || student.id.slice(0, 10)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{student.grade}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[student.status || 'active']}`}>
                      {student.status || 'active'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-800">{student.guardianName}</p>
                    <p className="text-xs text-gray-400">{student.guardianPhone}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(student.enrollmentDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-1">
                      <button onClick={() => setProfileStudent(student)} title="View Profile"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEdit(student)} title="Edit"
                        className={`p-1.5 rounded-lg ${tc.text} hover:${tc.light} transition-colors`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(student)} title="Delete"
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      {searchTerm ? `No students matching "${searchTerm}"` : 'No students enrolled yet.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onSave={handleSave}
          onClose={handleModalClose}
        />
      )}

      {profileStudent && (
        <StudentProfile
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Delete Student?</p>
                <p className="text-sm text-gray-500">This will remove all records for this student.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 mb-4">
              <strong>{deleteConfirm.name}</strong> · {deleteConfirm.grade}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
