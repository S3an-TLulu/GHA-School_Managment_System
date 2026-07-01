import { useState } from 'react';
import { Search, Printer, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

interface FamilyGroup {
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  students: Array<{
    id: string;
    name: string;
    grade: string;
  }>;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

export function FamilyStatements() {
  const { students, payments } = useAppContext();
  const tc = useThemeClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  const families: FamilyGroup[] = [];
  const guardianMap = new Map<string, FamilyGroup>();

  students.forEach(student => {
    const key = `${student.guardianName}-${student.guardianPhone}`;
    if (!guardianMap.has(key)) {
      guardianMap.set(key, {
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        students: [],
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0
      });
    }
    const family = guardianMap.get(key)!;
    family.students.push({ id: student.id, name: student.name, grade: student.grade });

    const studentPayments = payments.filter(p => p.studentId === student.id);
    family.totalPaid += studentPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    family.totalPending += studentPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    family.totalOverdue += studentPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  });

  guardianMap.forEach(family => families.push(family));

  const filtered = families.filter(f =>
    f.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.guardianPhone.includes(searchTerm) ||
    f.students.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrint = (family: FamilyGroup) => {
    const studentRows = family.students.map(s => {
      const sp = payments.filter(p => p.studentId === s.id);
      const paid = sp.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const pending = sp.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
      const overdue = sp.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd">${s.name}</td>
          <td style="padding:8px;border:1px solid #ddd">${s.grade}</td>
          <td style="padding:8px;border:1px solid #ddd;color:#16a34a">K${paid.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #ddd;color:#d97706">K${pending.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #ddd;color:#dc2626">K${overdue.toLocaleString()}</td>
        </tr>`;
    }).join('');

    const paymentRows = family.students.flatMap(s =>
      payments.filter(p => p.studentId === s.id).map(p => `
        <tr>
          <td style="padding:6px;border:1px solid #eee">${s.name}</td>
          <td style="padding:6px;border:1px solid #eee">${p.type}</td>
          <td style="padding:6px;border:1px solid #eee">${p.term || '—'}</td>
          <td style="padding:6px;border:1px solid #eee">K${p.amount.toLocaleString()}</td>
          <td style="padding:6px;border:1px solid #eee;color:${p.status === 'paid' ? '#16a34a' : p.status === 'overdue' ? '#dc2626' : '#d97706'}">
            ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}
          </td>
          <td style="padding:6px;border:1px solid #eee">${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
        </tr>`)
    ).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Family Statement - ${family.guardianName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #222; }
          h1 { color: #1d4ed8; }
          h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
          table { width:100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #1d4ed8; color: white; padding: 8px; text-align: left; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .school-info { text-align: right; }
          .summary { display: flex; gap: 16px; margin: 16px 0; }
          .summary-box { padding: 12px 20px; border-radius: 8px; flex: 1; text-align: center; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Great Highway Academy</h1>
            <p style="color:#6b7280">Family Payment Statement</p>
            <p style="color:#6b7280">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="school-info">
            <p><strong>First Alliance Bank</strong></p>
            <p>East Park Branch</p>
            <p>Acc: 0060700054001</p>
          </div>
        </div>

        <h2>Guardian Details</h2>
        <p><strong>Name:</strong> ${family.guardianName}</p>
        <p><strong>Phone:</strong> ${family.guardianPhone}</p>
        ${family.guardianEmail ? `<p><strong>Email:</strong> ${family.guardianEmail}</p>` : ''}

        <div class="summary">
          <div class="summary-box" style="background:#dcfce7;color:#166534">
            <div style="font-size:12px">Total Paid</div>
            <div style="font-size:20px;font-weight:bold">K${family.totalPaid.toLocaleString()}</div>
          </div>
          <div class="summary-box" style="background:#fef9c3;color:#854d0e">
            <div style="font-size:12px">Pending</div>
            <div style="font-size:20px;font-weight:bold">K${family.totalPending.toLocaleString()}</div>
          </div>
          <div class="summary-box" style="background:#fee2e2;color:#991b1b">
            <div style="font-size:12px">Overdue</div>
            <div style="font-size:20px;font-weight:bold">K${family.totalOverdue.toLocaleString()}</div>
          </div>
        </div>

        <h2>Children Summary</h2>
        <table>
          <thead><tr>
            <th>Student Name</th><th>Grade</th><th>Paid</th><th>Pending</th><th>Overdue</th>
          </tr></thead>
          <tbody>${studentRows}</tbody>
        </table>

        <h2>Detailed Payment History</h2>
        <table>
          <thead><tr>
            <th>Student</th><th>Payment Type</th><th>Term</th><th>Amount</th><th>Status</th><th>Date Paid</th>
          </tr></thead>
          <tbody>${paymentRows}</tbody>
        </table>

        <p style="color:#6b7280;font-size:12px;margin-top:30px">
          This is a computer-generated statement from Great Highway Academy School Management System.
        </p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const totalOutstanding = families.reduce((sum, f) => sum + f.totalPending + f.totalOverdue, 0);
  const familiesWithBalance = families.filter(f => f.totalPending + f.totalOverdue > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Statements</h1>
        <p className="text-gray-600">View and print payment statements grouped by family</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Families</p>
          <p className="text-2xl font-bold text-gray-900">{families.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Families with Outstanding Balance</p>
          <p className="text-2xl font-bold text-yellow-900">{familiesWithBalance}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-900">K{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by guardian name, phone or student name..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filtered.map(family => {
            const key = `${family.guardianName}-${family.guardianPhone}`;
            const isExpanded = expandedFamily === key;
            const totalBalance = family.totalPending + family.totalOverdue;

            return (
              <div key={key} className="p-4">
                <div className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedFamily(isExpanded ? null : key)}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{family.guardianName}</p>
                      <p className="text-sm text-gray-500">{family.guardianPhone} &bull; {family.students.length} child{family.students.length !== 1 ? 'ren' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-green-600 font-medium">Paid: K{family.totalPaid.toLocaleString()}</p>
                      <p className={`text-sm font-medium ${totalBalance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        Balance: K{totalBalance.toLocaleString()}
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handlePrint(family); }}
                      className={`flex items-center space-x-1 px-3 py-1.5 ${tc.btn} text-white text-sm rounded-lg transition-colors`}>
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </button>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pl-13">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600">Paid</p>
                        <p className="font-bold text-green-800">K{family.totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-yellow-600">Pending</p>
                        <p className="font-bold text-yellow-800">K{family.totalPending.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-red-600">Overdue</p>
                        <p className="font-bold text-red-800">K{family.totalOverdue.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {family.students.map(student => {
                        const studentPayments = payments.filter(p => p.studentId === student.id);
                        return (
                          <div key={student.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                            <p className="text-sm font-medium text-gray-900 mb-2">{student.name} — <span className="text-gray-500">{student.grade}</span></p>
                            {studentPayments.length === 0 ? (
                              <p className="text-xs text-gray-400">No payment records</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-500">
                                      <td className="pr-4 pb-1">Type</td>
                                      <td className="pr-4 pb-1">Term</td>
                                      <td className="pr-4 pb-1">Amount</td>
                                      <td className="pb-1">Status</td>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {studentPayments.map(p => (
                                      <tr key={p.id}>
                                        <td className="pr-4 py-0.5">{p.type}</td>
                                        <td className="pr-4 py-0.5 text-gray-500">{p.term || '—'}</td>
                                        <td className="pr-4 py-0.5 font-medium">K{p.amount.toLocaleString()}</td>
                                        <td className="py-0.5">
                                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            p.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            p.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>{p.status}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-500">No families found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
