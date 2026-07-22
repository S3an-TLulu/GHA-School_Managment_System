import React, { useState } from 'react';
import { School, Lock, User, ArrowLeft, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onBack?: () => void;
  onPortal?: () => void;
}

export function Login({ onBack, onPortal }: LoginProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { login, fileClaim } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await login(credentials.username, credentials.password);
    if (!res.ok) setError(res.error || 'Invalid username/email or password.');
    setIsLoading(false);
  };

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotName.trim()) return;
    fileClaim('forgot-password', forgotName.trim(),
      forgotMsg.trim() || 'Requested a password reset from the login screen.');
    setForgotSent(true);
    setForgotName(''); setForgotMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to website
          </button>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <School className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Great Highway Academy</h1>
          <p className="text-gray-600 mt-2">School Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username or email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center -mt-2">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => { setForgotOpen(true); setForgotSent(false); }}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <HelpCircle className="h-4 w-4" /> Forgot password?
          </button>
        </div>
        {onPortal && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-1">Are you a parent or guardian?</p>
            <button onClick={onPortal} className="text-sm font-medium text-blue-600 hover:underline">Check your child's account →</button>
          </div>
        )}
      </div>

      {/* Forgot-password claim modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Request Password Reset</h2>
              <button onClick={() => setForgotOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            {forgotSent ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-700">Your request has been sent to the school administrator.</p>
                <p className="text-xs text-gray-500 mt-2">They'll see it in their notifications and can reset your password or share a master code.</p>
                <button onClick={() => setForgotOpen(false)}
                  className="mt-4 px-4 py-2 gha-primary-btn text-white rounded-lg text-sm font-medium">Done</button>
              </div>
            ) : (
              <form className="p-5 space-y-4" onSubmit={submitForgot}>
                <p className="text-sm text-gray-500">This sends a request to the administrator — they'll reset your access. No email is sent automatically.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Username *</label>
                  <input required value={forgotName} onChange={e => setForgotName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="The username you sign in with" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <input value={forgotMsg} onChange={e => setForgotMsg(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Forgot my password after the holidays" />
                </div>
                <div className="flex space-x-3 pt-1">
                  <button type="button" onClick={() => setForgotOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">Send Request</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
