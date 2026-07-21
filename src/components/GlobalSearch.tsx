import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Users, UserCheck, BookOpen, CornerDownLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface Result {
  id: string;
  label: string;
  sub: string;
  section: string;
  icon: typeof Users;
}

// A quick "find anything" box in the header. Searches students, staff and
// library books; picking a result jumps to that section. Opens on click or ⌘/Ctrl-K.
export function GlobalSearch({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { students, teachers, libraryBooks } = useAppContext();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 20); else { setQ(''); setActive(0); } }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: Result[] = [];
    for (const s of students) {
      if (s.name.toLowerCase().includes(term) || (s.admissionNumber || '').toLowerCase().includes(term) || s.grade.toLowerCase().includes(term)) {
        out.push({ id: `s-${s.id}`, label: s.name, sub: `Student · ${s.grade}`, section: 'students', icon: Users });
      }
      if (out.length > 40) break;
    }
    for (const t of teachers) {
      if (t.name.toLowerCase().includes(term) || (t.subject || '').toLowerCase().includes(term)) {
        out.push({ id: `t-${t.id}`, label: t.name, sub: `Staff · ${t.role}`, section: 'teachers', icon: UserCheck });
      }
    }
    for (const b of libraryBooks) {
      if (b.title.toLowerCase().includes(term) || (b.author || '').toLowerCase().includes(term)) {
        out.push({ id: `b-${b.id}`, label: b.title, sub: `Book${b.author ? ` · ${b.author}` : ''}`, section: 'library', icon: BookOpen });
      }
    }
    return out.slice(0, 30);
  }, [q, students, teachers, libraryBooks]);

  useEffect(() => { setActive(0); }, [q]);

  const choose = (r: Result) => { onNavigate?.(r.section); setOpen(false); };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); choose(results[active]); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg px-2.5 py-1.5"
        title="Search (Ctrl/⌘ K)">
        <Search className="h-4 w-4" />
        <span className="hidden md:inline text-xs text-gray-400">Search…</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onInputKey}
                placeholder="Search students, staff, books…"
                className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400" />
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {q.trim() === '' ? (
                <p className="px-4 py-8 text-sm text-gray-400 text-center">Type a name, admission number or class…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-400 text-center">No matches for “{q}”.</p>
              ) : results.map((r, i) => {
                const Icon = r.icon;
                return (
                  <button key={r.id} onMouseEnter={() => setActive(i)} onClick={() => choose(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${i === active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.sub}</p>
                    </div>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-3">
              <span>↑↓ to move</span><span>↵ to open</span><span>esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
