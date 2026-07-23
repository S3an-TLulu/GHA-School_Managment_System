import { useState } from 'react';
import { GraduationCap, Printer, Save, Plus, Trash2, ChevronDown, FileDown } from 'lucide-react';
import { useAppContext, StudentResult } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { printHtml, exportPdf } from '../lib/print';

// Send a finished document HTML to the print dialog, or to Save-as-PDF.
const emitDoc = (html: string, filename: string, pdf: boolean) => pdf ? exportPdf(html, filename) : printHtml(html);

const CLASSES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
const DEFAULT_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Religious Education', 'Creative Arts', 'Physical Education'];

// The assessments a teacher can record within a single term. Marks are entered
// per-assessment; the term Overall is the average across whatever has been
// recorded. "Overall (Term)" is a read-only view of that computed result.
const ASSESSMENTS = ['Monthly Test 1', 'Monthly Test 2', 'Monthly Test 3', 'Mid-Term', 'End of Term'];
const OVERALL = 'Overall (Term)';

// Average each subject's mark across all recorded assessments → the term overall.
function computeOverall(assessments: Record<string, Record<string, number>>): Record<string, number> {
  const totals: Record<string, { sum: number; n: number }> = {};
  Object.values(assessments).forEach(marks => {
    Object.entries(marks).forEach(([sub, mark]) => {
      if (!totals[sub]) totals[sub] = { sum: 0, n: 0 };
      totals[sub].sum += mark;
      totals[sub].n += 1;
    });
  });
  const out: Record<string, number> = {};
  Object.entries(totals).forEach(([sub, { sum, n }]) => { out[sub] = Math.round(sum / n); });
  return out;
}

function getGrade(mark: number): { letter: string; color: string } {
  if (mark >= 80) return { letter: 'A', color: 'text-green-600' };
  if (mark >= 70) return { letter: 'B', color: 'text-blue-600' };
  if (mark >= 60) return { letter: 'C', color: 'text-yellow-600' };
  if (mark >= 50) return { letter: 'D', color: 'text-orange-600' };
  return { letter: 'F', color: 'text-red-600' };
}

function calcAverage(subjects: Record<string, number>): number {
  const vals = Object.values(subjects);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function Results() {
  const { students, results, saveClassResults, deleteResult, terms, branding,
    subjects: canonicalSubjects, addSubject: addCanonicalSubject, deleteSubject: deleteCanonicalSubject } = useAppContext();
  const TERMS = terms;
  const tc = useThemeClasses();
  const toast = useToast();

  const [selectedClass, setSelectedClass] = useState(CLASSES[3]);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedAssessment, setSelectedAssessment] = useState(ASSESSMENTS[0]);
  const [newSubject, setNewSubject] = useState('');
  const [editGrid, setEditGrid] = useState<Record<string, Record<string, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [viewStudent, setViewStudent] = useState<string | null>(null);

  const viewingOverall = selectedAssessment === OVERALL;

  // The marks currently shown for a student: the selected assessment's marks, or
  // the computed term overall when the Overall view is active.
  const displayMarks = (result?: StudentResult): Record<string, number> =>
    !result ? {} : viewingOverall ? result.subjects : (result.assessments?.[selectedAssessment] ?? {});

  const classStudents = students.filter(s => s.grade === selectedClass && (!s.status || s.status === 'active'));

  const classResults = results.filter(r => r.classGrade === selectedClass && r.term === selectedTerm);

  // Subjects come from the canonical list (managed in Subjects / here), plus any
  // subject names already recorded in this class's marks so history never hides.
  const subjects = (() => {
    const canonical = canonicalSubjects.filter(s => s.active !== false).map(s => s.name);
    const fromResults = classResults.flatMap(r =>
      [...Object.keys(r.subjects), ...Object.values(r.assessments ?? {}).flatMap(m => Object.keys(m))]);
    const merged = Array.from(new Set([...(canonical.length ? canonical : DEFAULT_SUBJECTS), ...fromResults]));
    return merged;
  })();

  const getStudentResult = (studentId: string): StudentResult | undefined =>
    classResults.find(r => r.studentId === studentId);

  // Rank a student within their class by average (only students with results).
  const classRank = (studentId: string): { rank: number; total: number } | null => {
    const ranked = classStudents
      .map(s => { const r = getStudentResult(s.id); return { id: s.id, avg: r ? calcAverage(r.subjects) : -1 }; })
      .filter(r => r.avg >= 0)
      .sort((a, b) => b.avg - a.avg);
    const idx = ranked.findIndex(r => r.id === studentId);
    return idx === -1 ? null : { rank: idx + 1, total: ranked.length };
  };

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const startEditing = () => {
    if (viewingOverall) return; // the Overall view is read-only (computed)
    const grid: Record<string, Record<string, string>> = {};
    classStudents.forEach(s => {
      const marks = getStudentResult(s.id)?.assessments?.[selectedAssessment] ?? {};
      grid[s.id] = {};
      subjects.forEach(sub => {
        grid[s.id][sub] = marks[sub]?.toString() ?? '';
      });
    });
    setEditGrid(grid);
    setIsEditing(true);
  };

  const saveAll = () => {
    if (viewingOverall) return;
    const records: StudentResult[] = classStudents.map(s => {
      const existing = getStudentResult(s.id);
      // Marks entered for the assessment being edited.
      const marks = Object.fromEntries(
        subjects
          .filter(sub => (editGrid[s.id]?.[sub] ?? '') !== '')
          .map(sub => [sub, parseFloat(editGrid[s.id]?.[sub] ?? '0') || 0])
      );
      // Merge into any other assessments already recorded for this student.
      const assessments = { ...(existing?.assessments ?? {}) };
      if (Object.keys(marks).length) assessments[selectedAssessment] = marks;
      else delete assessments[selectedAssessment];
      // Recompute the term overall; fall back to legacy `subjects` if empty.
      const overall = computeOverall(assessments);
      return {
        id: existing?.id ?? `result-${s.id}-${Date.now()}`,
        studentId: s.id,
        classGrade: selectedClass,
        term: selectedTerm,
        subjects: Object.keys(overall).length ? overall : (existing?.subjects ?? {}),
        assessments,
        recordedBy: 'Admin',
        date: new Date().toISOString(),
      };
    });
    saveClassResults(selectedClass, selectedTerm, records);
    setIsEditing(false);
    toast(`${selectedAssessment} saved for ${selectedClass} — ${selectedTerm}.`, 'success');
  };

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    // Add to the canonical list so it's shared across the app.
    addCanonicalSubject({ id: `subj-${Date.now()}`, name: trimmed, active: true });
    if (isEditing) {
      setEditGrid(prev => {
        const next = { ...prev };
        classStudents.forEach(s => { next[s.id] = { ...next[s.id], [trimmed]: '' }; });
        return next;
      });
    }
    setNewSubject('');
  };

  const removeSubject = (sub: string) => {
    // Remove from the canonical list (by name). Historical marks stay in records.
    const match = canonicalSubjects.find(s => s.name === sub);
    if (match) deleteCanonicalSubject(match.id);
    if (isEditing) {
      setEditGrid(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(sid => { const { [sub]: _, ...rest } = next[sid]; next[sid] = rest; });
        return next;
      });
    }
  };

  const printSlip = (studentId: string, pdf = false) => {
    const student = students.find(s => s.id === studentId);
    const result = getStudentResult(studentId);
    if (!student || !result) return;

    const avg = calcAverage(result.subjects);
    const { letter } = getGrade(avg);
    const passed = avg >= 50;

    // Breakdown of the term's assessments (Monthly Tests / Mid-Term / End of Term).
    const recorded = ASSESSMENTS.filter(a => result.assessments?.[a] && Object.keys(result.assessments[a]).length);
    const breakdown = recorded.length ? `
    <p style="margin:16px 0 4px;font-weight:700;font-size:13px;color:#374151;">Assessment breakdown</p>
    <table style="border-collapse:collapse;width:100%;margin-bottom:4px;">
      <thead><tr><th>Assessment</th><th style="text-align:center;">Average</th><th style="text-align:center;">Grade</th></tr></thead>
      <tbody>${recorded.map(a => {
        const av = calcAverage(result.assessments![a]);
        return `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;">${a}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:600;">${av}%</td><td style="padding:6px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;">${getGrade(av).letter}</td></tr>`;
      }).join('')}</tbody>
    </table>` : '';

    const rows = subjects.map(sub => {
      const mark = result.subjects[sub] ?? '—';
      const g = typeof mark === 'number' ? getGrade(mark) : { letter: '—', color: '' };
      return `<tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${sub}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:600;">${mark}${typeof mark === 'number' ? '%' : ''}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;">${g.letter}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:auto;} table{border-collapse:collapse;width:100%;margin-top:12px;} th{background:#1d4ed8;color:white;padding:8px 12px;text-align:left;} @media print{button{display:none;}}</style></head>
    <body>
    <div style="text-align:center;border-bottom:2px solid #1d4ed8;padding-bottom:16px;margin-bottom:16px;">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:48px;width:48px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : ''}
      <h2 style="margin:0;color:#1d4ed8;">${branding.schoolName || 'School'}</h2>
      <p style="margin:4px 0;color:#6b7280;font-size:13px;">${branding.motto || ''}</p>
      <h3 style="margin:8px 0 0;">Academic Report Card</h3>
    </div>
    <table style="border-collapse:collapse;width:100%;margin-bottom:12px;">
      <tr><td style="padding:4px 8px;width:120px;color:#6b7280;font-size:13px;">Student Name</td><td style="padding:4px 8px;font-weight:600;">${student.name}</td><td style="padding:4px 8px;width:80px;color:#6b7280;font-size:13px;">Class</td><td style="padding:4px 8px;font-weight:600;">${selectedClass}</td></tr>
      <tr><td style="padding:4px 8px;color:#6b7280;font-size:13px;">Admission No.</td><td style="padding:4px 8px;">${student.admissionNumber ?? '—'}</td><td style="padding:4px 8px;color:#6b7280;font-size:13px;">Term</td><td style="padding:4px 8px;">${selectedTerm}</td></tr>
      ${(() => { const r = classRank(studentId); return r ? `<tr><td style="padding:4px 8px;color:#6b7280;font-size:13px;">Position</td><td style="padding:4px 8px;font-weight:600;">${ordinal(r.rank)} of ${r.total}</td><td style="padding:4px 8px;color:#6b7280;font-size:13px;">Subjects</td><td style="padding:4px 8px;">${subjects.length}</td></tr>` : ''; })()}
    </table>
    <table>
      <thead><tr><th>Subject</th><th style="text-align:center;">Mark</th><th style="text-align:center;">Grade</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f9fafb;">
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Average</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;">${avg}%</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${passed ? '#16a34a' : '#dc2626'};">${letter}</td>
        </tr>
      </tfoot>
    </table>
    ${breakdown}
    <div style="margin-top:20px;padding:12px;background:${passed ? '#f0fdf4' : '#fef2f2'};border-radius:8px;border:1px solid ${passed ? '#bbf7d0' : '#fecaca'};">
      <p style="margin:0;font-weight:700;color:${passed ? '#16a34a' : '#dc2626'};font-size:16px;">${passed ? 'PASSED' : 'FAILED'}</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Overall average: ${avg}% — ${letter}</p>
    </div>
    <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div style="border-top:1px solid #374151;padding-top:4px;text-align:center;font-size:12px;color:#6b7280;">Class Teacher</div>
      <div style="border-top:1px solid #374151;padding-top:4px;text-align:center;font-size:12px;color:#6b7280;">Head Teacher</div>
    </div>
    <p style="margin-top:20px;font-size:11px;color:#9ca3af;text-align:center;">Printed: ${new Date().toLocaleDateString()}</p>
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
    </body></html>`;
    emitDoc(html, `Report_Card_${student.name}_${selectedTerm}`, pdf);
  };

  const printClassReport = (pdf = false) => {
    const headerCols = subjects.map(s => `<th style="padding:6px 8px;background:#1d4ed8;color:white;font-size:11px;">${s}</th>`).join('');
    const rows = classStudents.map(s => {
      const result = getStudentResult(s.id);
      const avg = result ? calcAverage(result.subjects) : null;
      const grade = avg !== null ? getGrade(avg) : null;
      const cols = subjects.map(sub => {
        const mark = result?.subjects[sub];
        return `<td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;">${mark !== undefined ? `${mark}%` : '—'}</td>`;
      }).join('');
      return `<tr>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:11px;">${s.name}</td>
        ${cols}
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:11px;">${avg !== null ? `${avg}%` : '—'}</td>
        <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:11px;">${grade?.letter ?? '—'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>Class Results – ${selectedClass}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;} table{border-collapse:collapse;width:100%;} @media print{button{display:none;}}</style></head>
    <body>
    <div style="text-align:center;margin-bottom:16px;">
      <h2 style="margin:0;">${branding.schoolName || 'School'}</h2>
      <p style="margin:4px 0;color:#6b7280;">Class Results — ${selectedClass} | ${selectedTerm}</p>
    </div>
    <table>
      <thead><tr>
        <th style="padding:6px 8px;background:#1d4ed8;color:white;font-size:11px;text-align:left;">Student</th>
        ${headerCols}
        <th style="padding:6px 8px;background:#1d4ed8;color:white;font-size:11px;">Avg</th>
        <th style="padding:6px 8px;background:#1d4ed8;color:white;font-size:11px;">Grade</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center;">Printed: ${new Date().toLocaleDateString()}</p>
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
    </body></html>`;
    emitDoc(html, `Class_Results_${selectedClass}_${selectedTerm}`, pdf);
  };

  // Print every student's full report card in one document (one card per page).
  const printAllCards = (pdf = false) => {
    const withResults = classStudents.filter(s => getStudentResult(s.id));
    if (withResults.length === 0) { toast.toast?.('No results recorded for this class yet.', 'warning'); return; }
    const card = (student: typeof classStudents[number]) => {
      const result = getStudentResult(student.id)!;
      const avg = calcAverage(result.subjects);
      const { letter } = getGrade(avg);
      const passed = avg >= 50;
      const rank = classRank(student.id);
      const rows = subjects.map(sub => {
        const mark = result.subjects[sub] ?? '—';
        const g = typeof mark === 'number' ? getGrade(mark) : { letter: '—' };
        return `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb">${sub}</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:600">${mark}${typeof mark === 'number' ? '%' : ''}</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:700">${g.letter}</td></tr>`;
      }).join('');
      return `<div style="page-break-after:always;max-width:600px;margin:0 auto 20px">
        <div style="text-align:center;border-bottom:2px solid #1d4ed8;padding-bottom:12px;margin-bottom:12px">
          ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:44px;width:44px;object-fit:cover;border-radius:8px" />` : ''}
          <h2 style="margin:0;color:#1d4ed8">${branding.schoolName || 'School'}</h2>
          <p style="margin:2px 0;color:#6b7280;font-size:12px">${branding.motto || ''}</p>
          <h3 style="margin:6px 0 0">Academic Report Card</h3>
        </div>
        <table style="width:100%;margin-bottom:10px;font-size:13px"><tr><td style="color:#6b7280;width:110px">Student</td><td style="font-weight:600">${student.name}</td><td style="color:#6b7280;width:70px">Class</td><td style="font-weight:600">${selectedClass}</td></tr>
        <tr><td style="color:#6b7280">Adm No.</td><td>${student.admissionNumber ?? '—'}</td><td style="color:#6b7280">Term</td><td>${selectedTerm}</td></tr>
        ${rank ? `<tr><td style="color:#6b7280">Position</td><td style="font-weight:600">${ordinal(rank.rank)} of ${rank.total}</td><td style="color:#6b7280">Average</td><td style="font-weight:700;color:${passed ? '#16a34a' : '#dc2626'}">${avg}% (${letter})</td></tr>` : ''}</table>
        <table style="width:100%;border-collapse:collapse"><thead><tr><th style="background:#1d4ed8;color:#fff;padding:6px 10px;text-align:left">Subject</th><th style="background:#1d4ed8;color:#fff;padding:6px 10px">Mark</th><th style="background:#1d4ed8;color:#fff;padding:6px 10px">Grade</th></tr></thead><tbody>${rows}</tbody></table>
        <div style="margin-top:14px;padding:10px;background:${passed ? '#f0fdf4' : '#fef2f2'};border-radius:8px;border:1px solid ${passed ? '#bbf7d0' : '#fecaca'}"><strong style="color:${passed ? '#16a34a' : '#dc2626'}">${passed ? 'PASSED' : 'FAILED'}</strong> — Overall ${avg}% (${letter})</div>
        <div style="margin-top:26px;display:grid;grid-template-columns:1fr 1fr;gap:24px"><div style="border-top:1px solid #374151;padding-top:4px;text-align:center;font-size:11px;color:#6b7280">Class Teacher</div><div style="border-top:1px solid #374151;padding-top:4px;text-align:center;font-size:11px;color:#6b7280">Head Teacher</div></div>
      </div>`;
    };
    const html = `<!DOCTYPE html><html><head><title>Report Cards — ${selectedClass} — ${selectedTerm}</title><style>@media print{button{display:none}}body{font-family:Arial,sans-serif;padding:16px}</style></head><body>${withResults.map(card).join('')}<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`;
    emitDoc(html, `Report_Cards_${selectedClass}_${selectedTerm}`, pdf);
  };

  const viewResult = viewStudent ? getStudentResult(viewStudent) : null;
  const viewStudentInfo = viewStudent ? students.find(s => s.id === viewStudent) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Results</h1>
          <p className="text-gray-600">Record and view student marks per term</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button onClick={() => printClassReport()} className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Printer className="h-4 w-4" />
                <span>Print Class</span>
              </button>
              <button title="Export class results to PDF" onClick={() => printClassReport(true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                <FileDown className="h-4 w-4" />
              </button>
              <button onClick={() => printAllCards()} className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Printer className="h-4 w-4" />
                <span>All Cards</span>
              </button>
              <button title="Export all report cards to PDF" onClick={() => printAllCards(true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                <FileDown className="h-4 w-4" />
              </button>
              {!viewingOverall && (
                <button onClick={startEditing} className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>
                  <Plus className="h-4 w-4" />
                  <span>Enter Marks</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveAll} className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium`}>
                <Save className="h-4 w-4" />
                <span>Save Results</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <div className="flex flex-wrap gap-2">
            {CLASSES.map(cls => (
              <button key={cls} onClick={() => { setSelectedClass(cls); setIsEditing(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedClass === cls ? `${tc.btn.split(' ')[0]} text-white border-transparent` : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}>
                {cls}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
          <div className="relative">
            <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setIsEditing(false); }}
              className="appearance-none pr-8 pl-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">Assessment</label>
          <div className="flex flex-wrap gap-2">
            {[...ASSESSMENTS, OVERALL].map(a => (
              <button key={a} onClick={() => { setSelectedAssessment(a); setIsEditing(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedAssessment === a
                    ? a === OVERALL ? 'bg-gray-800 text-white border-transparent' : `${tc.btn.split(' ')[0]} text-white border-transparent`
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subjects manager */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Subjects</p>
        <div className="flex flex-wrap gap-2 items-center">
          {subjects.map(sub => (
            <span key={sub} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tc.light} ${tc.text}`}>
              {sub}
              <button onClick={() => removeSubject(sub)} className="ml-1 hover:opacity-70">
                <span className="text-xs">×</span>
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input value={newSubject} onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
              placeholder="Add subject…"
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={addSubject} className={`${tc.btn} text-white px-2 py-1 rounded-lg text-xs`}>
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Marks grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
          <GraduationCap className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{selectedClass} — {selectedTerm}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewingOverall ? 'bg-gray-800 text-white' : `${tc.light} ${tc.text}`}`}>{selectedAssessment}</span>
          <span className="text-xs text-gray-400 ml-2">{classStudents.length} students</span>
          {viewingOverall && <span className="text-xs text-gray-400">· average across recorded assessments</span>}
        </div>

        {classStudents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No active students in {selectedClass}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ background: 'var(--gha-primary, #1d4ed8)' }}>
                  <th className="py-3 px-4 text-left font-medium w-44">Student</th>
                  {subjects.map(sub => (
                    <th key={sub} className="py-3 px-3 text-center font-medium text-xs whitespace-nowrap">{sub}</th>
                  ))}
                  <th className="py-3 px-3 text-center font-medium">Avg</th>
                  <th className="py-3 px-3 text-center font-medium">Grade</th>
                  {!isEditing && <th className="py-3 px-3 text-center font-medium">Slip</th>}
                </tr>
              </thead>
              <tbody>
                {classStudents.map(student => {
                  const result = getStudentResult(student.id);
                  const shown = displayMarks(result);
                  const avg = Object.keys(shown).length ? calcAverage(shown) : null;
                  const grade = avg !== null ? getGrade(avg) : null;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="py-2 px-4">
                        <p className="font-medium text-gray-900 text-xs">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.admissionNumber ?? ''}</p>
                      </td>
                      {subjects.map(sub => (
                        <td key={sub} className="py-2 px-2 text-center">
                          {isEditing ? (
                            <input
                              type="number" min="0" max="100"
                              value={editGrid[student.id]?.[sub] ?? ''}
                              onChange={e => setEditGrid(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], [sub]: e.target.value }
                              }))}
                              className="w-14 border border-gray-300 rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-xs text-gray-700">
                              {shown[sub] !== undefined ? `${shown[sub]}%` : '—'}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center font-semibold text-sm">
                        {avg !== null ? `${avg}%` : '—'}
                      </td>
                      <td className={`py-2 px-3 text-center font-bold text-sm ${grade?.color ?? 'text-gray-400'}`}>
                        {grade?.letter ?? '—'}
                      </td>
                      {!isEditing && (
                        <td className="py-2 px-3 text-center">
                          {result && (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => printSlip(student.id)} title="Print report card"
                                className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Printer className="h-4 w-4" />
                              </button>
                              <button onClick={() => printSlip(student.id, true)} title="Export report card to PDF"
                                className="text-gray-400 hover:text-blue-600 transition-colors">
                                <FileDown className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade legend */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs font-medium text-gray-500 mb-3">Grade Scale</p>
        <div className="flex flex-wrap gap-3">
          {[
            { range: '80–100%', letter: 'A', color: 'text-green-600', bg: 'bg-green-50' },
            { range: '70–79%', letter: 'B', color: 'text-blue-600', bg: 'bg-blue-50' },
            { range: '60–69%', letter: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { range: '50–59%', letter: 'D', color: 'text-orange-600', bg: 'bg-orange-50' },
            { range: 'Below 50%', letter: 'F', color: 'text-red-600', bg: 'bg-red-50' },
          ].map(g => (
            <div key={g.letter} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${g.bg}`}>
              <span className={`font-bold text-sm ${g.color}`}>{g.letter}</span>
              <span className="text-xs text-gray-500">{g.range}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50">
            <span className="text-xs text-gray-500">Pass: 50%+ average</span>
          </div>
        </div>
      </div>
    </div>
  );
}
