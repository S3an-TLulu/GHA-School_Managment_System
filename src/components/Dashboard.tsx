import { Users, GraduationCap, DollarSign, AlertCircle, TrendingUp, TrendingDown, Calendar, UserCheck, Bell, Check, X as XIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

export function Dashboard() {
  const { students, payments, teachers, expenses, events, announcements, results, attendance, currentTerm, branding, fundraiserParticipants, toggleFundraiserParticipant } = useAppContext();
  const tc = useThemeClasses();

  const activeStudents = students.filter(s => !s.status || s.status === 'active').length;
  const activeTeachers = teachers.filter(t => t.status === 'active').length;

  const termPayments = payments.filter(p => p.term === currentTerm);
  const totalRevenue = termPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = termPayments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = termPayments.filter(p => p.status === 'overdue').length;

  const termExpenses = expenses.filter(e => e.term === currentTerm).reduce((sum, e) => sum + e.amount, 0);
  const fundraiserIncome = fundraiserParticipants.reduce((sum, p) => sum + p.amountPaid, 0);
  const netIncome = totalRevenue + fundraiserIncome - termExpenses;

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

  // Attendance analytics over the last 30 days (present + late count as here).
  const attCutoff = new Date(); attCutoff.setDate(attCutoff.getDate() - 30);
  const recentAtt = attendance.filter(a => new Date(a.date) >= attCutoff);
  const attHere = (recs: typeof recentAtt) => recs.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = recentAtt.length ? Math.round((attHere(recentAtt) / recentAtt.length) * 100) : null;
  const attByClass = gradeOrder
    .map(g => { const recs = recentAtt.filter(a => a.classGrade === g); return { grade: g, rate: recs.length ? Math.round((attHere(recs) / recs.length) * 100) : null, marked: recs.length }; })
    .filter(x => x.rate !== null) as { grade: string; rate: number; marked: number }[];
  const lowAttendance = attByClass.filter(x => x.rate < 85);

  // Pupils falling behind in the latest results (average below the 50% pass mark).
  const failingPupils = latestResults
    .map(r => { const v = Object.values(r.subjects); const avg = v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; return { name: students.find(s => s.id === r.studentId)?.name || 'Unknown', grade: r.classGrade, avg }; })
    .filter(x => x.avg < 50)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 6);

  const activeFundraisers = events
    .filter(e => e.type === 'Fundraiser' && e.participationFee)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeStudentList = students.filter(s => !s.status || s.status === 'active');

  // Revenue vs expenses over the most recent terms, for the trend chart.
  const trendTerms = [...new Set([...payments.map(p => p.term), ...expenses.map(e => e.term)].filter(Boolean) as string[])]
    .sort().slice(-6);
  const trend = trendTerms.map(term => ({
    term,
    revenue: payments.filter(p => p.term === term && p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    expense: expenses.filter(e => e.term === term).reduce((s, e) => s + e.amount, 0),
  }));
  const trendMax = Math.max(1, ...trend.map(t => Math.max(t.revenue, t.expense)));

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
              {fundraiserIncome > 0 && (
                <p className="text-xs text-amber-600 font-medium">+ K{fundraiserIncome.toLocaleString()} fundraisers</p>
              )}
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

      {trend.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-5 w-5 ${tc.text}`} />
              <h3 className="text-base font-semibold text-gray-900">Revenue vs Expenses</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />Expenses</span>
            </div>
          </div>
          <div className="flex items-end justify-around gap-3 h-44">
            {trend.map(t => (
              <div key={t.term} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
                <div className="flex items-end gap-1 h-full w-full justify-center">
                  <div className="w-4 sm:w-6 bg-green-500 rounded-t transition-all" style={{ height: `${Math.max(2, (t.revenue / trendMax) * 100)}%` }} title={`Revenue: K${t.revenue.toLocaleString()}`} />
                  <div className="w-4 sm:w-6 bg-red-400 rounded-t transition-all" style={{ height: `${Math.max(2, (t.expense / trendMax) * 100)}%` }} title={`Expenses: K${t.expense.toLocaleString()}`} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 text-center leading-tight truncate w-full">{t.term.replace('Term ', 'T')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Attendance analytics + who needs attention */}
      {(attendanceRate !== null || failingPupils.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {attendanceRate !== null && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserCheck className={`h-5 w-5 ${tc.text}`} />
                <h3 className="text-base font-semibold text-gray-900">Attendance</h3>
                <span className="text-xs text-gray-400 ml-1">— last 30 days</span>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className={`text-4xl font-bold ${attendanceRate >= 90 ? 'text-green-600' : attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>{attendanceRate}%</p>
                  <p className="text-xs text-gray-500">overall present rate ({recentAtt.length} marks)</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {attByClass.map(c => (
                  <div key={c.grade} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{c.grade}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${c.rate >= 90 ? 'bg-green-500' : c.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.rate}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-9 text-right">{c.rate}%</span>
                  </div>
                ))}
                {attByClass.length === 0 && <p className="text-sm text-gray-400">No attendance marked in the last 30 days.</p>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold text-gray-900">Needs Attention</h3>
            </div>
            <div className="space-y-4">
              {lowAttendance.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Low attendance (&lt;85%)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lowAttendance.map(c => <span key={c.grade} className="text-xs bg-red-50 text-red-700 rounded-full px-2.5 py-1">{c.grade} · {c.rate}%</span>)}
                  </div>
                </div>
              )}
              {failingPupils.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Pupils below pass mark — {latestResultTerm}</p>
                  <div className="space-y-1">
                    {failingPupils.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-800">{p.name} <span className="text-gray-400 text-xs">· {p.grade}</span></span>
                        <span className="font-semibold text-red-600">{p.avg}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {overdueCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Fees</p>
                  <p className="text-sm text-gray-700">{overdueCount} overdue payment{overdueCount !== 1 ? 's' : ''} this term (K{totalPending.toLocaleString()} outstanding).</p>
                </div>
              )}
              {lowAttendance.length === 0 && failingPupils.length === 0 && overdueCount === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">All clear — nothing flagged right now. 🎉</p>
              )}
            </div>
          </div>
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
