import { LogOut, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

export function Header() {
  const { logout } = useAuth();
  const { branding } = useAppContext();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
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
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{branding.schoolName}</h1>
            <p className="text-xs text-gray-500 leading-tight">{branding.motto || 'School Management System'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <p className="text-xs text-gray-400 hidden md:block">
            {new Date().toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
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
