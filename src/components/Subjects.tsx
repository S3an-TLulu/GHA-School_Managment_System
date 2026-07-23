import { useState } from 'react';
import {
  BookOpen, Plus, Trash2, Printer, FileDown, Check, ArrowLeft, Shuffle,
  ListChecks, Layers, FileQuestion, Users2, ScrollText, ClipboardList, Boxes, Gift, X, Sparkles,
} from 'lucide-react';
import { generateResource } from '../lib/aiGenerate';
import {
  useAppContext, Subject, SubjectTopic, LessonPlan, ProjectTask, WorkGroup,
  ClassRule, ClassRole, ClassInventoryItem, WishlistItem, QuizQuestion,
} from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import { printTestPaper } from '../lib/quizDocs';
import {
  printLessonPlan, printTopics, printClassRules, printClassRoles, printClassInventory, printWishlist,
} from '../lib/subjectDocs';

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

type SubjectTab = 'topics' | 'lessons' | 'bank' | 'groups';
type ClassTab = 'rules' | 'roles' | 'inventory' | 'wishlist';
type Tab = SubjectTab | ClassTab;

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function Subjects() {
  const ctx = useAppContext();
  const { subjects, addSubject, deleteSubject, branding } = ctx;
  const { currentUser } = useAuth();
  const tc = useThemeClasses();
  const { toast } = useToast();

  const [subject, setSubject] = useState(subjects[0]?.name || '');
  const [grade, setGrade] = useState(GRADES[3]); // Grade 1
  const [tab, setTab] = useState<Tab>('topics');
  const [manageOpen, setManageOpen] = useState(false);

  const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const cardBtn = 'flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm';

  const SUBJECT_TABS: [SubjectTab, string, typeof BookOpen][] = [
    ['topics', 'Topics', ListChecks], ['lessons', 'Lesson Plans', Layers],
    ['bank', 'Question Bank', FileQuestion], ['groups', 'Group Work', Users2],
  ];
  const CLASS_TABS: [ClassTab, string, typeof BookOpen][] = [
    ['rules', 'Class Rules', ScrollText], ['roles', 'Roles & Duties', ClipboardList],
    ['inventory', 'Inventory', Boxes], ['wishlist', 'Wishlist', Gift],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600">Everything teachers need to run a subject and class</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
          <div className="flex items-center gap-2">
            <select value={subject} onChange={e => setSubject(e.target.value)} className={inp}>
              {subjects.length === 0 && <option value="">— none —</option>}
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <button onClick={() => setManageOpen(true)} className={cardBtn}><Plus className="h-4 w-4" />Manage</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select value={grade} onChange={e => setGrade(e.target.value)} className={inp}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-2">
        <span className="w-full text-xs font-semibold text-gray-400 uppercase tracking-wide">Subject tools · {subject || '—'}</span>
        {SUBJECT_TABS.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${tab === id ? `${tc.btn.split(' ')[0]} text-white` : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
        <span className="w-full text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Class tools · {grade}</span>
        {CLASS_TABS.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${tab === id ? `${tc.btn.split(' ')[0]} text-white` : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        {!subject && ['topics', 'lessons', 'bank', 'groups'].includes(tab)
          ? <p className="text-sm text-gray-400 text-center py-8">Add a subject to begin — use “Manage”.</p>
          : <>
              {tab === 'topics' && <TopicsTab subject={subject} grade={grade} />}
              {tab === 'lessons' && <LessonsTab subject={subject} grade={grade} />}
              {tab === 'bank' && <BankTab subject={subject} grade={grade} />}
              {tab === 'groups' && <GroupsTab subject={subject} grade={grade} />}
              {tab === 'rules' && <RulesTab grade={grade} />}
              {tab === 'roles' && <RolesTab grade={grade} />}
              {tab === 'inventory' && <InventoryTab grade={grade} />}
              {tab === 'wishlist' && <WishlistTab grade={grade} />}
            </>}
      </div>

      {manageOpen && <ManageSubjects onClose={() => setManageOpen(false)} />}
    </div>
  );

  // ---------- Manage subjects modal ----------
  function ManageSubjects({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState('');
    const add = () => {
      if (!name.trim()) return;
      if (subjects.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) { toast('That subject already exists.', 'warning'); return; }
      const s: Subject = { id: uid('subj'), name: name.trim(), active: true };
      addSubject(s); setSubject(s.name); setName(''); toast('Subject added.', 'success');
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manage Subjects</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
          </div>
          <div className="p-5 space-y-3">
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
              <input className={`${inp} flex-1`} placeholder="New subject name" value={name} onChange={e => setName(e.target.value)} />
              <button className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Add</button>
            </form>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-800">{s.name}</span>
                  <button onClick={() => { deleteSubject(s.id); if (subject === s.name) setSubject(subjects.find(x => x.id !== s.id)?.name || ''); }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {subjects.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No subjects yet.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Topics ----------
  function TopicsTab({ subject, grade }: { subject: string; grade: string }) {
    const { subjectTopics, addSubjectTopic, updateSubjectTopic, deleteSubjectTopic } = ctx;
    const list = subjectTopics.filter(t => t.subject === subject).sort((a, b) => a.order - b.order);
    const [form, setForm] = useState({ title: '', content: '' });
    const [gen, setGen] = useState(false);
    const add = () => {
      if (!form.title.trim()) { toast('Give the topic a title.', 'warning'); return; }
      const t: SubjectTopic = { id: uid('top'), subject, grade, title: form.title.trim(), content: form.content.trim(), order: list.length };
      addSubjectTopic(t); setForm({ title: '', content: '' }); toast('Topic added.', 'success');
    };
    const generate = async () => {
      const topic = form.title.trim() || window.prompt('Generate topic notes about…') || '';
      if (!topic.trim()) return;
      setGen(true);
      const r = await generateResource('topic', { subject, grade, topic: topic.trim() });
      setGen(false);
      if (!r.ok) { toast(r.error, 'error'); return; }
      addSubjectTopic({ id: uid('top'), subject, grade, title: r.data.title || topic.trim(), content: r.data.content, order: list.length });
      setForm({ title: '', content: '' }); toast('Topic notes generated.', 'success');
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <button onClick={() => printTopics(subject, grade, list, branding)} className={cardBtn}><Printer className="h-4 w-4" />Print</button>
          <button onClick={() => printTopics(subject, grade, list, branding, { pdf: true })} className={cardBtn} title="Export to PDF"><FileDown className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <input className={`${inp} w-full`} placeholder="Topic title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className={`${inp} w-full`} rows={4} placeholder="Topic content / syllabus notes…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={add} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add topic</button>
              <button onClick={generate} disabled={gen} title="Generate topic notes with AI" className="flex items-center gap-1.5 border border-purple-300 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm disabled:opacity-50"><Sparkles className="h-4 w-4" />{gen ? 'Generating…' : 'Generate'}</button>
            </div>
          </div>
          <div className="space-y-2">
            {list.map(t => (
              <div key={t.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-gray-900">{t.title}</p>
                  <button onClick={() => deleteSubjectTopic(t.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <textarea defaultValue={t.content} onBlur={e => updateSubjectTopic(t.id, { content: e.target.value })}
                  className="w-full mt-1 text-sm text-gray-600 bg-transparent resize-none focus:outline-none" rows={2} placeholder="Notes…" />
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No topics for {subject} yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Lesson plans ----------
  function LessonsTab({ subject, grade }: { subject: string; grade: string }) {
    const { lessonPlans, addLessonPlan, updateLessonPlan, deleteLessonPlan } = ctx;
    const list = lessonPlans.filter(p => p.subject === subject);
    const [openId, setOpenId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [gen, setGen] = useState(false);
    const create = () => {
      if (!title.trim()) { toast('Give the lesson a title.', 'warning'); return; }
      const p: LessonPlan = { id: uid('lp'), subject, grade, title: title.trim(), date: new Date().toISOString().split('T')[0], objectives: '', steps: [], resources: '', notes: '' };
      addLessonPlan(p); setTitle(''); setOpenId(p.id); toast('Lesson plan created.', 'success');
    };
    const generate = async () => {
      const topic = title.trim() || window.prompt('Generate a lesson plan about…') || '';
      if (!topic.trim()) return;
      setGen(true);
      const r = await generateResource('lesson', { subject, grade, topic: topic.trim() });
      setGen(false);
      if (!r.ok) { toast(r.error, 'error'); return; }
      const steps: ProjectTask[] = (r.data.steps || []).map(text => ({ id: uid('st'), text, done: false }));
      const p: LessonPlan = { id: uid('lp'), subject, grade, title: r.data.title || topic.trim(), date: new Date().toISOString().split('T')[0], objectives: r.data.objectives || '', steps, resources: r.data.resources || '', notes: r.data.notes || '' };
      addLessonPlan(p); setTitle(''); setOpenId(p.id); toast('Lesson plan generated.', 'success');
    };
    const open = lessonPlans.find(p => p.id === openId);
    if (open) return <LessonDetail plan={open} onBack={() => setOpenId(null)} onUpdate={updateLessonPlan} />;
    return (
      <div className="space-y-4">
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); create(); }}>
          <input className={`${inp} flex-1`} placeholder="New lesson plan title" value={title} onChange={e => setTitle(e.target.value)} />
          <button className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />New Plan</button>
          <button type="button" onClick={generate} disabled={gen} title="Generate a lesson plan with AI" className="flex items-center gap-1.5 border border-purple-300 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm disabled:opacity-50"><Sparkles className="h-4 w-4" />{gen ? 'Generating…' : 'Generate'}</button>
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map(p => {
            const done = p.steps.filter(s => s.done).length;
            const pct = p.steps.length ? Math.round(done / p.steps.length * 100) : 0;
            return (
              <div key={p.id} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300" onClick={() => setOpenId(p.id)}>
                <div className="flex justify-between items-start gap-2">
                  <div><p className="font-semibold text-gray-900">{p.title}</p><p className="text-xs text-gray-400">{p.grade}{p.date ? ` · ${new Date(p.date).toLocaleDateString('en-GB')}` : ''}</p></div>
                  <button onClick={e => { e.stopPropagation(); deleteLessonPlan(p.id); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {p.steps.length > 0 && <div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div><p className="text-xs text-gray-400 mt-1">{done}/{p.steps.length} steps</p></div>}
              </div>
            );
          })}
          {list.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-6">No lesson plans for {subject} yet.</p>}
        </div>
      </div>
    );
  }

  function LessonDetail({ plan, onBack, onUpdate }: { plan: LessonPlan; onBack: () => void; onUpdate: (id: string, u: Partial<LessonPlan>) => void }) {
    const [step, setStep] = useState('');
    const toggle = (id: string) => onUpdate(plan.id, { steps: plan.steps.map(s => s.id === id ? { ...s, done: !s.done } : s) });
    const addStep = () => { if (!step.trim()) return; const s: ProjectTask = { id: uid('st'), text: step.trim(), done: false }; onUpdate(plan.id, { steps: [...plan.steps, s] }); setStep(''); };
    const delStep = (id: string) => onUpdate(plan.id, { steps: plan.steps.filter(s => s.id !== id) });
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4" />All plans</button>
          <div className="flex gap-2">
            <button onClick={() => printLessonPlan(plan, branding)} className={cardBtn}><Printer className="h-4 w-4" />Print</button>
            <button onClick={() => printLessonPlan(plan, branding, { pdf: true })} className={cardBtn} title="Export to PDF"><FileDown className="h-4 w-4" /></button>
          </div>
        </div>
        <div><h2 className="text-lg font-bold text-gray-900">{plan.title}</h2><p className="text-sm text-gray-500">{plan.subject} · {plan.grade}</p></div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Objectives</label>
          <textarea defaultValue={plan.objectives} onBlur={e => onUpdate(plan.id, { objectives: e.target.value })} rows={2} className={`${inp} w-full`} placeholder="What pupils should learn…" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Lesson steps</p>
          <div className="space-y-1.5">
            {plan.steps.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <button onClick={() => toggle(s.id)} className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>{s.done && <Check className="h-3.5 w-3.5 text-white" />}</button>
                <span className={`flex-1 text-sm ${s.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{s.text}</span>
                <button onClick={() => delStep(s.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <form className="flex gap-2 mt-2" onSubmit={e => { e.preventDefault(); addStep(); }}>
            <input className={`${inp} flex-1`} placeholder="Add a step…" value={step} onChange={e => setStep(e.target.value)} />
            <button className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Add</button>
          </form>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Resources</label><textarea defaultValue={plan.resources} onBlur={e => onUpdate(plan.id, { resources: e.target.value })} rows={2} className={`${inp} w-full`} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Notes</label><textarea defaultValue={plan.notes} onBlur={e => onUpdate(plan.id, { notes: e.target.value })} rows={2} className={`${inp} w-full`} /></div>
        </div>
      </div>
    );
  }

  // ---------- Question bank (reuses gha_quiz_questions) ----------
  function BankTab({ subject, grade }: { subject: string; grade: string }) {
    const { quizQuestions, addQuizQuestion, deleteQuizQuestion } = ctx;
    const list = quizQuestions.filter(q => q.subject === subject);
    const [q, setQ] = useState({ question: '', options: ['', '', '', ''], correctIndex: 0, marks: '1', short: false });
    const [paperTitle, setPaperTitle] = useState('Class Test');
    const [gen, setGen] = useState(false);
    const generate = async () => {
      const topic = window.prompt(`Generate questions for ${subject} about…`) || '';
      if (!topic.trim()) return;
      const n = parseInt(window.prompt('How many questions? (1–20)', '5') || '5') || 5;
      setGen(true);
      const r = await generateResource('quiz', { subject, grade, topic: topic.trim(), count: n });
      setGen(false);
      if (!r.ok) { toast(r.error, 'error'); return; }
      (r.data.questions || []).forEach(g => addQuizQuestion({
        id: uid('qq'), subject, grade: grade || undefined, question: g.question,
        options: g.options || [], correctIndex: g.correctIndex ?? 0, marks: g.marks || 1,
      }));
      toast(`Added ${(r.data.questions || []).length} generated question(s).`, 'success');
    };
    const add = () => {
      if (!q.question.trim()) { toast('Enter the question.', 'warning'); return; }
      const options = q.short ? [] : q.options.map(o => o.trim()).filter(Boolean);
      const item: QuizQuestion = { id: uid('qq'), subject, grade: grade || undefined, question: q.question.trim(), options, correctIndex: q.short ? undefined : q.correctIndex, marks: parseInt(q.marks) || 1 };
      addQuizQuestion(item); setQ({ ...q, question: '', options: ['', '', '', ''] }); toast('Question added to the bank.', 'success');
    };
    const doPrint = (withAnswers: boolean, pdf = false) => {
      if (list.length === 0) { toast('Add some questions first.', 'warning'); return; }
      printTestPaper({ title: paperTitle || 'Test', subject, grade: grade || undefined, questions: list, branding, withAnswers, pdf });
    };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Add a question to {subject}</p>
          <div className="flex gap-2">
            <textarea className={`${inp} flex-1`} rows={2} placeholder="Question text" value={q.question} onChange={e => setQ({ ...q, question: e.target.value })} />
            <input className={`${inp} w-16`} type="number" min="1" title="Marks" value={q.marks} onChange={e => setQ({ ...q, marks: e.target.value })} />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={q.short} onChange={e => setQ({ ...q, short: e.target.checked })} />Short-answer (no options)</label>
          {!q.short && q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={q.correctIndex === i} onChange={() => setQ({ ...q, correctIndex: i })} title="Mark correct" />
              <input className={`${inp} flex-1`} placeholder={`Option ${'ABCD'[i]}`} value={o} onChange={e => setQ({ ...q, options: q.options.map((x, j) => j === i ? e.target.value : x) })} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={add} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add to bank</button>
            <button onClick={generate} disabled={gen} title="Generate questions with AI" className="flex items-center gap-1.5 border border-purple-300 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm disabled:opacity-50"><Sparkles className="h-4 w-4" />{gen ? 'Generating…' : 'Generate'}</button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Bank ({list.length})</p>
          <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
            {list.map(x => (
              <div key={x.id} className="flex items-start gap-2 px-3 py-2 text-sm">
                <span className="flex-1"><span className="text-gray-900">{x.question}</span><span className="block text-xs text-gray-400">{x.marks ?? 1} mark(s) · {x.options.length ? `${x.options.length} options` : 'short answer'}</span></span>
                <button onClick={() => deleteQuizQuestion(x.id)} className="p-1 text-red-400 hover:bg-red-50 rounded flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {list.length === 0 && <p className="px-3 py-6 text-sm text-gray-400 text-center">No questions for {subject} yet. Shared with the Tools → Quiz Builder bank.</p>}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <input className={`${inp} w-full`} placeholder="Test paper title" value={paperTitle} onChange={e => setPaperTitle(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => doPrint(false)} className={cardBtn}><Printer className="h-4 w-4" />Test Paper</button>
              <button onClick={() => doPrint(false, true)} className={cardBtn} title="Test paper PDF"><FileDown className="h-4 w-4" /></button>
              <button onClick={() => doPrint(true)} className={cardBtn}><Printer className="h-4 w-4" />Answer Key</button>
              <button onClick={() => doPrint(true, true)} className={cardBtn} title="Answer key PDF"><FileDown className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Group work manager ----------
  function GroupsTab({ subject, grade }: { subject: string; grade: string }) {
    const { workGroups, addWorkGroup, updateWorkGroup, deleteWorkGroup, students } = ctx;
    const list = workGroups.filter(g => g.subject === subject && g.grade === grade);
    const classPupils = students.filter(s => s.grade === grade && (!s.status || s.status === 'active')).map(s => s.name);
    const [count, setCount] = useState('3');
    const [groupName, setGroupName] = useState('');

    const autoDistribute = () => {
      const n = Math.max(1, parseInt(count) || 1);
      if (classPupils.length === 0) { toast(`No active pupils in ${grade}.`, 'warning'); return; }
      const shuffled = [...classPupils].sort(() => Math.random() - 0.5);
      list.forEach(g => deleteWorkGroup(g.id));
      const buckets: string[][] = Array.from({ length: n }, () => []);
      shuffled.forEach((name, i) => buckets[i % n].push(name));
      buckets.forEach((members, i) => addWorkGroup({ id: uid('wg'), subject, grade, name: `Group ${i + 1}`, members, task: '', notes: '' }));
      toast(`Split ${shuffled.length} pupils into ${n} groups.`, 'success');
    };
    const addEmpty = () => { addWorkGroup({ id: uid('wg'), subject, grade, name: groupName.trim() || `Group ${list.length + 1}`, members: [], task: '', notes: '' }); setGroupName(''); };

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-2">
          <div><label className="block text-xs text-gray-500 mb-1">Groups</label><input className={`${inp} w-20`} type="number" min="1" value={count} onChange={e => setCount(e.target.value)} /></div>
          <button onClick={autoDistribute} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Shuffle className="h-4 w-4" />Auto-split {grade} ({classPupils.length})</button>
          <span className="text-gray-300">|</span>
          <input className={`${inp} w-40`} placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
          <button onClick={addEmpty} className={cardBtn}><Plus className="h-4 w-4" />Add empty group</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(g => <GroupCard key={g.id} group={g} onUpdate={updateWorkGroup} onDelete={() => deleteWorkGroup(g.id)} />)}
          {list.length === 0 && <p className="text-sm text-gray-400 col-span-3 text-center py-6">No groups yet — auto-split the class or add one.</p>}
        </div>
      </div>
    );
  }

  function GroupCard({ group, onUpdate, onDelete }: { group: WorkGroup; onUpdate: (id: string, u: Partial<WorkGroup>) => void; onDelete: () => void }) {
    const [member, setMember] = useState('');
    return (
      <div className="border border-gray-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <input defaultValue={group.name} onBlur={e => onUpdate(group.id, { name: e.target.value })} className="font-semibold text-gray-900 bg-transparent focus:outline-none min-w-0 flex-1" />
          <button onClick={onDelete} className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <div className="flex flex-wrap gap-1">
          {group.members.map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full px-2 py-0.5">
              {m}<button onClick={() => onUpdate(group.id, { members: group.members.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {group.members.length === 0 && <span className="text-xs text-gray-400">No members</span>}
        </div>
        <form className="flex gap-1" onSubmit={e => { e.preventDefault(); if (member.trim()) { onUpdate(group.id, { members: [...group.members, member.trim()] }); setMember(''); } }}>
          <input className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Add member…" value={member} onChange={e => setMember(e.target.value)} />
          <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Add</button>
        </form>
        <input defaultValue={group.task} onBlur={e => onUpdate(group.id, { task: e.target.value })} className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="Task / assignment…" />
      </div>
    );
  }

  // ---------- Class rules ----------
  function RulesTab({ grade }: { grade: string }) {
    const { classRules, addClassRule, updateClassRule, deleteClassRule } = ctx;
    const list = classRules.filter(r => r.classGrade === grade).sort((a, b) => a.order - b.order);
    const [text, setText] = useState('');
    const add = () => { if (!text.trim()) return; addClassRule({ id: uid('cr'), classGrade: grade, text: text.trim(), order: list.length }); setText(''); };
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-900">Rules for {grade}</p>
          <div className="flex gap-2">
            <button onClick={() => printClassRules(grade, list, branding)} className={cardBtn}><Printer className="h-4 w-4" />Print</button>
            <button onClick={() => printClassRules(grade, list, branding, { pdf: true })} className={cardBtn} title="Export to PDF"><FileDown className="h-4 w-4" /></button>
          </div>
        </div>
        <ol className="space-y-2">
          {list.map((r, i) => (
            <li key={r.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-gray-400 font-semibold w-5">{i + 1}.</span>
              <input defaultValue={r.text} onBlur={e => updateClassRule(r.id, { text: e.target.value })} className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none" />
              <button onClick={() => deleteClassRule(r.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
          {list.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No rules yet.</p>}
        </ol>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
          <input className={`${inp} flex-1`} placeholder="Add a class rule…" value={text} onChange={e => setText(e.target.value)} />
          <button className={`${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}>Add</button>
        </form>
      </div>
    );
  }

  // ---------- Roles & responsibilities ----------
  function RolesTab({ grade }: { grade: string }) {
    const { classRoles, addClassRole, updateClassRole, deleteClassRole, students } = ctx;
    const list = classRoles.filter(r => r.classGrade === grade);
    const classPupils = students.filter(s => s.grade === grade && (!s.status || s.status === 'active'));
    const [form, setForm] = useState({ role: '', studentName: '', duties: '' });
    const add = () => {
      if (!form.role.trim()) { toast('Enter the role name.', 'warning'); return; }
      addClassRole({ id: uid('crole'), classGrade: grade, role: form.role.trim(), studentName: form.studentName || undefined, duties: form.duties.trim() });
      setForm({ role: '', studentName: '', duties: '' }); toast('Role added.', 'success');
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-900">Roles for {grade}</p>
          <div className="flex gap-2">
            <button onClick={() => printClassRoles(grade, list, branding)} className={cardBtn}><Printer className="h-4 w-4" />Print</button>
            <button onClick={() => printClassRoles(grade, list, branding, { pdf: true })} className={cardBtn} title="Export to PDF"><FileDown className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Role', 'Pupil', 'Responsibilities', ''].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(r => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium text-gray-800">{r.role}</td>
                  <td className="px-3 py-2">
                    <select defaultValue={r.studentName || ''} onChange={e => updateClassRole(r.id, { studentName: e.target.value || undefined })} className="text-sm border border-gray-200 rounded px-1 py-0.5">
                      <option value="">—</option>
                      {classPupils.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><input defaultValue={r.duties} onBlur={e => updateClassRole(r.id, { duties: e.target.value })} className="w-full text-sm bg-transparent focus:outline-none" placeholder="Duties…" /></td>
                  <td className="px-3 py-2 text-right"><button onClick={() => deleteClassRole(r.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-400">No roles yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-2">
          <input className={`${inp} w-40`} placeholder="Role (e.g. Monitor)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          <select className={inp} value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })}>
            <option value="">Assign pupil…</option>
            {classPupils.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <input className={`${inp} flex-1 min-w-[160px]`} placeholder="Responsibilities" value={form.duties} onChange={e => setForm({ ...form, duties: e.target.value })} />
          <button onClick={add} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add role</button>
        </div>
      </div>
    );
  }

  // ---------- Class inventory (links Library) ----------
  function InventoryTab({ grade }: { grade: string }) {
    const { classInventory, addClassInventoryItem, updateClassInventoryItem, deleteClassInventoryItem, libraryBooks, bookLoans } = ctx;
    const list = classInventory.filter(i => i.classGrade === grade);
    const bookTitle = (id: string) => libraryBooks.find(b => b.id === id)?.title || 'Removed book';
    const available = (bookId: string) => { const b = libraryBooks.find(x => x.id === bookId); if (!b) return 0; return Math.max(0, b.totalCopies - bookLoans.filter(l => l.bookId === bookId && !l.returnedDate).length); };
    const [form, setForm] = useState({ name: '', quantity: '1', bookId: '', notes: '' });
    const add = () => {
      const name = form.bookId ? bookTitle(form.bookId) : form.name.trim();
      if (!name) { toast('Enter an item name or pick a library book.', 'warning'); return; }
      addClassInventoryItem({ id: uid('ci'), classGrade: grade, name, quantity: parseInt(form.quantity) || 1, bookId: form.bookId || undefined, notes: form.notes.trim() || undefined });
      setForm({ name: '', quantity: '1', bookId: '', notes: '' }); toast('Item added.', 'success');
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-900">Inventory for {grade}</p>
          <div className="flex gap-2">
            <button onClick={() => printClassInventory(grade, list, bookTitle, branding)} className={cardBtn}><Printer className="h-4 w-4" />Print</button>
            <button onClick={() => printClassInventory(grade, list, bookTitle, branding, { pdf: true })} className={cardBtn} title="Export to PDF"><FileDown className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Item', 'Qty', 'Notes', ''].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(i => (
                <tr key={i.id}>
                  <td className="px-3 py-2 text-gray-800">{i.name}{i.bookId && <span className="ml-1 text-xs text-blue-600">📚 {available(i.bookId)} available in library</span>}</td>
                  <td className="px-3 py-2 w-24"><input type="number" min="0" defaultValue={i.quantity} onBlur={e => updateClassInventoryItem(i.id, { quantity: parseInt(e.target.value) || 0 })} className="w-16 text-sm border border-gray-200 rounded px-1 py-0.5" /></td>
                  <td className="px-3 py-2"><input defaultValue={i.notes || ''} onBlur={e => updateClassInventoryItem(i.id, { notes: e.target.value })} className="w-full text-sm bg-transparent focus:outline-none" placeholder="Notes…" /></td>
                  <td className="px-3 py-2 text-right"><button onClick={() => deleteClassInventoryItem(i.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-400">No inventory items yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-2">
          <input className={`${inp} w-44`} placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, bookId: '' })} />
          <div><label className="block text-xs text-gray-500 mb-1">…or link a library book</label>
            <select className={inp} value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })}>
              <option value="">— none —</option>
              {libraryBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <input className={`${inp} w-20`} type="number" min="1" title="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          <button onClick={add} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add item</button>
        </div>
      </div>
    );
  }

  // ---------- Class wishlist (requests to admin) ----------
  function WishlistTab({ grade }: { grade: string }) {
    const { classWishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem } = ctx;
    const isAdmin = currentUser?.role === 'Admin';
    const rank = { high: 0, medium: 1, low: 2 } as const;
    const list = classWishlist.filter(i => i.classGrade === grade).sort((a, b) => rank[a.priority] - rank[b.priority]);
    const [form, setForm] = useState<{ item: string; reason: string; priority: WishlistItem['priority'] }>({ item: '', reason: '', priority: 'medium' });
    const PRIORITY_STYLE: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-800', low: 'bg-gray-100 text-gray-600' };
    const STATUS_STYLE: Record<string, string> = { requested: 'bg-blue-50 text-blue-700', approved: 'bg-green-100 text-green-700', declined: 'bg-red-50 text-red-600', fulfilled: 'bg-gray-100 text-gray-600' };
    const STATUSES: WishlistItem['status'][] = ['requested', 'approved', 'declined', 'fulfilled'];
    const add = () => {
      if (!form.item.trim()) { toast('Enter what is needed.', 'warning'); return; }
      addWishlistItem({ id: uid('wish'), classGrade: grade, item: form.item.trim(), reason: form.reason.trim() || undefined, priority: form.priority, status: 'requested', createdAt: new Date().toISOString() });
      setForm({ item: '', reason: '', priority: 'medium' }); toast('Request added.', 'success');
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-900">Wishlist for {grade} <span className="text-xs font-normal text-gray-400">— requests to admin, by importance</span></p>
          <div className="flex gap-2">
            <button onClick={() => printWishlist(grade, list, branding)} className={cardBtn}><Printer className="h-4 w-4" />Print</button>
            <button onClick={() => printWishlist(grade, list, branding, { pdf: true })} className={cardBtn} title="Export to PDF"><FileDown className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="space-y-2">
          {list.map(i => (
            <div key={i.id} className="border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 capitalize ${PRIORITY_STYLE[i.priority]}`}>{i.priority}</span>
              <div className="flex-1 min-w-[160px]"><p className="font-medium text-gray-900">{i.item}</p>{i.reason && <p className="text-xs text-gray-500">{i.reason}</p>}</div>
              {isAdmin
                ? <select value={i.status} onChange={e => updateWishlistItem(i.id, { status: e.target.value as WishlistItem['status'] })} className={`text-xs rounded-full px-2 py-1 border-none capitalize ${STATUS_STYLE[i.status]}`}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                : <span className={`text-xs rounded-full px-2 py-1 capitalize ${STATUS_STYLE[i.status]}`}>{i.status}</span>}
              <button onClick={() => deleteWishlistItem(i.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No requests yet.</p>}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-2">
          <input className={`${inp} w-44`} placeholder="What is needed" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} />
          <input className={`${inp} flex-1 min-w-[160px]`} placeholder="Reason (optional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as WishlistItem['priority'] })}>
            <option value="high">High priority</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <button onClick={add} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add request</button>
        </div>
      </div>
    );
  }
}
