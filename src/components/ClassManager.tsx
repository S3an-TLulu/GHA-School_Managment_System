import { useState } from 'react';
import { GraduationCap, Users, UserCheck, ArrowRight, Check, Search, UserPlus, Plus, Trash2, ArrowUpRight, X, Printer } from 'lucide-react';
import { useAppContext, Student } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { printClassRegister } from '../lib/register';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

interface BulkRow { name: string; gender: 'Male' | 'Female'; guardianName: string; guardianPhone: string; }
const EMPTY_ROW: BulkRow = { name: '', gender: 'Female', guardianName: '', guardianPhone: '' };

export function ClassManager() {
  const { students, teachers, branding, updateStudent, updateTeacher, addStudentsBulk, bulkUpdateStudents } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(GRADES[0]);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);

  const setBulkRow = (i: number, field: keyof BulkRow, value: string) =>
    setBulkRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const saveBulk = () => {
    const valid = bulkRows.filter(r => r.name.trim());
    if (valid.length === 0) { toast('Enter at least one student name.', 'warning'); return; }
    const year = new Date().getFullYear();
    const now = Date.now();
    const newStudents: Student[] = valid.map((r, i) => ({
      id: `student-${now + i}`,
      name: r.name.trim(),
      grade: selectedClass,
      gender: r.gender,
      guardianName: r.guardianName.trim() || '—',
      guardianPhone: r.guardianPhone.trim() || '—',
      enrollmentDate: new Date().toISOString(),
      status: 'active',
      admissionNumber: `GHA-${year}-${String(now + i).slice(-4)}`,
    }));
    addStudentsBulk(newStudents);
    setBulkRows([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
    setBulkOpen(false);
    toast(`${newStudents.length} student${newStudents.length !== 1 ? 's' : ''} enrolled into ${selectedClass}. Guardian details can be completed later in Students.`, 'success');
  };

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

  // Year-end promotion: every class moves up one; the final grade graduates
  // (marked inactive so it drops out of active rolls but history is kept).
  const promotionPlan = GRADES.map((g, i) => ({
    from: g,
    to: i < GRADES.length - 1 ? GRADES[i + 1] : 'Graduated (archived)',
    count: activeStudents.filter(s => s.grade === g).length,
  })).filter(p => p.count > 0);
  const promotableTotal = promotionPlan.reduce((s, p) => s + p.count, 0);

  const applyPromotion = () => {
    const changes: { id: string; patch: Partial<Student> }[] = [];
    activeStudents.forEach(s => {
      const idx = GRADES.indexOf(s.grade);
      if (idx === -1) return;
      if (idx < GRADES.length - 1) changes.push({ id: s.id, patch: { grade: GRADES[idx + 1] } });
      else changes.push({ id: s.id, patch: { status: 'inactive' } }); // graduated
    });
    bulkUpdateStudents(changes);
    setPromoteOpen(false);
    toast(`Promoted ${changes.length} student${changes.length !== 1 ? 's' : ''} to the next class.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Manager</h1>
          <p className="text-gray-600">Assign children and teachers to classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const cls = activeStudents.filter(s => s.grade === selectedClass);
            if (cls.length === 0) { toast('No students in this class to print.', 'warning'); return; }
            printClassRegister(selectedClass, cls, branding,
              new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));
          }}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
            <Printer className="h-4 w-4" /> Print Register
          </button>
          <button onClick={() => setPromoteOpen(true)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
            <ArrowUpRight className="h-4 w-4" /> End of Year Promotion
          </button>
        </div>
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

      {/* Bulk enrol new students */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => setBulkOpen(!bulkOpen)}
          className="w-full px-5 py-4 flex items-center justify-between text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Bulk Enrol New Students into {selectedClass}</p>
              <p className="text-xs text-gray-500">Type names row by row — no need to enrol one by one</p>
            </div>
          </div>
          <span className="text-xs text-gray-400">{bulkOpen ? 'Hide ▲' : 'Open ▼'}</span>
        </button>
        {bulkOpen && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide pt-4 pb-1 px-1">
              <span className="col-span-4">Student name *</span>
              <span className="col-span-2">Gender</span>
              <span className="col-span-3">Guardian name</span>
              <span className="col-span-2">Guardian phone</span>
              <span></span>
            </div>
            <div className="space-y-2 pt-2 sm:pt-0">
              {bulkRows.map((row, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input value={row.name} onChange={e => setBulkRow(i, 'name', e.target.value)}
                    placeholder={`Student ${i + 1} full name`}
                    className="sm:col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent" />
                  <select value={row.gender} onChange={e => setBulkRow(i, 'gender', e.target.value)}
                    className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                  <input value={row.guardianName} onChange={e => setBulkRow(i, 'guardianName', e.target.value)}
                    placeholder="Guardian (optional)"
                    className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent" />
                  <input value={row.guardianPhone} onChange={e => setBulkRow(i, 'guardianPhone', e.target.value)}
                    placeholder="Phone (optional)"
                    className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent" />
                  <button onClick={() => setBulkRows(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                    className="sm:col-span-1 p-2 text-gray-300 hover:text-red-500 justify-self-start sm:justify-self-center"
                    title="Remove row">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setBulkRows(prev => [...prev, { ...EMPTY_ROW }])}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Plus className="h-4 w-4" />Add Row
              </button>
              <button onClick={saveBulk}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
                <UserPlus className="h-4 w-4" />
                Enrol {bulkRows.filter(r => r.name.trim()).length || ''} Student{bulkRows.filter(r => r.name.trim()).length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
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

      {/* End-of-year promotion modal */}
      {promoteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">End of Year Promotion</h2>
              <button onClick={() => setPromoteOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                This moves <strong>every active student up one class</strong>. The top class graduates and is archived (marked inactive). Please <strong>download a backup first</strong> — this cannot be undone with one click.
              </div>
              {promotionPlan.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No active students to promote.</p>
              ) : (
                <div className="space-y-1.5">
                  {promotionPlan.map(p => (
                    <div key={p.from} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-600">{p.from}</span>
                      <span className="flex items-center gap-2 font-medium text-gray-900">
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                        {p.to} <span className="text-xs text-gray-400">({p.count})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-3 pt-1">
                <button onClick={() => setPromoteOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={applyPromotion} disabled={promotableTotal === 0}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50">
                  Promote {promotableTotal || ''} Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
