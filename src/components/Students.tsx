import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { useAppContext, Student } from '../context/AppContext';
import { StudentModal } from './StudentModal';
import { StudentProfile } from './StudentProfile';

export function Students() {
  const { students, addStudent, updateStudent, deleteStudent } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(studentId);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage student registrations and information</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Student</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, grade or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardian Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        {student.admissionNumber ? (
                          <div className="text-xs text-gray-500">{student.admissionNumber}</div>
                        ) : (
                          <div className="text-xs text-gray-400">ID: {student.id.slice(0, 8)}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.guardianName}</div>
                    <div className="text-sm text-gray-500">{student.guardianPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setProfileStudent(student)}
                        className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded"
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onSave={(studentData) => {
            if (editingStudent) {
              updateStudent(editingStudent.id, studentData);
            } else {
              addStudent(studentData);
            }
            handleModalClose();
          }}
          onClose={handleModalClose}
        />
      )}

      {profileStudent && (
        <StudentProfile
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
        />
      )}
    </div>
  );
}
