import { useState, useRef, useEffect } from 'react';
import { Bell, KeyRound, UserPlus, Info, Check, Trash2, X } from 'lucide-react';
import { useAuth, AuthClaim } from '../context/AuthContext';

const ICONS: Record<AuthClaim['type'], typeof KeyRound> = {
  'forgot-password': KeyRound,
  'access-request': UserPlus,
  'info': Info,
};

// Admin-only notification bell (top-right). Shows password-reset claims and
// other requests; clicking a claim jumps to Settings → Users to act on it.
export function NotificationBell({ onGoToUsers }: { onGoToUsers?: (username: string) => void }) {
  const { currentUser, claims, resolveClaim, clearResolvedClaims } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (currentUser?.role !== 'Admin') return null;

  const unresolved = claims.filter(c => !c.resolved);
  const badge = unresolved.length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        title="Notifications">
        <Bell className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Notifications</p>
            <div className="flex items-center gap-2">
              {claims.some(c => c.resolved) && (
                <button onClick={clearResolvedClaims} className="text-xs text-gray-400 hover:text-gray-600">Clear read</button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {claims.length === 0 ? (
              <p className="px-4 py-10 text-sm text-gray-400 text-center">No notifications yet.</p>
            ) : claims.map(c => {
              const Icon = ICONS[c.type] || Info;
              return (
                <div key={c.id} className={`px-4 py-3 flex items-start gap-3 ${c.resolved ? 'opacity-50' : 'bg-blue-50/40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.resolved ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{c.username}</span>
                      {c.type === 'forgot-password' && ' — password reset request'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString('en-ZM', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    {!c.resolved && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { onGoToUsers?.(c.username); resolveClaim(c.id); setOpen(false); }}
                          className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded px-2.5 py-1">
                          Reset in Users
                        </button>
                        <button onClick={() => resolveClaim(c.id)}
                          className="text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 rounded px-2 py-1 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Mark done
                        </button>
                      </div>
                    )}
                  </div>
                  {c.resolved && <Trash2 className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-1" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
