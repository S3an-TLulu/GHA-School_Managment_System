import { useState } from 'react';
import { BarChart3, Download, FileText, DollarSign, TrendingDown, Printer } from 'lucide-react';
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
  const { students, payments, uniforms, expenses, currentTerm } = useAppContext();
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
              { id: 'student', label: 'Student Report', icon: FileText }
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
        </div>
      </div>
    </div>
  );
}
