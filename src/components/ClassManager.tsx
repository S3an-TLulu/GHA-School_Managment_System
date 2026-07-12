import { useState } from 'react';
import { GraduationCap, Users, UserCheck, ArrowRight, Check, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

export function ClassManager() {
  const { students, teachers, updateStudent, updateTeacher } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [selectedClass, setSelectedClass] = useState(GRADES[0]);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const classStudents = activeStudents.filter(s => s.grade === selectedClass);
  const otherStudents = activeStudents.filter(s => s.grade !== selectedClass &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase())));

  const activeTeachers = teachers.filter(t => t.status === 'active');
  const classTeacher = activeTeachers.find(t => t.assignedClass === selectedClass);

  const togglePick = (id: string) =>
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const moveSelected = () => {
    if (picked.size === 0) return;
    picked.forEach(id => updateStudent(id, { grade: selectedClass }));
    toast(`${picked.size} student${picked.size !== 1 ? 's' : ''} moved to ${selectedClass}.`, 'success');
    setPicked(new Set());
  };

  const assignTeacher = (teacherId: string) => {
    // unassign whoever currently has this class, then assign the new teacher
    activeTeachers.filter(t => t.assignedClass === selectedClass && t.id !== teacherId)
      .forEach(t => updateTeacher(t.id, { assignedClass: undefined }));
    if (teacherId) {
      updateTeacher(teacherId, { assignedClass: selectedClass });
      const t = activeTeachers.find(x => x.id === teacherId);
      toast(`${t?.name ?? 'Teacher'} assigned to ${selectedClass}.`, 'success');
    } else {
      toast(`${selectedClass} now has no assigned teacher.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Manager</h1>
        <p className="text-gray-600">Assign children and teachers to classes</p>
      </div>

      {/* Class picker */}
      <div className="flex flex-wrap gap-2">
        {GRADES.map(g => {
          const count = activeStudents.filter(s => s.grade === g).length;
          const isActive = selectedClass === g;
          return (
            <button key={g} onClick={() => { setSelectedClass(g); setPicked(new Set()); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isActive ? `${tc.activeNav} border` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {g} <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Teacher assignment */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${tc.light} rounded-lg flex items-center justify-center`}>
            <UserCheck className={`h-5 w-5 ${tc.text}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Class Teacher — {selectedClass}</p>
            <p className="text-xs text-gray-500">
              {classTeacher ? `${classTeacher.name} · ${classTeacher.subject}` : 'No teacher assigned yet'}
            </p>
          </div>
        </div>
        <select value={classTeacher?.id || ''} onChange={e => assignTeacher(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">— No teacher —</option>
          {activeTeachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}{t.assignedClass && t.assignedClass !== selectedClass ? ` (currently ${t.assignedClass})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students in class */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center space-x-2">
            <GraduationCap className={`h-5 w-5 ${tc.text}`} />
            <h2 className="font-semibold text-gray-900">In {selectedClass}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.badge}`}>{classStudents.length}</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
            {classStudents.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No students in this class yet — add some from the right.</p>
            ) : classStudents.map(s => (
              <div key={s.id} className="px-5 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.admissionNumber || '—'} &bull; {s.guardianName}</p>
                </div>
                <select value="" onChange={e => {
                    if (!e.target.value) return;
                    updateStudent(s.id, { grade: e.target.value });
                    toast(`${s.name} moved to ${e.target.value}.`, 'success');
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Move to…</option>
                  {GRADES.filter(g => g !== selectedClass).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Add students from other classes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Add students to {selectedClass}</h2>
              </div>
              <button onClick={moveSelected} disabled={picked.size === 0}
                className={`flex items-center space-x-1.5 ${tc.btn} text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed`}>
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Move {picked.size || ''} selected</span>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[24rem] overflow-y-auto">
            {otherStudents.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No students found.</p>
            ) : otherStudents.map(s => {
              const isPicked = picked.has(s.id);
              return (
                <button key={s.id} onClick={() => togglePick(s.id)}
                  className={`w-full px-5 py-2.5 flex items-center justify-between text-left transition-colors ${
                    isPicked ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}>
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      isPicked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {isPicked && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">currently {s.grade}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
