import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const CONFIG: Record<ToastType, { icon: React.ReactNode; bar: string; bg: string; text: string }> = {
  success: { icon: <CheckCircle2 className="h-5 w-5 flex-shrink-0" />, bar: 'bg-green-500', bg: 'bg-white', text: 'text-green-700' },
  error:   { icon: <XCircle       className="h-5 w-5 flex-shrink-0" />, bar: 'bg-red-500',   bg: 'bg-white', text: 'text-red-700'   },
  warning: { icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />, bar: 'bg-amber-400', bg: 'bg-white', text: 'text-amber-700' },
  info:    { icon: <Info          className="h-5 w-5 flex-shrink-0" />, bar: 'bg-blue-500',  bg: 'bg-white', text: 'text-blue-700'  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '22rem' }}>
        {toasts.map(t => {
          const cfg = CONFIG[t.type];
          return (
            <div key={t.id}
              className={`pointer-events-auto flex items-start overflow-hidden rounded-xl shadow-lg border border-gray-100 ${cfg.bg}`}
              style={{ animation: 'gha-slide-in 0.2s ease-out' }}>
              <div className={`w-1 self-stretch flex-shrink-0 ${cfg.bar}`} />
              <div className={`flex items-start space-x-3 px-4 py-3 flex-1 ${cfg.text}`}>
                {cfg.icon}
                <p className="text-sm font-medium text-gray-800 flex-1 leading-snug">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 -mt-0.5 flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes gha-slide-in {
          from { opacity: 0; transform: translateX(1rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
