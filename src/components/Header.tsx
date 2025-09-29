import React from 'react';
import { LogOut, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <School className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Great Highway Academy</h1>
            <p className="text-sm text-gray-500">School Management System</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}