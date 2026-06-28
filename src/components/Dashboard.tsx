import { Users, GraduationCap, DollarSign, AlertCircle, TrendingUp, TrendingDown, Calendar, UserCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Dashboard() {
  const { students, payments, teachers, expenses, events, currentTerm } = useAppContext();

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

  const gradeCounts = students.reduce((acc, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeOrder = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Great Highway Academy — {currentTerm}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-2.5 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
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
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Students by Class</h3>
          </div>
          <div className="space-y-2">
            {gradeOrder.filter(g => gradeCounts[g]).map(grade => (
              <div key={grade} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{grade}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full"
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
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Recent Enrolments</h3>
          </div>
          <div className="space-y-3">
            {recentStudents.map(student => (
              <div key={student.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-700">{student.name.charAt(0)}</span>
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
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Upcoming Events</h3>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-blue-800 leading-none">{new Date(event.date).getDate()}</span>
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
        <h3 className="text-base font-semibold text-gray-900 mb-4">Banking Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Bank', value: 'First Alliance Bank' },
            { label: 'Branch', value: 'East Park Branch' },
            { label: 'Account Name', value: 'Great Highway Academy' },
            { label: 'Account No.', value: '0060700054001' },
            { label: 'Currency', value: 'Zambian Kwacha (ZMW)' }
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
