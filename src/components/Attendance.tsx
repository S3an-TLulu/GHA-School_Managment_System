import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Printer, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { useAppContext, AttendanceRecord } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  present: { label: 'Present', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: <CheckCircle className="h-4 w-4" /> },
  absent:  { label: 'Absent',  color: 'text-red-700',   bg: 'bg-red-100 border-red-300',     icon: <XCircle className="h-4 w-4" /> },
  late:    { label: 'Late',    color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300', icon: <Clock className="h-4 w-4" /> },
  excused: { label: 'Excused', color: 'text-blue-700',  bg: 'bg-blue-100 border-blue-300',   icon: <AlertCircle className="h-4 w-4" /> },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function Attendance() {
  const { students, attendance, saveAttendance, deleteAttendanceForDate } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();

  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'summary'>('mark');
  const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const classStudents = useMemo(
    () => students.filter(s => s.grade === selectedGrade && (!s.status || s.status === 'active')),
    [students, selectedGrade]
  );

  const existingRecords = useMemo(
    () => attendance.filter(r => r.date === selectedDate && r.classGrade === selectedGrade),
    [attendance, selectedDate, selectedGrade]
  );

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  const getStatus = (studentId: string): AttendanceStatus => {
    if (draft[studentId]) return draft[studentId];
    const existing = existingRecords.find(r => r.studentId === studentId);
    return existing?.status ?? 'present';
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setDraft(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => { all[s.id] = status; });
    setDraft(all);
  };

  const handleSave = () => {
    if (classStudents.length === 0) return;
    const records: AttendanceRecord[] = classStudents.map(s => ({
      id: `att-${selectedDate}-${s.id}`,
      date: selectedDate,
      classGrade: selectedGrade,
      studentId: s.id,
      status: getStatus(s.id),
    }));
    saveAttendance(records);
    setDraft({});
    toast(`Attendance saved for ${selectedGrade}.`, 'success');
  };

  const handlePrint = () => {
    const rows = classStudents.map((s, i) => {
      const status = getStatus(s.id);
      const cfg = STATUS_CONFIG[status];
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${s.admissionNumber || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:500">${s.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${s.gender || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:${status === 'present' ? '#166534' : status === 'absent' ? '#991b1b' : status === 'late' ? '#92400e' : '#1e40af'};font-weight:bold">${cfg.label}</td>
      </tr>`;
    }).join('');

    const summary = (['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => ({
      label: STATUS_CONFIG[s].label,
      count: classStudents.filter(st => getStatus(st.id) === s).length
    }));

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Attendance Register — ${selectedGrade} — ${selectedDate}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#111}
        h1{color:#1d4ed8}
        table{width:100%;border-collapse:collapse}
        th{background:#1d4ed8;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
        .summary{display:flex;gap:12px;margin:16px 0}
        .box{flex:1;text-align:center;padding:10px;border-radius:6px}
        @media print{button{display:none}}
      </style></head><body>
      <h1>Great Highway Academy</h1>
      <p style="color:#6b7280;margin-top:0">Attendance Register</p>
      <p><strong>Class:</strong> ${selectedGrade} &nbsp;&nbsp; <strong>Date:</strong> ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      <div class="summary">
        <div class="box" style="background:#dcfce7;color:#166534"><div style="font-size:11px">Present</div><div style="font-size:22px;font-weight:bold">${summary[0].count}</div></div>
        <div class="box" style="background:#fee2e2;color:#991b1b"><div style="font-size:11px">Absent</div><div style="font-size:22px;font-weight:bold">${summary[1].count}</div></div>
        <div class="box" style="background:#fef9c3;color:#92400e"><div style="font-size:11px">Late</div><div style="font-size:22px;font-weight:bold">${summary[2].count}</div></div>
        <div class="box" style="background:#dbeafe;color:#1e40af"><div style="font-size:11px">Excused</div><div style="font-size:22px;font-weight:bold">${summary[3].count}</div></div>
        <div class="box" style="background:#f3f4f6;color:#374151"><div style="font-size:11px">Total</div><div style="font-size:22px;font-weight:bold">${classStudents.length}</div></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Adm. No.</th><th>Student Name</th><th>Gender</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#9ca3af;font-size:11px;margin-top:24px">Teacher signature: __________________________ &nbsp;&nbsp; Date: ${selectedDate}</p>
      <script>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  // ── History tab ─────────────────────────────────────────────────────────────
  const historyDates = useMemo(() => {
    const dates = [...new Set(attendance.filter(r => r.classGrade === selectedGrade).map(r => r.date))];
    return dates.sort((a, b) => b.localeCompare(a));
  }, [attendance, selectedGrade]);

  // ── Summary tab ─────────────────────────────────────────────────────────────
  const summaryData = useMemo(() => {
    return classStudents.map(s => {
      const records = attendance.filter(r => r.studentId === s.id && r.classGrade === selectedGrade);
      const present = records.filter(r => r.status === 'present').length;
      const absent  = records.filter(r => r.status === 'absent').length;
      const late    = records.filter(r => r.status === 'late').length;
      const excused = records.filter(r => r.status === 'excused').length;
      const total = records.length;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : null;
      return { student: s, present, absent, late, excused, total, rate };
    });
  }, [classStudents, attendance, selectedGrade]);

  const isSaved = existingRecords.length > 0 && Object.keys(draft).length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Mark and track daily student attendance by class</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setDraft({}); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input type="date" value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setDraft({}); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
          <div className="flex gap-1 mt-4">
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); setDraft({}); }}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={() => { setSelectedDate(todayStr()); setDraft({}); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Today</button>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); setDraft({}); }}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          {isSaved && (
            <span className="mt-4 flex items-center space-x-1 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>Attendance saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['mark', 'history', 'summary'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'mark' ? 'Mark Attendance' : tab === 'history' ? 'History' : 'Summary'}
          </button>
        ))}
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-gray-900">{selectedGrade} — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="text-sm text-gray-500">{classStudents.length} student{classStudents.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => markAll('present')} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">All Present</button>
              <button onClick={() => markAll('absent')} className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">All Absent</button>
              <button onClick={handlePrint} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200">
                <Printer className="h-3.5 w-3.5" /><span>Print Register</span>
              </button>
            </div>
          </div>

          {classStudents.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No active students in {selectedGrade}.</div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {classStudents.map((student, i) => {
                  const currentStatus = getStatus(student.id);
                  return (
                    <div key={student.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-6 text-sm text-gray-400 flex-shrink-0">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-blue-700">{student.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                          {student.admissionNumber && <p className="text-xs text-gray-400">{student.admissionNumber}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const active = currentStatus === s;
                          return (
                            <button key={s} onClick={() => setStatus(student.id, s)}
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                                active ? `${cfg.bg} ${cfg.color} border-current` : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                              }`}>
                              {cfg.icon}
                              <span className="hidden sm:inline">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats bar */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
                {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => {
                  const count = classStudents.filter(st => getStatus(st.id) === s).length;
                  const cfg = STATUS_CONFIG[s];
                  return count > 0 ? (
                    <span key={s} className={`flex items-center space-x-1 font-medium ${cfg.color}`}>
                      {cfg.icon}<span>{count} {cfg.label}</span>
                    </span>
                  ) : null;
                })}
              </div>

              <div className="p-5 border-t border-gray-100">
                <button onClick={handleSave}
                  className={`w-full ${tc.btn} text-white py-2.5 rounded-lg font-semibold transition-colors`}>
                  Save Attendance for {selectedGrade}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <p className="font-semibold text-gray-900">{selectedGrade} — Attendance History</p>
            <p className="text-sm text-gray-500">{historyDates.length} day{historyDates.length !== 1 ? 's' : ''} recorded</p>
          </div>
          {historyDates.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No attendance records yet for {selectedGrade}.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {historyDates.map(date => {
                const dayRecords = attendance.filter(r => r.date === date && r.classGrade === selectedGrade);
                const present = dayRecords.filter(r => r.status === 'present').length;
                const absent  = dayRecords.filter(r => r.status === 'absent').length;
                const late    = dayRecords.filter(r => r.status === 'late').length;
                const excused = dayRecords.filter(r => r.status === 'excused').length;
                const rate = dayRecords.length > 0 ? Math.round(((present + late) / dayRecords.length) * 100) : 0;
                return (
                  <div key={date} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                        <span className="text-green-600">{present} present</span>
                        {absent > 0 && <span className="text-red-600">{absent} absent</span>}
                        {late > 0 && <span className="text-yellow-600">{late} late</span>}
                        {excused > 0 && <span className="text-blue-600">{excused} excused</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {rate}%
                      </span>
                      <button onClick={() => { setSelectedDate(date); setActiveTab('mark'); setDraft({}); }}
                        className="text-xs text-blue-600 hover:underline">View</button>
                      <button onClick={() => { deleteAttendanceForDate(date, selectedGrade); toast('Attendance record deleted.', 'info'); }}
                        className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center space-x-2">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            <p className="font-semibold text-gray-900">{selectedGrade} — Student Attendance Summary</p>
          </div>
          {summaryData.every(s => s.total === 0) ? (
            <div className="p-10 text-center text-gray-400">No attendance data yet for {selectedGrade}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Student', 'Days Recorded', 'Present', 'Absent', 'Late', 'Excused', 'Rate'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaryData.map(({ student, present, absent, late, excused, total, rate }) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        {student.admissionNumber && <p className="text-xs text-gray-400">{student.admissionNumber}</p>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{total}</td>
                      <td className="px-5 py-3 text-sm font-medium text-green-600">{present}</td>
                      <td className="px-5 py-3 text-sm font-medium text-red-600">{absent}</td>
                      <td className="px-5 py-3 text-sm font-medium text-yellow-600">{late}</td>
                      <td className="px-5 py-3 text-sm font-medium text-blue-600">{excused}</td>
                      <td className="px-5 py-3">
                        {rate !== null ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                              <div className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${rate}%` }} />
                            </div>
                            <span className={`text-sm font-bold ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {rate}%
                            </span>
                          </div>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
