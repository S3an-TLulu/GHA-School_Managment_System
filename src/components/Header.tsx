import { LogOut, School, Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';

export function Header({ onMenuClick, onGoToUsers, onGoToProfile, onNavigate }: {
  onMenuClick?: () => void;
  onGoToUsers?: (username: string) => void;
  onGoToProfile?: () => void;
  onNavigate?: (section: string) => void;
}) {
  const { logout, currentUser } = useAuth();
  const { branding, teachers } = useAppContext();
  // A user linked to a teacher record (matching full name) can show their photo
  const staffPhoto = teachers.find(t => t.name === currentUser?.fullName)?.photoUrl;

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onMenuClick && (
            <button onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          )}
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.schoolName}
              className="h-10 w-10 rounded-xl object-cover shadow-sm border border-gray-100"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: 'var(--gha-primary, #1d4ed8)' }}
            >
              <School className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{branding.schoolName}</h1>
            <p className="text-xs text-gray-500 leading-tight truncate hidden sm:block">{branding.motto || 'School Management System'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3">
          <p className="text-xs text-gray-400 hidden lg:block">
            {new Date().toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <GlobalSearch onNavigate={onNavigate} />

          <NotificationBell onGoToUsers={onGoToUsers} />

          {currentUser && (
            <button onClick={onGoToProfile}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="My profile">
              {staffPhoto ? (
                <img src={staffPhoto} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <UserCircle className="h-6 w-6 text-gray-400" />
              )}
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium text-gray-800">{currentUser.fullName}</span>
                <span className="text-[10px] text-gray-400">{currentUser.role}</span>
              </span>
            </button>
          )}

          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
