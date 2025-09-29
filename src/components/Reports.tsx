import React, { useState } from 'react';
import { BarChart3, Download, FileText, DollarSign } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Reports() {
  const { students, payments, uniforms, requirements } = useAppContext();
  const [selectedReport, setSelectedReport] = useState('financial');

  const getTotalRevenue = () => {
    return payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  };

  const getPendingAmount = () => {
    return payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  };

  const getUniformRevenue = () => {
    return uniforms.reduce((sum, u) => sum + u.price, 0);
  };

  const getClassSummary = () => {
    const summary: { [key: string]: { students: number; paid: number; pending: number } } = {};
    
    students.forEach(student => {
      if (!summary[student.grade]) {
        summary[student.grade] = { students: 0, paid: 0, pending: 0 };
      }
      summary[student.grade].students++;
      
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const paidAmount = studentPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = studentPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
      
      summary[student.grade].paid += paidAmount;
      summary[student.grade].pending += pendingAmount;
    });
    
    return summary;
  };

  const handleExport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
    // In a real app, this would generate and download the file
  };

  const renderFinancialReport = () => {
    const totalRevenue = getTotalRevenue();
    const pendingAmount = getPendingAmount();
    const uniformRevenue = getUniformRevenue();

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">K{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-900">K{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Uniform Sales</p>
                <p className="text-2xl font-bold text-blue-900">K{uniformRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
          <div className="space-y-3">
            {payments.reduce((acc, payment) => {
              const existing = acc.find(item => item.type === payment.type);
              if (existing) {
                existing.amount += payment.amount;
                existing.count += 1;
              } else {
                acc.push({ type: payment.type, amount: payment.amount, count: 1 });
              }
              return acc;
            }, [] as any[]).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-900">{item.type}</span>
                  <span className="text-sm text-gray-500 ml-2">({item.count} payments)</span>
                </div>
                <span className="font-bold text-gray-900">K{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderClassReport = () => {
    const classSummary = getClassSummary();

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Class-wise Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(classSummary).map(([grade, data]) => (
                <tr key={grade}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    K{data.paid.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                    K{data.pending.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStudentReport = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Payment Status</h3>
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
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => {
                const studentPayments = payments.filter(p => p.studentId === student.id);
                const totalPaid = studentPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
                const totalPending = studentPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
                const status = totalPending > 0 ? 'Outstanding' : 'Up to Date';
                
                return (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.guardianName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      K{totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      K{totalPending.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        status === 'Up to Date' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Financial summaries and student reports</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedReport('financial')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedReport === 'financial'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Financial Summary
            </button>
            <button
              onClick={() => setSelectedReport('class')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedReport === 'class'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Class Summary
            </button>
            <button
              onClick={() => setSelectedReport('student')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedReport === 'student'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student Report
            </button>
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