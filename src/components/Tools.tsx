import { useState } from 'react';
import {
  Trophy, Users2, Plus, Trash2, Printer, Download, ArrowLeft, Check, Lock, Pencil,
  Shuffle, Medal, Lightbulb, FileQuestion, X,
} from 'lucide-react';
import { useAppContext, Competition, CompetitionEntry, House, SchoolProject, ProjectTask, QuizQuestion } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { leaderboard, entryPoints } from '../lib/scoring';
import { printJudgesSheet, printResults } from '../lib/scoreDocs';
import { printTestPaper } from '../lib/quizDocs';
import { exportCSV } from '../lib/exports';

// Starter templates so a project has "a way in" — pick one and the tasks prefill.
const PROJECT_TEMPLATES: Record<string, string[]> = {
  'Science Fair': ['Pick a theme & date', 'Invite class participation', 'Set judging criteria', 'Arrange venue & tables', 'Prepare certificates', 'Judge & announce winners'],
  'Sports Day': ['Set date & house teams', 'List events & schedule', 'Assign judges & marshals', 'Order medals/prizes', 'Print score sheets', 'Run event & tally points'],
  'Fundraiser Drive': ['Define goal & purpose', 'Choose activities', 'Set collection dates', 'Assign coordinators', 'Promote to parents', 'Count & bank proceeds'],
  'Library Setup': ['Audit current books', 'Decide categories & shelving', 'Label & catalogue', 'Set borrowing rules', 'Launch to classes'],
  'Blank project': [],
};

const TYPES: Competition['type'][] = ['Sports', 'Quiz', 'Debate', 'Spelling Bee', 'Other'];
const DEFAULT_PLACES = [
  { label: '1st', points: 10 }, { label: '2nd', points: 8 }, { label: '3rd', points: 6 }, { label: '4th', points: 4 },
];

export function Tools() {
  const ctx = useAppContext();
  const { houses, competitions, competitionEntries, branding, addCompetition, deleteCompetition } = ctx;
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'scoreboard' | 'standings' | 'namepicker' | 'projects' | 'quiz' | 'houses'>('scoreboard');
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Sports' as Competition['type'], date: new Date().toISOString().split('T')[0], scoringMode: 'position' as 'position' | 'points' });

  const openComp = competitions.find(c => c.id === openId) || null;

  const create = () => {
    if (!form.name.trim()) { toast('Give the competition a name.', 'warning'); return; }
    const id = `comp-${Date.now()}`;
    addCompetition({ id, name: form.name.trim(), type: form.type, date: new Date(form.date).toISOString(), scoringMode: form.scoringMode, places: DEFAULT_PLACES.map(p => ({ ...p })), status: 'active' });
    setCreating(false); setForm({ ...form, name: '' }); setOpenId(id);
    toast('Competition created.', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tools</h1>
        <p className="text-gray-600">Handy tools for events and projects</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-3 py-3 border-b border-gray-200 flex gap-1 overflow-x-auto">
          {([['scoreboard', 'Scoreboard', Trophy], ['standings', 'Overall Standings', Medal], ['namepicker', 'Name Picker', Shuffle], ['projects', 'Project Builder', Lightbulb], ['quiz', 'Quiz Builder', FileQuestion], ['houses', 'Houses', Users2]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => { setTab(id); setOpenId(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === id ? `${tc.light} ${tc.text}` : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'houses' && <HousesTab />}
          {tab === 'standings' && <StandingsTab />}
          {tab === 'namepicker' && <NamePickerTab />}
          {tab === 'projects' && <ProjectsTab />}
          {tab === 'quiz' && <QuizTab />}

          {tab === 'scoreboard' && !openComp && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{competitions.length} competition{competitions.length !== 1 ? 's' : ''}</p>
                <button onClick={() => setCreating(true)} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />New Competition</button>
              </div>
              {creating && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-2 items-end">
                  <input className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[180px]" placeholder="Competition name (e.g. Sports Day 100m)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Competition['type'] })}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.scoringMode} onChange={e => setForm({ ...form, scoringMode: e.target.value as 'position' | 'points' })}><option value="position">By position (1st/2nd…)</option><option value="points">By raw points</option></select>
                  <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  <button onClick={create} className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Create</button>
                  <button onClick={() => setCreating(false)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {competitions.map(c => {
                  const board = leaderboard(competitionEntries.filter(e => e.competitionId === c.id), houses, c);
                  const winner = board.find(b => b.winner && b.total > 0);
                  return (
                    <div key={c.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer" onClick={() => setOpenId(c.id)}>
                      <div className="flex justify-between items-start">
                        <div><p className="font-semibold text-gray-900">{c.name}</p><p className="text-xs text-gray-500">{c.type} · {new Date(c.date).toLocaleDateString('en-GB')}</p></div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{c.status}</span>
                      </div>
                      {winner && <p className="text-xs mt-2 text-amber-700">🏆 Leading: {winner.house.name} ({winner.total} pts)</p>}
                    </div>
                  );
                })}
                {competitions.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-8">No competitions yet — create one to start scoring.</p>}
              </div>
            </div>
          )}

          {tab === 'scoreboard' && openComp && (
            <CompetitionDetail comp={openComp} onBack={() => setOpenId(null)} onDelete={() => { deleteCompetition(openComp.id); setOpenId(null); toast('Competition deleted.', 'info'); }} />
          )}
        </div>
      </div>
    </div>
  );

  // ---------- Houses management ----------
  function HousesTab() {
    const { addHouse, updateHouse, deleteHouse } = ctx;
    const [name, setName] = useState(''); const [colour, setColour] = useState('#2563eb');
    return (
      <div className="max-w-lg space-y-4">
        <form className="flex gap-2 items-center" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; addHouse({ id: `house-${Date.now()}`, name: name.trim(), colour }); setName(''); }}>
          <input type="color" value={colour} onChange={e => setColour(e.target.value)} className="w-10 h-10 border border-gray-300 rounded cursor-pointer" />
          <input className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="House name" value={name} onChange={e => setName(e.target.value)} />
          <button className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Add</button>
        </form>
        <div className="space-y-2">
          {houses.map(h => (
            <div key={h.id} className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg">
              <input type="color" value={h.colour} onChange={e => updateHouse(h.id, { colour: e.target.value })} className="w-8 h-8 border border-gray-200 rounded cursor-pointer" />
              <input defaultValue={h.name} onBlur={e => e.target.value !== h.name && updateHouse(h.id, { name: e.target.value })} className="flex-1 text-sm border-none focus:ring-1 focus:ring-blue-300 rounded px-1" />
              <button onClick={() => deleteHouse(h.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {houses.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No houses — add your team colours above.</p>}
        </div>
      </div>
    );
  }

  // ---------- Overall standings (all competitions added together) ----------
  function StandingsTab() {
    const [typeFilter, setTypeFilter] = useState('');
    const comps = competitions.filter(c => !typeFilter || c.type === typeFilter);
    const totals = houses.map(h => {
      let points = 0, wins = 0;
      comps.forEach(c => {
        const row = leaderboard(competitionEntries.filter(e => e.competitionId === c.id), houses, c).find(x => x.house.id === h.id);
        if (row) { points += row.total; if (row.winner && row.total > 0) wins++; }
      });
      return { house: h, points: Math.round(points * 100) / 100, wins };
    }).sort((a, b) => b.points - a.points || b.wins - a.wins);
    const top = totals[0]?.points || 0;
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-gray-500">Points from all {comps.length} competition{comps.length !== 1 ? 's' : ''} added together</p>
          <div className="flex gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"><option value="">All types</option>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <button onClick={() => exportCSV('GHA_Overall_Standings', ['Rank', 'House', 'Total Points', 'Competitions Won'], totals.map((t, i) => [i + 1, t.house.name, t.points, t.wins]))} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm"><Download className="h-4 w-4" />CSV</button>
          </div>
        </div>
        <div className="space-y-2">
          {totals.map((t, i) => (
            <div key={t.house.id} className={`flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 ${i === 0 && t.points > 0 ? 'ring-2 ring-amber-400' : ''}`}>
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-lg font-extrabold text-gray-400">{i + 1}</span>
                <span className="w-4 h-4 rounded flex-shrink-0" style={{ background: t.house.colour }} />
                <span className="font-semibold text-gray-900">{t.house.name}{i === 0 && t.points > 0 ? ' 🏆' : ''}</span>
                {t.wins > 0 && <span className="text-xs text-gray-400">· {t.wins} win{t.wins !== 1 ? 's' : ''}</span>}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-28 h-2 bg-gray-200 rounded-full hidden sm:block"><div className="h-2 rounded-full" style={{ width: `${top > 0 ? (t.points / top) * 100 : 0}%`, background: t.house.colour }} /></div>
                <span className="text-xl font-extrabold text-gray-900 tabular-nums w-14 text-right">{t.points}</span>
              </div>
            </div>
          ))}
          {houses.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Add houses first.</p>}
          {houses.length > 0 && comps.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No competitions to total yet.</p>}
        </div>
      </div>
    );
  }

  // ---------- Random name picker ----------
  function NamePickerTab() {
    const { students } = ctx;
    const active = students.filter(s => !s.status || s.status === 'active');
    const grades = Array.from(new Set(active.map(s => s.grade))).sort();
    const [grade, setGrade] = useState('');
    const [gender, setGender] = useState('');
    const [picked, setPicked] = useState<string | null>(null);
    const [used, setUsed] = useState<Set<string>>(new Set());
    const [noRepeat, setNoRepeat] = useState(true);

    const pool = active.filter(s => (!grade || s.grade === grade) && (!gender || s.gender === gender) && (!noRepeat || !used.has(s.id)));
    const pick = () => {
      if (pool.length === 0) { toast(noRepeat && used.size > 0 ? 'Everyone has been picked — reset to go again.' : 'No students match the filters.', 'warning'); return; }
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setPicked(chosen.name);
      if (noRepeat) setUsed(prev => new Set(prev).add(chosen.id));
    };
    const inp = 'px-3 py-2 border border-gray-300 rounded-lg text-sm';
    return (
      <div className="max-w-xl mx-auto space-y-4 text-center">
        <p className="text-sm text-gray-500">Randomly pick a pupil — great for cold-calling, teams or prizes.</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <select value={grade} onChange={e => setGrade(e.target.value)} className={inp}><option value="">All classes</option>{grades.map(g => <option key={g} value={g}>{g}</option>)}</select>
          <select value={gender} onChange={e => setGender(e.target.value)} className={inp}><option value="">Any gender</option><option value="Male">Boys</option><option value="Female">Girls</option></select>
          <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={noRepeat} onChange={e => setNoRepeat(e.target.checked)} />No repeats</label>
        </div>
        <div className={`rounded-2xl border-2 border-dashed ${picked ? 'border-blue-300' : 'border-gray-200'} py-12 px-4`}>
          {picked ? <p className="text-3xl font-extrabold text-gray-900">{picked}</p> : <p className="text-gray-400">Press pick to choose someone</p>}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button onClick={pick} className={`flex items-center gap-2 ${tc.btn} text-white px-6 py-2.5 rounded-lg font-medium`}><Shuffle className="h-4 w-4" />Pick random</button>
          {used.size > 0 && <button onClick={() => { setUsed(new Set()); setPicked(null); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">Reset ({used.size})</button>}
        </div>
        <p className="text-xs text-gray-400">{pool.length} candidate{pool.length !== 1 ? 's' : ''} available{noRepeat && used.size > 0 ? ` · ${used.size} already picked` : ''}</p>
      </div>
    );
  }

  // ---------- Project builder ----------
  function ProjectsTab() {
    const { projects, addProject, updateProject, deleteProject } = ctx;
    const [title, setTitle] = useState('');
    const [template, setTemplate] = useState('Blank project');
    const [openP, setOpenP] = useState<string | null>(null);
    const STATUS: SchoolProject['status'][] = ['idea', 'planning', 'active', 'done'];
    const STATUS_STYLE: Record<string, string> = { idea: 'bg-gray-100 text-gray-600', planning: 'bg-blue-50 text-blue-700', active: 'bg-amber-100 text-amber-800', done: 'bg-green-100 text-green-700' };
    const create = () => {
      if (!title.trim()) { toast('Give the project a title.', 'warning'); return; }
      const tasks: ProjectTask[] = (PROJECT_TEMPLATES[template] || []).map((t, i) => ({ id: `pt-${Date.now()}-${i}`, text: t, done: false }));
      const id = `proj-${Date.now()}`;
      addProject({ id, title: title.trim(), category: template !== 'Blank project' ? template : undefined, status: 'planning', tasks, createdAt: new Date().toISOString() });
      setTitle(''); setOpenP(id); toast('Project created.', 'success');
    };
    const open = projects.find(p => p.id === openP);
    if (open) {
      const done = open.tasks.filter(t => t.done).length;
      const pct = open.tasks.length ? Math.round((done / open.tasks.length) * 100) : 0;
      return <ProjectDetail project={open} pct={pct} onBack={() => setOpenP(null)} />;
    }
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-wrap gap-2 items-end">
          <input className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="New project title" value={title} onChange={e => setTitle(e.target.value)} />
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={template} onChange={e => setTemplate(e.target.value)}>{Object.keys(PROJECT_TEMPLATES).map(t => <option key={t} value={t}>{t === 'Blank project' ? 'Blank project' : `Template: ${t}`}</option>)}</select>
          <button onClick={create} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Start Project</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map(p => {
            const done = p.tasks.filter(t => t.done).length; const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
            return (
              <div key={p.id} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300" onClick={() => setOpenP(p.id)}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0"><p className="font-semibold text-gray-900 truncate">{p.title}</p>{p.category && <p className="text-xs text-gray-400">{p.category}</p>}</div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <select value={p.status} onClick={e => e.stopPropagation()} onChange={e => updateProject(p.id, { status: e.target.value as SchoolProject['status'] })} className={`text-xs rounded-full px-2 py-0.5 border-none ${STATUS_STYLE[p.status]}`}>{STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {p.tasks.length > 0 && <div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div><p className="text-xs text-gray-400 mt-1">{done}/{p.tasks.length} tasks · {pct}%</p></div>}
              </div>
            );
          })}
          {projects.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-8">No projects yet — start one with a template above.</p>}
        </div>
      </div>
    );
  }

  function ProjectDetail({ project, pct, onBack }: { project: SchoolProject; pct: number; onBack: () => void }) {
    const { updateProject } = ctx;
    const [text, setText] = useState('');
    const toggle = (id: string) => updateProject(project.id, { tasks: project.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) });
    const add = () => { if (!text.trim()) return; updateProject(project.id, { tasks: [...project.tasks, { id: `pt-${Date.now()}`, text: text.trim(), done: false }] }); setText(''); };
    const del = (id: string) => updateProject(project.id, { tasks: project.tasks.filter(t => t.id !== id) });
    return (
      <div className="space-y-4 max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4" />All projects</button>
        <div><h2 className="text-lg font-bold text-gray-900">{project.title}</h2>{project.category && <p className="text-sm text-gray-500">{project.category}</p>}</div>
        <textarea value={project.description || ''} onChange={e => updateProject(project.id, { description: e.target.value })} placeholder="Project description / goal…" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
        <div className="space-y-1.5">
          {project.tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <button onClick={() => toggle(t.id)} className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>{t.done && <Check className="h-3.5 w-3.5 text-white" />}</button>
              <span className={`flex-1 text-sm ${t.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.text}</span>
              <button onClick={() => del(t.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {project.tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-3">No tasks yet.</p>}
        </div>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
          <input className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Add a task / step…" value={text} onChange={e => setText(e.target.value)} />
          <button className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Add</button>
        </form>
      </div>
    );
  }

  // ---------- Quiz / test builder + question bank ----------
  function QuizTab() {
    const { quizQuestions, addQuizQuestion, deleteQuizQuestion, branding } = ctx;
    const subjects = Array.from(new Set(quizQuestions.map(q => q.subject).filter(Boolean))).sort();
    const [filter, setFilter] = useState('');
    const [sel, setSel] = useState<Set<string>>(new Set());
    const [paper, setPaper] = useState({ title: 'Class Test', subject: '', grade: '', instructions: '' });
    const [q, setQ] = useState({ subject: '', grade: '', question: '', options: ['', '', '', ''], correctIndex: 0, marks: '1', short: false });
    const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm';

    const filtered = quizQuestions.filter(x => !filter || x.subject === filter);
    const addQ = () => {
      if (!q.subject.trim() || !q.question.trim()) { toast('Subject and question are required.', 'warning'); return; }
      const options = q.short ? [] : q.options.map(o => o.trim()).filter(Boolean);
      addQuizQuestion({ id: `qq-${Date.now()}`, subject: q.subject.trim(), grade: q.grade.trim() || undefined, question: q.question.trim(), options, correctIndex: q.short ? undefined : q.correctIndex, marks: parseInt(q.marks) || 1 });
      setQ({ ...q, question: '', options: ['', '', '', ''] });
      toast('Question added to the bank.', 'success');
    };
    const toggleSel = (id: string) => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const chosen = () => quizQuestions.filter(x => sel.has(x.id));
    const print = (withAnswers: boolean) => {
      const qs = chosen().length > 0 ? chosen() : filtered;
      if (qs.length === 0) { toast('Add or select some questions first.', 'warning'); return; }
      printTestPaper({ title: paper.title || 'Test', subject: paper.subject || qs[0].subject, grade: paper.grade || undefined, instructions: paper.instructions || undefined, questions: qs, branding, withAnswers });
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add question */}
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Add a question</p>
          <div className="flex gap-2"><input className={`${inp} flex-1`} placeholder="Subject" value={q.subject} onChange={e => setQ({ ...q, subject: e.target.value })} /><input className={`${inp} w-24`} placeholder="Grade" value={q.grade} onChange={e => setQ({ ...q, grade: e.target.value })} /><input className={`${inp} w-16`} type="number" min="1" title="Marks" value={q.marks} onChange={e => setQ({ ...q, marks: e.target.value })} /></div>
          <textarea className={`${inp} w-full`} rows={2} placeholder="Question text" value={q.question} onChange={e => setQ({ ...q, question: e.target.value })} />
          <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={q.short} onChange={e => setQ({ ...q, short: e.target.checked })} />Short-answer (no options)</label>
          {!q.short && q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={q.correctIndex === i} onChange={() => setQ({ ...q, correctIndex: i })} title="Mark correct" />
              <input className={`${inp} flex-1`} placeholder={`Option ${'ABCD'[i]}`} value={o} onChange={e => setQ({ ...q, options: q.options.map((x, j) => j === i ? e.target.value : x) })} />
            </div>
          ))}
          <button onClick={addQ} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add to bank</button>
        </div>

        {/* Bank + build paper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900">Question bank ({filtered.length})</p>
            <select value={filter} onChange={e => setFilter(e.target.value)} className={inp}><option value="">All subjects</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(x => (
              <label key={x.id} className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={sel.has(x.id)} onChange={() => toggleSel(x.id)} className="mt-1" />
                <span className="flex-1 min-w-0"><span className="text-gray-900">{x.question}</span><span className="block text-xs text-gray-400">{x.subject}{x.grade ? ` · ${x.grade}` : ''} · {x.marks ?? 1} mark{(x.marks ?? 1) !== 1 ? 's' : ''}{x.options.length ? ` · ${x.options.length} options` : ' · short answer'}</span></span>
                <button onClick={e => { e.preventDefault(); deleteQuizQuestion(x.id); }} className="p-1 text-red-400 hover:bg-red-50 rounded flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
              </label>
            ))}
            {filtered.length === 0 && <p className="px-3 py-6 text-sm text-gray-400 text-center">No questions yet — add some on the left.</p>}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Build test paper</p>
            <div className="flex gap-2"><input className={`${inp} flex-1`} placeholder="Paper title" value={paper.title} onChange={e => setPaper({ ...paper, title: e.target.value })} /><input className={`${inp} w-28`} placeholder="Grade" value={paper.grade} onChange={e => setPaper({ ...paper, grade: e.target.value })} /></div>
            <input className={`${inp} w-full`} placeholder="Instructions (optional)" value={paper.instructions} onChange={e => setPaper({ ...paper, instructions: e.target.value })} />
            <p className="text-xs text-gray-400">{sel.size > 0 ? `${sel.size} selected` : `Using all ${filtered.length} filtered`} question(s).</p>
            <div className="flex gap-2">
              <button onClick={() => print(false)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-white px-3 py-1.5 rounded-lg text-sm"><Printer className="h-4 w-4" />Test Paper</button>
              <button onClick={() => print(true)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-white px-3 py-1.5 rounded-lg text-sm"><Printer className="h-4 w-4" />Answer Key</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Single competition detail ----------
  function CompetitionDetail({ comp, onBack, onDelete }: { comp: Competition; onBack: () => void; onDelete: () => void }) {
    const { students, updateCompetition, addCompetitionEntry, updateCompetitionEntry, deleteCompetitionEntry } = ctx;
    const entries = competitionEntries.filter(e => e.competitionId === comp.id);
    const board = leaderboard(entries, houses, comp);
    const houseName = (id: string) => houses.find(h => h.id === id)?.name || '—';
    const [row, setRow] = useState({ name: '', grade: '', houseId: houses[0]?.id || '', position: '', rawPoints: '' });
    const activeStudents = students.filter(s => !s.status || s.status === 'active');
    const locked = comp.status === 'final';

    const addRow = () => {
      if (!row.houseId) { toast('Add a house first (Houses tab).', 'warning'); return; }
      addCompetitionEntry({
        id: `ce-${Date.now()}`, competitionId: comp.id, name: row.name.trim() || undefined, grade: row.grade.trim() || undefined,
        houseId: row.houseId,
        position: comp.scoringMode === 'position' && row.position ? parseInt(row.position) : undefined,
        rawPoints: comp.scoringMode === 'points' && row.rawPoints ? parseFloat(row.rawPoints) : undefined,
      });
      setRow({ ...row, name: '', grade: '', position: '', rawPoints: '' });
    };

    const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4" />All competitions</button>
          <div className="flex gap-2">
            <button onClick={() => printJudgesSheet(comp, houses, branding)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm"><Printer className="h-4 w-4" />Blank Sheet</button>
            <button onClick={() => printResults(comp, houses, entries, branding)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm"><Printer className="h-4 w-4" />Results</button>
            <button onClick={() => exportCSV(`GHA_${comp.name.replace(/\s+/g, '_')}`, ['Participant', 'Grade', 'House', comp.scoringMode === 'points' ? 'Points' : 'Position', 'Earned'], entries.map(e => [e.name || `${houseName(e.houseId)} (team)`, e.grade || '', houseName(e.houseId), comp.scoringMode === 'points' ? (e.rawPoints ?? '') : (e.position ?? ''), entryPoints(e, entries, comp)]))} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm"><Download className="h-4 w-4" />CSV</button>
            <button onClick={() => updateCompetition(comp.id, { status: locked ? 'active' : 'final' })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${locked ? 'border border-gray-300 text-gray-600' : 'bg-green-600 text-white'}`}>{locked ? <><Pencil className="h-4 w-4" />Reopen</> : <><Lock className="h-4 w-4" />Mark Final</>}</button>
            <button onClick={() => { if (window.confirm('Delete this competition and its entries?')) onDelete(); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">{comp.name}</h2>
          <p className="text-sm text-gray-500">{comp.type} · {new Date(comp.date).toLocaleDateString('en-GB')} · scored {comp.scoringMode === 'position' ? 'by position' : 'by raw points'}</p>
        </div>

        {/* Position points config */}
        {comp.scoringMode === 'position' && (
          <div className="flex flex-wrap gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="text-xs text-gray-500 self-center">Points per place:</span>
            {comp.places.map((p, i) => (
              <label key={i} className="flex items-center gap-1 text-sm"><span className="text-gray-600">{p.label}</span>
                <input type="number" disabled={locked} value={p.points} onChange={e => { const places = comp.places.map((x, j) => j === i ? { ...x, points: parseFloat(e.target.value) || 0 } : x); updateCompetition(comp.id, { places }); }} className="w-14 px-2 py-1 border border-gray-300 rounded text-sm" /></label>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entries */}
          <div className="lg:col-span-2 space-y-3">
            {!locked && (
              <div className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-lg p-3">
                <input list="tools-students" className={`${inp} flex-1 min-w-[140px]`} placeholder="Participant name (or leave blank for a team)" value={row.name}
                  onChange={e => { const st = activeStudents.find(s => s.name === e.target.value); setRow({ ...row, name: e.target.value, grade: st?.grade || row.grade }); }} />
                <datalist id="tools-students">{activeStudents.map(s => <option key={s.id} value={s.name} />)}</datalist>
                <input className={`${inp} w-24`} placeholder="Grade" value={row.grade} onChange={e => setRow({ ...row, grade: e.target.value })} />
                <select className={inp} value={row.houseId} onChange={e => setRow({ ...row, houseId: e.target.value })}>{houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
                {comp.scoringMode === 'position'
                  ? <select className={`${inp} w-28`} value={row.position} onChange={e => setRow({ ...row, position: e.target.value })}><option value="">Position…</option>{comp.places.map((p, i) => <option key={i} value={i + 1}>{p.label}</option>)}</select>
                  : <input className={`${inp} w-24`} type="number" placeholder="Points" value={row.rawPoints} onChange={e => setRow({ ...row, rawPoints: e.target.value })} />}
                <button onClick={addRow} className={`${tc.btn} text-white px-3 py-1.5 rounded-lg text-sm`}>Add</button>
              </div>
            )}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm divide-y divide-gray-100">
                <thead className="bg-gray-50"><tr>{['Participant', 'Grade', 'House', comp.scoringMode === 'position' ? 'Position' : 'Points', 'Earned', ''].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map(e => {
                    const house = houses.find(h => h.id === e.houseId);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{e.name || <span className="text-gray-500">{houseName(e.houseId)} (team)</span>}</td>
                        <td className="px-3 py-2 text-gray-500">{e.grade || '—'}</td>
                        <td className="px-3 py-2"><span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: house?.colour }} />{houseName(e.houseId)}</span></td>
                        <td className="px-3 py-2">
                          {locked ? (comp.scoringMode === 'position' ? (e.position ? comp.places[e.position - 1]?.label : '—') : (e.rawPoints ?? '—'))
                            : comp.scoringMode === 'position'
                              ? <select value={e.position ?? ''} onChange={ev => updateCompetitionEntry(e.id, { position: ev.target.value ? parseInt(ev.target.value) : undefined })} className="border border-gray-200 rounded px-1.5 py-1 text-sm"><option value="">—</option>{comp.places.map((p, i) => <option key={i} value={i + 1}>{p.label}</option>)}</select>
                              : <input type="number" value={e.rawPoints ?? ''} onChange={ev => updateCompetitionEntry(e.id, { rawPoints: ev.target.value ? parseFloat(ev.target.value) : undefined })} className="w-20 border border-gray-200 rounded px-1.5 py-1 text-sm" />}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900">{entryPoints(e, entries, comp)}</td>
                        <td className="px-3 py-2 text-right">{!locked && <button onClick={() => deleteCompetitionEntry(e.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>}</td>
                      </tr>
                    );
                  })}
                  {entries.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No entries yet — add participants above.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live leaderboard */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-fit">
            <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Trophy className={`h-4 w-4 ${tc.text}`} />Live Leaderboard</p>
            <div className="space-y-2">
              {board.map(b => (
                <div key={b.house.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 ${b.winner && b.total > 0 ? 'ring-2 ring-amber-400' : ''}`}>
                  <span className="flex items-center gap-2.5 text-sm min-w-0">
                    <span className="w-5 text-center font-bold text-gray-500">{b.rank}</span>
                    <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: b.house.colour }} />
                    <span className="font-semibold text-gray-900 truncate">{b.house.name}</span>
                    {b.winner && b.total > 0 && <span className="flex-shrink-0">🏆</span>}
                  </span>
                  <span className="text-lg font-extrabold text-gray-900 flex-shrink-0 tabular-nums">{b.total}</span>
                </div>
              ))}
              {houses.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Add houses in the Houses tab.</p>}
            </div>
            {locked && <p className="mt-3 text-xs text-green-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" />Results are final.</p>}
          </div>
        </div>
      </div>
    );
  }
}
