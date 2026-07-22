import { useState } from 'react';
import { Clock, Printer, Save, Plus, X, Edit2 } from 'lucide-react';
import { useAppContext, Timetable, TimetableCell } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['Period 1\n07:30–08:30', 'Period 2\n08:30–09:30', 'Break\n09:30–10:00', 'Period 3\n10:00–11:00', 'Period 4\n11:00–12:00', 'Lunch\n12:00–12:45', 'Period 5\n12:45–13:45', 'Period 6\n13:45–14:45'];
const PERIOD_KEYS = ['p1', 'p2', 'brk', 'p3', 'p4', 'lnch', 'p5', 'p6'];
const BREAK_SLOTS = ['brk', 'lnch'];

const CLASSES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

function slotKey(day: string, period: string) {
  return `${day}_${period}`;
}

export function ClassTimetable() {
  const { timetables, saveTimetable, teachers } = useAppContext();
  const tc = useThemeClasses();
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [editing, setEditing] = useState<{ day: string; period: string } | null>(null);
  const [cellForm, setCellForm] = useState<TimetableCell>({ subject: '', teacherName: '' });

  const currentTimetable: Timetable = timetables.find(t => t.classGrade === selectedClass) || {
    id: `tt-${selectedClass.replace(/\s+/g, '-').toLowerCase()}`,
    classGrade: selectedClass,
    slots: {}
  };

  const getCell = (day: string, period: string): TimetableCell | null =>
    currentTimetable.slots[slotKey(day, period)] || null;

  const openEdit = (day: string, period: string) => {
    const cell = getCell(day, period);
    setCellForm(cell || { subject: '', teacherName: '' });
    setEditing({ day, period });
  };

  const saveCell = () => {
    if (!editing) return;
    const key = slotKey(editing.day, editing.period);
    const newSlots = { ...currentTimetable.slots };
    if (cellForm.subject.trim()) {
      newSlots[key] = { subject: cellForm.subject.trim(), teacherName: cellForm.teacherName.trim() };
    } else {
      delete newSlots[key];
    }
    saveTimetable({ ...currentTimetable, slots: newSlots });
    setEditing(null);
  };

  const clearCell = (day: string, period: string) => {
    const key = slotKey(day, period);
    const newSlots = { ...currentTimetable.slots };
    delete newSlots[key];
    saveTimetable({ ...currentTimetable, slots: newSlots });
  };

  const printTimetable = () => {
    const rows = PERIOD_KEYS.map((pk, i) => {
      const label = PERIODS[i].replace('\n', ' ');
      const isBreak = BREAK_SLOTS.includes(pk);
      const cells = DAYS.map(day => {
        const cell = getCell(day, pk);
        return isBreak
          ? `<td style="background:#f0fdf4;text-align:center;color:#166534;font-weight:600;font-size:11px;">${label.split(' ')[0]}</td>`
          : `<td style="padding:6px 8px;vertical-align:top;border:1px solid #e5e7eb;">
              ${cell ? `<strong style="font-size:12px;">${cell.subject}</strong><br/><span style="color:#6b7280;font-size:10px;">${cell.teacherName}</span>` : '<span style="color:#d1d5db;">—</span>'}
            </td>`;
      }).join('');
      return `<tr><td style="padding:6px 8px;font-size:11px;font-weight:500;white-space:nowrap;border:1px solid #e5e7eb;background:#f9fafb;">${label}</td>${cells}</tr>`;
    }).join('');

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Timetable – ${selectedClass}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;} table{border-collapse:collapse;width:100%;} th{background:#1d4ed8;color:white;padding:8px;font-size:12px;} @media print{button{display:none;}}</style></head>
    <body>
    <div style="text-align:center;margin-bottom:16px;">
      <h2 style="margin:0;">Great Highway Academy</h2>
      <p style="margin:4px 0;color:#6b7280;">Weekly Timetable – ${selectedClass}</p>
    </div>
    <table>
      <thead><tr><th>Period</th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center;">Printed: ${new Date().toLocaleDateString()}</p>
    <button onclick="window.print()" style="margin-top:8px;padding:8px 16px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;">Print</button>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // Clash detection: the same teacher booked in two classes in the same slot.
  const clashes = (() => {
    const bySlotTeacher: Record<string, Record<string, string[]>> = {};
    timetables.forEach(tt => {
      Object.entries(tt.slots).forEach(([key, cell]) => {
        const name = cell.teacherName?.trim();
        if (!name) return;
        ((bySlotTeacher[key] ||= {})[name] ||= []).push(tt.classGrade);
      });
    });
    const out: { slot: string; teacher: string; classes: string[] }[] = [];
    Object.entries(bySlotTeacher).forEach(([slot, teachersMap]) => {
      Object.entries(teachersMap).forEach(([teacher, classes]) => {
        if (classes.length > 1) out.push({ slot: slot.replace('_', ' · ').replace(/\n.*/, ''), teacher, classes });
      });
    });
    return out;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
          <p className="text-gray-600">Weekly schedule per class with teacher assignments</p>
        </div>
        <button onClick={printTimetable} className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>
          <Printer className="h-4 w-4" />
          <span>Print Timetable</span>
        </button>
      </div>

      {clashes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold mb-1">⚠ {clashes.length} timetable clash{clashes.length !== 1 ? 'es' : ''} — a teacher is booked in two classes at once:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {clashes.slice(0, 8).map((c, i) => (
              <li key={i}><strong>{c.teacher}</strong> — {c.slot} — {c.classes.join(' & ')}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Class selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <div className="flex flex-wrap gap-2">
          {CLASSES.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedClass === cls ? `${tc.btn.split(' ')[0]} text-white border-transparent` : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}>
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{selectedClass} – Weekly Timetable</span>
          <span className="text-xs text-gray-400 ml-2">Click any cell to edit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ background: 'var(--gha-primary, #1d4ed8)' }}>
                <th className="py-3 px-4 text-left font-medium w-32">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="py-3 px-4 text-left font-medium">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIOD_KEYS.map((pk, i) => {
                const isBreak = BREAK_SLOTS.includes(pk);
                const [periodLabel, timeLabel] = PERIODS[i].split('\n');
                return (
                  <tr key={pk} className={isBreak ? 'bg-green-50' : 'hover:bg-gray-50'}>
                    <td className="py-3 px-4 border-b border-gray-100">
                      <p className={`font-medium text-xs ${isBreak ? 'text-green-700' : 'text-gray-900'}`}>{periodLabel}</p>
                      <p className="text-xs text-gray-400">{timeLabel}</p>
                    </td>
                    {DAYS.map(day => {
                      const cell = getCell(day, pk);
                      if (isBreak) {
                        return (
                          <td key={day} className="py-3 px-4 border-b border-gray-100 text-center text-xs text-green-600 font-medium">
                            {periodLabel}
                          </td>
                        );
                      }
                      return (
                        <td key={day} className="py-1 px-2 border-b border-gray-100">
                          <div
                            onClick={() => openEdit(day, pk)}
                            className="min-h-[52px] rounded-lg border border-dashed border-gray-200 p-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors relative group"
                          >
                            {cell ? (
                              <>
                                <p className="text-xs font-semibold text-gray-900 leading-tight">{cell.subject}</p>
                                {cell.teacherName && <p className="text-xs text-gray-500 mt-0.5">{cell.teacherName}</p>}
                                <button
                                  onClick={e => { e.stopPropagation(); clearCell(day, pk); }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100">
                                <Plus className="h-4 w-4 text-blue-400" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Edit Slot</h3>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500">
                {editing.day} · {PERIODS[PERIOD_KEYS.indexOf(editing.period)].replace('\n', ' ')} · {selectedClass}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  autoFocus
                  value={cellForm.subject}
                  onChange={e => setCellForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Mathematics, English, Science…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher (optional)</label>
                <input
                  list="teacher-list"
                  value={cellForm.teacherName}
                  onChange={e => setCellForm(f => ({ ...f, teacherName: e.target.value }))}
                  placeholder="e.g. Mrs. Tembo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="teacher-list">
                  {teachers.filter(t => t.status === 'active').map(t => (
                    <option key={t.id} value={t.name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              {cellForm.subject === '' && getCell(editing.day, editing.period) && (
                <button onClick={() => { clearCell(editing.day, editing.period); setEditing(null); }}
                  className="flex-1 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
                  Clear Slot
                </button>
              )}
              <button onClick={saveCell} className={`flex-1 flex items-center justify-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
