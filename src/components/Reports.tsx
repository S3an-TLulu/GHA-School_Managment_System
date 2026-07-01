import { useState } from 'react';
import { BarChart3, Download, FileText, DollarSign, TrendingDown, Printer, GraduationCap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

function downloadCSV(rows: string[][], filename: string) {
  const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function Reports() {
  const { students, payments, uniforms, expenses, results, currentTerm } = useAppContext();
  const tc = useThemeClasses();
  const [selectedReport, setSelectedReport] = useState('financial');
  const [termFilter, setTermFilter] = useState(currentTerm);

  const termPayments = termFilter ? payments.filter(p => p.term === termFilter) : payments;
  const termExpenses = termFilter ? expenses.filter(e => e.term === termFilter) : expenses;

  const totalRevenue = termPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = termPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = termPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const uniformRevenue = uniforms.reduce((sum, u) => sum + u.price, 0);
  const totalExpenses = termExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const allTerms = [...new Set([...payments.map(p => p.term), ...expenses.map(e => e.term)].filter(Boolean))].sort().reverse();
  const resultTerms = [...new Set(results.map(r => r.term))].sort().reverse();
  const [academicTerm, setAcademicTerm] = useState(() => resultTerms[0] ?? currentTerm);

  const getClassSummary = () => {
    const summary: Record<string, { students: number; paid: number; pending: number; overdue: number }> = {};
    students.forEach(student => {
      if (!summary[student.grade]) summary[student.grade] = { students: 0, paid: 0, pending: 0, overdue: 0 };
      summary[student.grade].students++;
      const sp = termPayments.filter(p => p.studentId === student.id);
      summary[student.grade].paid += sp.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      summary[student.grade].pending += sp.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
      summary[student.grade].overdue += sp.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    });
    return summary;
  };

  const handleExportFinancial = () => {
    const rows = [
      ['Great Highway Academy - Financial Report', '', '', ''],
      [`Term: ${termFilter || 'All Terms'}`, '', '', ''],
      ['Generated:', new Date().toLocaleDateString(), '', ''],
      ['', '', '', ''],
      ['SUMMARY', '', '', ''],
      ['Total Revenue (Paid)', `K${totalRevenue}`, '', ''],
      ['Pending Amount', `K${pendingAmount}`, '', ''],
      ['Overdue Amount', `K${overdueAmount}`, '', ''],
      ['Total Expenses', `K${totalExpenses}`, '', ''],
      ['Net Income', `K${netIncome}`, '', ''],
      ['Uniform Sales', `K${uniformRevenue}`, '', ''],
      ['', '', '', ''],
      ['PAYMENT DETAILS', '', '', ''],
      ['Student', 'Grade', 'Payment Type', 'Amount', 'Status', 'Term', 'Date Paid'],
      ...termPayments.map(p => {
        const student = students.find(s => s.id === p.studentId);
        return [student?.name || '', student?.grade || '', p.type, `K${p.amount}`, p.status, p.term || '', p.paidDate ? new Date(p.paidDate).toLocaleDateString() : ''];
      })
    ];
    downloadCSV(rows as string[][], `GHA_Financial_Report_${termFilter || 'All'}.csv`);
  };

  const handleExportStudents = () => {
    const rows = [
      ['Student', 'Grade', 'Guardian', 'Phone', 'Total Paid', 'Total Pending', 'Total Overdue', 'Status'],
      ...students.map(student => {
        const sp = termPayments.filter(p => p.studentId === student.id);
        const paid = sp.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
        const pending = sp.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
        const overdue = sp.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
        return [student.name, student.grade, student.guardianName, student.guardianPhone, `K${paid}`, `K${pending}`, `K${overdue}`, pending + overdue > 0 ? 'Outstanding' : 'Up to Date'];
      })
    ];
    downloadCSV(rows, `GHA_Student_Report_${termFilter || 'All'}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderFinancialReport = () => {
    const breakdown = termPayments.reduce((acc, payment) => {
      const existing = acc.find(item => item.type === payment.type);
      if (existing) { existing.amount += payment.amount; existing.count += 1; }
      else acc.push({ type: payment.type, amount: payment.amount, count: 1 });
      return acc;
    }, [] as { type: string; amount: number; count: number }[]);

    const expenseBreakdown = termExpenses.reduce((acc, expense) => {
      const existing = acc.find(item => item.category === expense.category);
      if (existing) existing.amount += expense.amount;
      else acc.push({ category: expense.category, amount: expense.amount });
      return acc;
    }, [] as { category: string; amount: number }[]);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-7 w-7 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Revenue Collected</p>
                <p className="text-2xl font-bold text-green-900">K{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-7 w-7 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">K{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-7 w-7 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-900">K{overdueAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-7 w-7 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-900">K{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className={`${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-5`}>
            <div className="flex items-center space-x-3">
              <DollarSign className={`h-7 w-7 ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              <div>
                <p className={`text-sm font-medium ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>K{netIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-7 w-7 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Uniform Sales</p>
                <p className="text-2xl font-bold text-blue-900">K{uniformRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Income Breakdown</h3>
            <div className="space-y-2">
              {breakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.type}</span>
                    <span className="text-xs text-gray-500 ml-2">({item.count} payment{item.count !== 1 ? 's' : ''})</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">K{item.amount.toLocaleString()}</span>
                </div>
              ))}
              {breakdown.length === 0 && <p className="text-sm text-gray-400">No payments recorded.</p>}
            </div>
          </div>

          {expenseBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
              <div className="space-y-2">
                {expenseBreakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm font-medium text-gray-900">{item.category}</span>
                    <span className="text-sm font-bold text-red-700">K{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClassReport = () => {
    const classSummary = getClassSummary();
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Class-wise Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Class', 'Students', 'Revenue Paid', 'Pending', 'Overdue'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(classSummary).map(([grade, data]) => (
                <tr key={grade} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{grade}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{data.students}</td>
                  <td className="px-6 py-4 text-sm text-green-600 font-medium">K{data.paid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-yellow-600 font-medium">K{data.pending.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-red-600 font-medium">K{data.overdue.toLocaleString()}</td>
                </tr>
              ))}
              {Object.keys(classSummary).length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No class data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleExportAcademic = () => {
    const termResults = results.filter(r => r.term === academicTerm);
    const subjectSet = new Set<string>();
    termResults.forEach(r => Object.keys(r.subjects).forEach(s => subjectSet.add(s)));
    const subjects = [...subjectSet];
    const header = ['Student', 'Grade', 'Term', ...subjects, 'Average', 'Grade', 'Result'];
    const rows = termResults.map(r => {
      const student = students.find(s => s.id === r.studentId);
      const vals = Object.values(r.subjects);
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      const letter = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
      return [student?.name ?? '', student?.grade ?? '', r.term, ...subjects.map(s => r.subjects[s] ?? ''), `${avg}%`, letter, avg >= 50 ? 'Pass' : 'Fail'];
    });
    downloadCSV([header, ...rows] as string[][], `GHA_Academic_Results_${academicTerm.replace(/\s/g, '_')}.csv`);
  };

  const renderAcademicReport = () => {
    const termResults = results.filter(r => r.term === academicTerm);
    const gradeOrder = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

    const classSummary = gradeOrder.map(grade => {
      const classStudents = students.filter(s => s.grade === grade && (!s.status || s.status === 'active'));
      const classResults = termResults.filter(r => classStudents.some(s => s.id === r.studentId));
      if (classStudents.length === 0) return null;
      const avgs = classResults.map(r => {
        const vals = Object.values(r.subjects);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      });
      const classAvg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
      const passCount = avgs.filter(a => a >= 50).length;
      return { grade, total: classStudents.length, recorded: classResults.length, classAvg, passCount };
    }).filter(Boolean) as { grade: string; total: number; recorded: number; classAvg: number | null; passCount: number }[];

    const totalRecorded = termResults.length;
    const allAvgs = termResults.map(r => { const v = Object.values(r.subjects); return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : 0; });
    const overallAvg = allAvgs.length ? Math.round(allAvgs.reduce((a,b)=>a+b,0)/allAvgs.length) : 0;
    const overallPass = allAvgs.filter(a => a >= 50).length;
    const passRate = allAvgs.length ? Math.round((overallPass / allAvgs.length) * 100) : 0;

    const studentRows = termResults.map(r => {
      const student = students.find(s => s.id === r.studentId);
      const vals = Object.values(r.subjects);
      const avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
      const letter = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
      const color = avg >= 80 ? 'text-green-600' : avg >= 70 ? 'text-blue-600' : avg >= 60 ? 'text-yellow-600' : avg >= 50 ? 'text-orange-600' : 'text-red-600';
      return { student, r, avg, letter, color, passed: avg >= 50 };
    }).sort((a, b) => b.avg - a.avg);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Term:</label>
          <select value={academicTerm} onChange={e => setAcademicTerm(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            {resultTerms.length === 0
              ? <option value="">No results recorded</option>
              : resultTerms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleExportAcademic} disabled={totalRecorded === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {totalRecorded === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No results recorded for {academicTerm}.</p>
            <p className="text-sm mt-1">Enter marks in Academic Results to see data here.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Results Recorded', value: totalRecorded, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-200' },
                { label: 'Overall Average', value: `${overallAvg}%`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
                { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 70 ? 'text-green-700' : 'text-red-700', bg: passRate >= 70 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200' },
                { label: 'Passed / Total', value: `${overallPass} / ${totalRecorded}`, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
              ].map(stat => (
                <div key={stat.label} className={`border rounded-lg p-4 ${stat.bg}`}>
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Class Performance Summary</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>{['Class','Students','Results In','Class Avg','Passed','Pass Rate'].map(h =>
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    )}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classSummary.map(cls => {
                      const rate = cls.recorded > 0 ? Math.round((cls.passCount / cls.recorded) * 100) : 0;
                      return (
                        <tr key={cls.grade} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{cls.grade}</td>
                          <td className="px-4 py-2 text-gray-600">{cls.total}</td>
                          <td className="px-4 py-2 text-gray-600">{cls.recorded}/{cls.total}</td>
                          <td className={`px-4 py-2 font-semibold ${cls.classAvg === null ? 'text-gray-400' : cls.classAvg >= 50 ? 'text-blue-600' : 'text-red-600'}`}>
                            {cls.classAvg !== null ? `${cls.classAvg}%` : '—'}
                          </td>
                          <td className="px-4 py-2 text-green-600">{cls.recorded > 0 ? cls.passCount : '—'}</td>
                          <td className="px-4 py-2">
                            {cls.recorded > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${rate >= 70 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs font-medium">{rate}%</span>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Student Results (ranked by average)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>{['Rank','Student','Class','Average','Grade','Result'].map(h =>
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    )}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentRows.map(({ student, avg, letter, color, passed }, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{student?.name ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{student?.grade ?? '—'}</td>
                        <td className={`px-4 py-2 font-semibold ${color}`}>{avg}%</td>
                        <td className={`px-4 py-2 font-bold ${color}`}>{letter}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {passed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStudentReport = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Student Payment Status</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Student', 'Grade', 'Guardian', 'Total Paid', 'Pending', 'Overdue', 'Status'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => {
              const sp = termPayments.filter(p => p.studentId === student.id);
              const paid = sp.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
              const pending = sp.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
              const overdue = sp.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
              const hasBalance = pending + overdue > 0;
              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{student.grade}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{student.guardianName}</p>
                    <p className="text-xs text-gray-500">{student.guardianPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600 font-medium">K{paid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-yellow-600 font-medium">K{pending.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-red-600 font-medium">K{overdue.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${hasBalance ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {hasBalance ? 'Outstanding' : 'Up to Date'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Financial summaries and student reports</p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <select value={termFilter} onChange={e => setTermFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Terms</option>
            {allTerms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleExportFinancial}
            className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
            <FileText className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={handleExportStudents}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Students CSV</span>
          </button>
          <button onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { id: 'financial', label: 'Financial Summary', icon: DollarSign },
              { id: 'class', label: 'Class Summary', icon: BarChart3 },
              { id: 'student', label: 'Student Report', icon: FileText },
              { id: 'academic', label: 'Academic Results', icon: GraduationCap },
            ].map(tab => (
              <button key={tab.id} onClick={() => setSelectedReport(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedReport === tab.id ? `${tc.light} ${tc.text}` : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {selectedReport === 'financial' && renderFinancialReport()}
          {selectedReport === 'class' && renderClassReport()}
          {selectedReport === 'student' && renderStudentReport()}
          {selectedReport === 'academic' && renderAcademicReport()}
        </div>
      </div>
    </div>
  );
}
