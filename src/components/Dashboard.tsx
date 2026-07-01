import { Users, GraduationCap, DollarSign, AlertCircle, TrendingUp, TrendingDown, Calendar, UserCheck, Bell, Check, X as XIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

export function Dashboard() {
  const { students, payments, teachers, expenses, events, announcements, results, currentTerm, branding, fundraiserParticipants, toggleFundraiserParticipant } = useAppContext();
  const tc = useThemeClasses();

  const activeStudents = students.filter(s => !s.status || s.status === 'active').length;
  const activeTeachers = teachers.filter(t => t.status === 'active').length;

  const termPayments = payments.filter(p => p.term === currentTerm);
  const totalRevenue = termPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = termPayments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = termPayments.filter(p => p.status === 'overdue').length;

  const termExpenses = expenses.filter(e => e.term === currentTerm).reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - termExpenses;

  const collectionRate = totalRevenue + totalPending > 0
    ? Math.round((totalRevenue / (totalRevenue + totalPending)) * 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const recentStudents = [...students]
    .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
    .slice(0, 5);

  const recentAnnouncements = [...announcements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const gradeCounts = students.reduce((acc, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeOrder = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

  const latestResultTerm = [...new Set(results.map(r => r.term))].sort().reverse()[0];
  const latestResults = latestResultTerm ? results.filter(r => r.term === latestResultTerm) : [];
  const resultAvgs = latestResults.map(r => { const v = Object.values(r.subjects); return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : 0; });
  const academicPassRate = resultAvgs.length ? Math.round((resultAvgs.filter(a => a >= 50).length / resultAvgs.length) * 100) : null;
  const academicAvg = resultAvgs.length ? Math.round(resultAvgs.reduce((a,b)=>a+b,0)/resultAvgs.length) : null;

  const activeFundraisers = events
    .filter(e => e.type === 'Fundraiser' && e.participationFee)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeStudentList = students.filter(s => !s.status || s.status === 'active');

  const priorityDot: Record<string, string> = {
    normal: 'bg-blue-400',
    important: 'bg-yellow-400',
    urgent: 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{branding.schoolName} — {currentTerm}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className={`${tc.light} p-2.5 rounded-lg`}><Users className={`h-5 w-5 ${tc.text}`} /></div>
            <div>
              <p className="text-xs text-gray-500">Students</p>
              <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-50 p-2.5 rounded-lg"><UserCheck className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Staff</p>
              <p className="text-2xl font-bold text-gray-900">{activeTeachers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-green-50 p-2.5 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Revenue ({currentTerm})</p>
              <p className="text-xl font-bold text-gray-900">K{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className={`${overdueCount > 0 ? 'bg-red-50' : 'bg-orange-50'} p-2.5 rounded-lg`}>
              <AlertCircle className={`h-5 w-5 ${overdueCount > 0 ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending/Overdue</p>
              <p className="text-xl font-bold text-gray-900">K{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Collection Rate</p>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{collectionRate}%</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">of {currentTerm} fees collected</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Term Expenses</p>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">K{termExpenses.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Net: K{netIncome.toLocaleString()} {netIncome >= 0 ? '▲' : '▼'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
          <p className="text-xs text-gray-400 mt-1">payment{overdueCount !== 1 ? 's' : ''} overdue this term</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className={`h-5 w-5 ${tc.text}`} />
            <h3 className="text-base font-semibold text-gray-900">Students by Class</h3>
          </div>
          <div className="space-y-2">
            {gradeOrder.filter(g => gradeCounts[g]).map(grade => (
              <div key={grade} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{grade}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div className={`${tc.btn.split(' ')[0]} h-1.5 rounded-full`}
                      style={{ width: `${Math.min(100, ((gradeCounts[grade] || 0) / activeStudents) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-4">{gradeCounts[grade] || 0}</span>
                </div>
              </div>
            ))}
            {Object.keys(gradeCounts).length === 0 && (
              <p className="text-sm text-gray-400">No students enrolled yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className={`h-5 w-5 ${tc.text}`} />
            <h3 className="text-base font-semibold text-gray-900">Recent Enrolments</h3>
          </div>
          <div className="space-y-3">
            {recentStudents.map(student => (
              <div key={student.id} className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${tc.light} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-xs font-semibold ${tc.text}`}>{student.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.grade}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(student.enrollmentDate).toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
            {recentStudents.length === 0 && <p className="text-sm text-gray-400">No students enrolled.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className={`h-5 w-5 ${tc.text}`} />
            <h3 className="text-base font-semibold text-gray-900">Upcoming Events</h3>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-10 h-10 ${tc.light} rounded-lg flex flex-col items-center justify-center`}>
                  <span className={`text-xs font-bold ${tc.text}`}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className={`text-sm font-bold ${tc.text} leading-none`}>{new Date(event.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.type} &bull; {event.targetAudience}</p>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && <p className="text-sm text-gray-400">No upcoming events.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className={`h-5 w-5 ${tc.text}`} />
          <h3 className="text-base font-semibold text-gray-900">Recent Announcements</h3>
        </div>
        {recentAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-400">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map(ann => (
              <div key={ann.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${priorityDot[ann.priority]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{ann.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{ann.targetAudience}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ann.date).toLocaleDateString('en-ZM', { month: 'short', day: 'numeric', year: 'numeric' })}
                    &nbsp;&bull;&nbsp;{ann.createdBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {academicPassRate !== null && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className={`h-5 w-5 ${tc.text}`} />
            <h3 className="text-base font-semibold text-gray-900">Academic Performance</h3>
            <span className="text-xs text-gray-400 ml-1">— {latestResultTerm}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Results Recorded</p>
              <p className="text-2xl font-bold text-gray-900">{latestResults.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-600 mb-1">Overall Average</p>
              <p className="text-2xl font-bold text-blue-700">{academicAvg}%</p>
            </div>
            <div className={`${academicPassRate >= 70 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
              <p className={`text-xs mb-1 ${academicPassRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>Pass Rate</p>
              <p className={`text-2xl font-bold ${academicPassRate >= 70 ? 'text-green-700' : 'text-red-700'}`}>{academicPassRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Students Passed</p>
              <p className="text-2xl font-bold text-gray-900">{resultAvgs.filter(a => a >= 50).length}/{latestResults.length}</p>
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${academicPassRate >= 70 ? 'bg-green-500' : academicPassRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${academicPassRate}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{academicPassRate}% of students passed in {latestResultTerm}</p>
        </div>
      )}

      {activeFundraisers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-5">
            <DollarSign className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-semibold text-gray-900">Fundraiser Fee Tracker</h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{activeFundraisers.length} active</span>
          </div>
          <div className="space-y-6">
            {activeFundraisers.map(ev => {
              const paid = fundraiserParticipants.filter(p => p.eventId === ev.id);
              const paidIds = new Set(paid.map(p => p.studentId));
              const collected = paid.reduce((s, p) => s + p.amountPaid, 0);
              const target = ev.participationFee! * (ev.expectedParticipants ?? activeStudentList.length);
              const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
              const isPast = new Date(ev.date) < today;

              return (
                <div key={ev.id} className="border border-amber-100 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-amber-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">{ev.title}</p>
                      <p className="text-xs text-amber-700">
                        {new Date(ev.date).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {ev.collectionStartDate && ev.collectionEndDate && (
                          <> &bull; Collection: {new Date(ev.collectionStartDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })} – {new Date(ev.collectionEndDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}</>
                        )}
                        {isPast && <span className="ml-2 text-gray-500">(Past)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-900">K{collected.toLocaleString()} / K{target.toLocaleString()}</p>
                      <p className="text-xs text-amber-700">{paidIds.size} of {ev.expectedParticipants ?? activeStudentList.length} paid &bull; K{ev.participationFee}/person</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="px-4 pt-2 pb-1">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct}% of target collected</p>
                  </div>
                  {/* Student list */}
                  <div className="px-4 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-2">Students</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {activeStudentList.map(student => {
                        const hasPaid = paidIds.has(student.id);
                        return (
                          <button key={student.id}
                            onClick={() => toggleFundraiserParticipant(ev.id, student.id, ev.participationFee!)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                              hasPaid
                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}>
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${hasPaid ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {hasPaid ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                              </span>
                              <span className="text-sm text-gray-900 truncate">{student.name}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-500">{student.grade}</span>
                              {hasPaid && <span className="ml-2 text-xs font-semibold text-green-700">K{ev.participationFee}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Banking Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Bank', value: branding.bankName },
            { label: 'Branch', value: branding.bankBranch },
            { label: 'Account Name', value: branding.schoolName },
            { label: 'Account No.', value: branding.bankAccountNumber },
            { label: 'Currency', value: 'Zambian Kwacha (ZMW)' }
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
