import { Student, useAppContext } from '../context/AppContext';
import { X, User, Printer, GraduationCap, FileDown } from 'lucide-react';
import { printHtml, exportPdf } from '../lib/print';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { PersonDocuments } from './PersonDocs';

function getGrade(mark: number): { letter: string; color: string } {
  if (mark >= 80) return { letter: 'A', color: 'text-green-600' };
  if (mark >= 70) return { letter: 'B', color: 'text-blue-600' };
  if (mark >= 60) return { letter: 'C', color: 'text-yellow-600' };
  if (mark >= 50) return { letter: 'D', color: 'text-orange-600' };
  return { letter: 'F', color: 'text-red-600' };
}

interface StudentProfileProps {
  student: Student;
  onClose: () => void;
}

export function StudentProfile({ student, onClose }: StudentProfileProps) {
  const { payments, uniforms, requirements, results } = useAppContext();
  const tc = useThemeClasses();

  const studentPayments = payments.filter(p => p.studentId === student.id);
  const studentUniforms = uniforms.filter(u => u.studentId === student.id);
  const studentRequirements = requirements.filter(r => r.studentId === student.id);
  const studentResults = results
    .filter(r => r.studentId === student.id)
    .sort((a, b) => b.term.localeCompare(a.term));

  const totalPaid = studentPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = studentPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = studentPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const uniformSpend = studentUniforms.reduce((s, u) => s + u.price, 0);
  const requirementsDone = studentRequirements.filter(r => r.status === 'provided').length;

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    transferred: 'bg-yellow-100 text-yellow-800'
  };

  const paymentStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const handlePrint = (pdf = false) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Profile - ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; }
          .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 24px; }
          .school-name { font-size: 22px; font-weight: bold; color: #1d4ed8; }
          .school-sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .profile-title { font-size: 18px; font-weight: bold; margin-top: 8px; color: #111827; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .field { margin-bottom: 8px; }
          .field-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .field-value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; }
          td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
          .paid { background: #d1fae5; color: #065f46; }
          .pending { background: #fef3c7; color: #92400e; }
          .overdue { background: #fee2e2; color: #991b1b; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
          .summary-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
          .summary-value { font-size: 16px; font-weight: bold; color: #111827; margin-top: 2px; }
          .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-line { border-top: 1px solid #374151; padding-top: 6px; font-size: 11px; color: #6b7280; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">Great Highway Academy</div>
          <div class="school-sub">Lusaka, Zambia | Tel: +260-XXX-XXXXXX | gha.edu.zm</div>
          <div class="profile-title">STUDENT PROFILE REPORT</div>
        </div>

        <div class="summary">
          <div class="summary-card"><div class="summary-label">Total Paid</div><div class="summary-value" style="color:#059669">K${totalPaid.toLocaleString()}</div></div>
          <div class="summary-card"><div class="summary-label">Pending</div><div class="summary-value" style="color:#d97706">K${totalPending.toLocaleString()}</div></div>
          <div class="summary-card"><div class="summary-label">Overdue</div><div class="summary-value" style="color:#dc2626">K${totalOverdue.toLocaleString()}</div></div>
          <div class="summary-card"><div class="summary-label">Uniform Spend</div><div class="summary-value">K${uniformSpend.toLocaleString()}</div></div>
        </div>

        <div class="grid-2">
          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="field"><div class="field-label">Full Name</div><div class="field-value">${student.name}</div></div>
            <div class="field"><div class="field-label">Admission Number</div><div class="field-value">${student.admissionNumber || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Grade / Class</div><div class="field-value">${student.grade}</div></div>
            <div class="field"><div class="field-label">Gender</div><div class="field-value">${student.gender || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Date of Birth</div><div class="field-value">${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</div></div>
            <div class="field"><div class="field-label">Enrollment Date</div><div class="field-value">${new Date(student.enrollmentDate).toLocaleDateString()}</div></div>
            <div class="field"><div class="field-label">Status</div><div class="field-value">${student.status || 'active'}</div></div>
          </div>
          <div class="section">
            <div class="section-title">Guardian & Contact</div>
            <div class="field"><div class="field-label">Guardian Name</div><div class="field-value">${student.guardianName}</div></div>
            <div class="field"><div class="field-label">Phone</div><div class="field-value">${student.guardianPhone}</div></div>
            <div class="field"><div class="field-label">Email</div><div class="field-value">${student.guardianEmail || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Address</div><div class="field-value">${student.address || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment History</div>
          <table>
            <thead><tr><th>Type</th><th>Term</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>
              ${studentPayments.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#9ca3af">No payment records</td></tr>' :
                studentPayments.map(p => `<tr>
                  <td>${p.type}</td>
                  <td>${p.term || '—'}</td>
                  <td>K${p.amount.toLocaleString()}</td>
                  <td>${new Date(p.dueDate).toLocaleDateString()}</td>
                  <td><span class="badge ${p.status}">${p.status}</span></td>
                  <td>${p.receiptNumber || '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        ${studentUniforms.length > 0 ? `
        <div class="section">
          <div class="section-title">Uniform Purchases</div>
          <table>
            <thead><tr><th>Item</th><th>Price</th><th>Purchase Date</th></tr></thead>
            <tbody>
              ${studentUniforms.map(u => `<tr><td>${u.item}</td><td>K${u.price.toLocaleString()}</td><td>${new Date(u.purchaseDate).toLocaleDateString()}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <div class="footer">
          <div><div class="sig-line">Prepared By / Signature</div></div>
          <div><div class="sig-line">Date: ${new Date().toLocaleDateString()}</div></div>
        </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body>
      </html>
    `;
    if (pdf) exportPdf(printContent, `Student_Profile_${student.name}`);
    else printHtml(printContent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${tc.light} rounded-full flex items-center justify-center`}>
              {student.photoUrl
                ? <img src={student.photoUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                : <span className={`text-xl font-bold ${tc.text}`}>{student.name.charAt(0)}</span>}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
              <div className="flex items-center space-x-2 mt-0.5">
                {student.admissionNumber && (
                  <span className="text-xs text-gray-500">{student.admissionNumber}</span>
                )}
                <span className="text-xs text-gray-400">&bull;</span>
                <span className="text-xs text-gray-500">{student.grade}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handlePrint()}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <Printer className="h-4 w-4" />
              <span>Print Profile</span>
            </button>
            <button onClick={() => handlePrint(true)} title="Export profile to PDF"
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <FileDown className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Paid', value: `K${totalPaid.toLocaleString()}`, color: 'text-green-600' },
              { label: 'Pending', value: `K${totalPending.toLocaleString()}`, color: 'text-yellow-600' },
              { label: 'Overdue', value: `K${totalOverdue.toLocaleString()}`, color: 'text-red-600' },
              { label: 'Uniform Spend', value: `K${uniformSpend.toLocaleString()}`, color: 'text-gray-900' },
              { label: 'Requirements Done', value: `${requirementsDone}/${studentRequirements.length}`, color: 'text-blue-600' }
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Gender', value: student.gender || 'N/A' },
                  { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A' },
                  { label: 'Enrollment Date', value: new Date(student.enrollmentDate).toLocaleDateString() },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-gray-500">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900">{f.value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[student.status || 'active']}`}>
                    {(student.status || 'active').charAt(0).toUpperCase() + (student.status || 'active').slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Guardian & Contact</h3>
              <div className="space-y-3">
                {[
                  { label: 'Guardian Name', value: student.guardianName },
                  { label: 'Phone', value: student.guardianPhone },
                  { label: 'Email', value: student.guardianEmail || 'N/A' },
                  { label: 'Address', value: student.address || 'N/A' }
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-gray-500">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Payment History</h3>
            {studentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No payment records</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Type', 'Term', 'Amount', 'Due Date', 'Status', 'Receipt'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentPayments.map(p => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-gray-900">{p.type}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{p.term || '—'}</td>
                        <td className="px-3 py-2 font-bold text-gray-900">K{p.amount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{new Date(p.dueDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColors[p.status]}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{p.receiptNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {studentUniforms.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Uniforms Purchased</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {studentUniforms.map(u => (
                  <div key={u.id} className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900">{u.item}</p>
                    <p className="text-xs text-blue-600">K{u.price.toLocaleString()} &bull; {new Date(u.purchaseDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Academic Results</span>
            </h3>
            {studentResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No results recorded</p>
            ) : (
              <div className="space-y-3">
                {studentResults.map(r => {
                  const vals = Object.values(r.subjects);
                  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                  const { letter, color } = getGrade(avg);
                  return (
                    <div key={r.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{r.term}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Avg: {avg}%</span>
                          <span className={`text-sm font-bold ${color}`}>{letter}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avg >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {avg >= 50 ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(r.subjects).map(([sub, mark]) => {
                          const g = getGrade(mark);
                          return (
                            <span key={sub} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-0.5">
                              <span className="text-gray-600">{sub}</span>
                              <span className="font-semibold text-gray-900">{mark}%</span>
                              <span className={`font-bold ${g.color}`}>{g.letter}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents — dedicated folders for this student */}
          <div className="mt-6">
            <PersonDocuments ownerType="student" ownerId={student.id} title={`${student.name} — Documents`} />
          </div>
        </div>
      </div>
    </div>
  );
}
