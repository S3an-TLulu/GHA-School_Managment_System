import { useState } from 'react';
import { BookOpen, Library as LibraryIcon, Plus, Pencil, Trash2, X, BookMarked, AlertTriangle, RotateCcw, Search, Printer, FileDown, Download } from 'lucide-react';
import { useAppContext, LibraryBook, BookLoan } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { compressImage } from '../lib/images';
import { esc, printHtml, exportPdf } from '../lib/print';
import { exportCSV } from '../lib/exports';

// ---- Book add/edit modal (with cover image, like the uniform catalog) ----
function BookModal({ book, onSave, onClose }: {
  book: LibraryBook | null;
  onSave: (b: LibraryBook) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    category: book?.category || '',
    totalCopies: book?.totalCopies?.toString() ?? '1',
    coverUrl: book?.coverUrl as string | undefined,
    notes: book?.notes || '',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{book ? 'Edit Book' : 'Add Book'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={e => {
          e.preventDefault();
          onSave({
            id: book?.id || `book-${Date.now()}`,
            title: form.title.trim(),
            author: form.author.trim() || undefined,
            category: form.category.trim() || undefined,
            totalCopies: Math.max(0, parseInt(form.totalCopies) || 0),
            coverUrl: form.coverUrl,
            notes: form.notes.trim() || undefined,
          });
        }}>
          <div className="flex items-center gap-4">
            {form.coverUrl ? (
              <img src={form.coverUrl} alt="" className="w-16 h-20 rounded-lg object-cover border border-gray-200" />
            ) : (
              <div className="w-16 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">No cover</div>
            )}
            <div className="space-y-1">
              <label className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg cursor-pointer">
                {form.coverUrl ? 'Change Cover' : 'Add Cover'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    try { const url = await compressImage(f, 350, 0.82); setForm(prev => ({ ...prev, coverUrl: url })); }
                    catch { alert('Could not read that image.'); }
                  }} />
              </label>
              {form.coverUrl && (
                <button type="button" onClick={() => setForm(prev => ({ ...prev, coverUrl: undefined }))}
                  className="block text-xs text-red-500 hover:underline">Remove cover</button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Things Fall Apart" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="e.g. Chinua Achebe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Fiction, Grade 7" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Copies *</label>
            <input required type="number" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.totalCopies} onChange={e => setForm({ ...form, totalCopies: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional — shelf, condition, edition…" />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">{book ? 'Update' : 'Add Book'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Borrow modal: pick a teacher or student, and a due date preset ----
const DUE_PRESETS: { id: string; label: string; days: number | 'custom' }[] = [
  { id: '1w', label: '1 week', days: 7 },
  { id: '3w', label: '3 weeks', days: 21 },
  { id: '1m', label: '1 month', days: 30 },
  { id: 'custom', label: 'Custom date', days: 'custom' },
];

function addDays(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function BorrowModal({ book, onClose }: { book: LibraryBook; onClose: () => void }) {
  const { students, teachers, borrowBook } = useAppContext();
  const { toast } = useToast();
  const [borrowerType, setBorrowerType] = useState<'student' | 'teacher'>('student');
  const [borrowerId, setBorrowerId] = useState('');
  const [preset, setPreset] = useState('3w');
  const [customDate, setCustomDate] = useState('');
  const [notes, setNotes] = useState('');

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const activeTeachers = teachers.filter(t => t.status === 'active');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerId) { toast('Select who is borrowing the book.', 'warning'); return; }
    let dueDate: string;
    const chosen = DUE_PRESETS.find(p => p.id === preset)!;
    if (chosen.days === 'custom') {
      if (!customDate) { toast('Pick a custom return date.', 'warning'); return; }
      dueDate = new Date(customDate).toISOString();
    } else {
      dueDate = addDays(chosen.days);
    }
    const person = borrowerType === 'student'
      ? activeStudents.find(s => s.id === borrowerId)
      : activeTeachers.find(t => t.id === borrowerId);
    borrowBook({
      id: `loan-${Date.now()}`,
      bookId: book.id,
      borrowerType,
      borrowerId,
      borrowerName: person?.name || 'Unknown',
      borrowedDate: new Date().toISOString(),
      dueDate,
      notes: notes.trim() || undefined,
    });
    toast(`"${book.title}" lent to ${person?.name}. Due ${new Date(dueDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lend Book</h2>
            <p className="text-sm text-gray-500">{book.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form className="p-5 space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Give to</label>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {(['student', 'teacher'] as const).map(t => (
                <button key={t} type="button" onClick={() => { setBorrowerType(t); setBorrowerId(''); }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${borrowerType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{borrowerType === 'student' ? 'Student' : 'Staff member'} *</label>
            <select required value={borrowerId} onChange={e => setBorrowerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">— Select {borrowerType} —</option>
              {borrowerType === 'student'
                ? activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.grade}</option>)
                : activeTeachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.role}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return within</label>
            <div className="grid grid-cols-4 gap-2">
              {DUE_PRESETS.map(p => (
                <button key={p.id} type="button" onClick={() => setPreset(p.id)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${preset === p.id ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <input type="date" required value={customDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomDate(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex space-x-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 gha-primary-btn text-white rounded-lg">Lend Book</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Library() {
  const { libraryBooks, bookLoans, branding, addLibraryBook, updateLibraryBook, deleteLibraryBook, returnLoan, deleteLoan } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'catalog' | 'loans'>('catalog');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [borrowBookItem, setBorrowBookItem] = useState<LibraryBook | null>(null);
  const [search, setSearch] = useState('');
  const [loanFilter, setLoanFilter] = useState<'active' | 'overdue' | 'returned' | 'all'>('active');

  const activeLoans = (bookId: string) => bookLoans.filter(l => l.bookId === bookId && !l.returnedDate).length;
  const available = (b: LibraryBook) => Math.max(0, b.totalCopies - activeLoans(b.id));

  const isOverdue = (l: BookLoan) => !l.returnedDate && new Date(l.dueDate) < new Date();
  const onLoanCount = bookLoans.filter(l => !l.returnedDate).length;
  const overdueCount = bookLoans.filter(isOverdue).length;
  const totalCopies = libraryBooks.reduce((s, b) => s + b.totalCopies, 0);

  const filteredBooks = libraryBooks.filter(b => {
    const q = search.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q);
  });

  const filteredLoans = [...bookLoans]
    .filter(l => {
      if (loanFilter === 'active') return !l.returnedDate;
      if (loanFilter === 'overdue') return isOverdue(l);
      if (loanFilter === 'returned') return !!l.returnedDate;
      return true;
    })
    .sort((a, b) => {
      // Active/overdue first by due date; returned by return date
      if (!a.returnedDate && !b.returnedDate) return a.dueDate.localeCompare(b.dueDate);
      return b.borrowedDate.localeCompare(a.borrowedDate);
    });

  const bookTitle = (id: string) => libraryBooks.find(b => b.id === id)?.title || 'Removed book';
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  // Build the printable HTML for the active tab (catalogue or loans list).
  const buildDoc = () => {
    const title = tab === 'catalog' ? 'Library Catalogue' : 'Books on Loan';
    const table = tab === 'catalog'
      ? `<table><thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Copies</th><th>On loan</th><th>Available</th></tr></thead><tbody>
          ${filteredBooks.map(b => `<tr><td class="l">${esc(b.title)}</td><td class="l">${esc(b.author || '—')}</td><td class="l">${esc(b.category || '—')}</td><td>${b.totalCopies}</td><td>${activeLoans(b.id)}</td><td>${available(b)}</td></tr>`).join('') || '<tr><td colspan="6">No books</td></tr>'}
        </tbody></table>`
      : `<table><thead><tr><th>Book</th><th>Borrower</th><th>Type</th><th>Borrowed</th><th>Due</th><th>Returned</th></tr></thead><tbody>
          ${filteredLoans.map(l => `<tr><td class="l">${esc(bookTitle(l.bookId))}</td><td class="l">${esc(l.borrowerName)}</td><td>${esc(l.borrowerType)}</td><td>${fmtDate(l.borrowedDate)}</td><td${isOverdue(l) ? ' style="color:#b91c1c;font-weight:700"' : ''}>${fmtDate(l.dueDate)}</td><td>${fmtDate(l.returnedDate)}</td></tr>`).join('') || '<tr><td colspan="6">No loans</td></tr>'}
        </tbody></table>`;
    return `<!DOCTYPE html><html><head><title>${esc(title)}</title><style>
      @page{size:A4;margin:14mm}*{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;color:#111;padding:8px}
      .hd{text-align:center;border-bottom:2px solid #12274a;padding-bottom:8px;margin-bottom:10px}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th,td{border:1px solid #cbd5e1;padding:5px 7px;font-size:12px;text-align:center}
      th{background:#eef2f7}td.l{text-align:left}
      @media print{button{display:none}}
    </style></head><body>
      <div class="hd">${branding.logoUrl ? `<img src="${branding.logoUrl}" style="height:42px;width:42px;object-fit:contain" />` : ''}
        <div style="font-size:18px;font-weight:800">${esc(branding.schoolName) || 'School'}</div>
        <div style="font-size:13px;font-weight:700">${esc(title)}</div>
        <div style="font-size:11px;color:#6b7280">${new Date().toLocaleDateString('en-GB')}</div></div>
      ${table}
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
    </body></html>`;
  };
  const exportLibraryCSV = () => {
    if (tab === 'catalog') exportCSV('GHA_Library_Catalogue', ['Title', 'Author', 'Category', 'Copies', 'On Loan', 'Available'],
      filteredBooks.map(b => [b.title, b.author || '', b.category || '', b.totalCopies, activeLoans(b.id), available(b)]));
    else exportCSV('GHA_Library_Loans', ['Book', 'Borrower', 'Type', 'Borrowed', 'Due', 'Returned'],
      filteredLoans.map(l => [bookTitle(l.bookId), l.borrowerName, l.borrowerType, fmtDate(l.borrowedDate), fmtDate(l.dueDate), fmtDate(l.returnedDate)]));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-gray-600">Books, copies in stock and who has borrowed what</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            <button onClick={exportLibraryCSV} title="Export to CSV" className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"><Download className="h-4 w-4" />CSV</button>
            <button onClick={() => printHtml(buildDoc())} title="Print" className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"><Printer className="h-4 w-4" />Print</button>
            <button onClick={() => exportPdf(buildDoc(), tab === 'catalog' ? 'Library_Catalogue' : 'Library_Loans')} title="Export to PDF" className="flex items-center border border-gray-300 text-gray-700 hover:bg-gray-50 px-2 py-2 rounded-lg text-sm"><FileDown className="h-4 w-4" /></button>
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'catalog' as const, label: 'Books', icon: LibraryIcon },
              { id: 'loans' as const, label: 'Borrowed', icon: BookMarked },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <t.icon className="h-4 w-4" /><span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Titles</p>
          <p className="text-2xl font-bold text-gray-900">{libraryBooks.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Copies</p>
          <p className="text-2xl font-bold text-gray-900">{totalCopies}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">On Loan</p>
          <p className="text-2xl font-bold text-blue-900">{onLoanCount}</p>
        </div>
        <div className={`${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <p className={`text-sm ${overdueCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>Overdue</p>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-900' : 'text-gray-900'}`}>{overdueCount}</p>
        </div>
      </div>

      {/* ---------------- BOOKS ---------------- */}
      {tab === 'catalog' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author or category…"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <button onClick={() => { setEditingBook(null); setModalOpen(true); }}
              className={`flex items-center space-x-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm`}>
              <Plus className="h-4 w-4" /><span>Add Book</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Book', 'Category', 'Copies', 'Available', ''].map(h =>
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBooks.map(b => {
                  const avail = available(b);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {b.coverUrl
                            ? <img src={b.coverUrl} alt="" className="w-9 h-12 rounded object-cover border border-gray-200" />
                            : <div className="w-9 h-12 rounded bg-gray-100 flex items-center justify-center"><BookOpen className="h-4 w-4 text-gray-300" /></div>}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{b.title}</p>
                            {b.author && <p className="text-xs text-gray-500">{b.author}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-gray-500">{b.category || '—'}</td>
                      <td className="px-5 py-2.5 text-gray-600">{b.totalCopies}</td>
                      <td className="px-5 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          avail === 0 ? 'bg-red-100 text-red-800' : avail <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>{avail} of {b.totalCopies}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => setBorrowBookItem(b)} disabled={avail === 0} title={avail === 0 ? 'No copies available' : 'Lend book'}
                          className={`text-xs font-medium rounded px-2.5 py-1 mr-1 ${avail === 0 ? 'text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                          Lend
                        </button>
                        <button onClick={() => { setEditingBook(b); setModalOpen(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => {
                          if (activeLoans(b.id) > 0) { toast('This book still has copies on loan. Mark them returned first.', 'warning'); return; }
                          deleteLibraryBook(b.id); toast('Book removed from library.', 'info');
                        }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
                {filteredBooks.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    {libraryBooks.length === 0 ? 'No books yet — add your first title.' : 'No books match your search.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- BORROWED ---------------- */}
      {tab === 'loans' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-end">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {(['active', 'overdue', 'returned', 'all'] as const).map(f => (
                <button key={f} onClick={() => setLoanFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${loanFilter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Book', 'Borrower', 'Borrowed', 'Due', 'Status', ''].map(h =>
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLoans.map(l => {
                  const overdue = isOverdue(l);
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-medium text-gray-900 max-w-[200px] truncate">{bookTitle(l.bookId)}</td>
                      <td className="px-5 py-2.5">
                        <p className="text-gray-900">{l.borrowerName}</p>
                        <p className="text-xs text-gray-400 capitalize">{l.borrowerType}</p>
                      </td>
                      <td className="px-5 py-2.5 text-gray-500 text-xs">{new Date(l.borrowedDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className={`px-5 py-2.5 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {new Date(l.dueDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-2.5">
                        {l.returnedDate ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Returned</span>
                        ) : overdue ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">Overdue</span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">On loan</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        {!l.returnedDate && (
                          <button onClick={() => { returnLoan(l.id); toast('Book marked as returned.', 'success'); }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded px-2.5 py-1 mr-1">
                            <RotateCcw className="h-3 w-3" /> Return
                          </button>
                        )}
                        <button onClick={() => { deleteLoan(l.id); toast('Loan record removed.', 'info'); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLoans.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    {bookLoans.length === 0 ? 'No books borrowed yet.' : `No ${loanFilter} loans.`}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {overdueCount > 0 && loanFilter !== 'returned' && (
            <div className="px-5 py-3 border-t border-gray-100 bg-red-50/50 flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {overdueCount} book{overdueCount !== 1 ? 's are' : ' is'} past the return date.
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <BookModal
          book={editingBook}
          onClose={() => { setModalOpen(false); setEditingBook(null); }}
          onSave={b => {
            if (editingBook) { updateLibraryBook(editingBook.id, b); toast('Book updated.', 'success'); }
            else { addLibraryBook(b); toast('Book added to library.', 'success'); }
            setModalOpen(false); setEditingBook(null);
          }}
        />
      )}

      {borrowBookItem && (
        <BorrowModal book={borrowBookItem} onClose={() => setBorrowBookItem(null)} />
      )}
    </div>
  );
}
