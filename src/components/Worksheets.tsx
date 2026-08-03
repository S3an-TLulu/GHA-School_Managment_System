import { useState } from 'react';
import {
  PencilRuler, Plus, Trash2, Printer, FileDown, RefreshCw, Lock, Unlock,
  ChevronUp, ChevronDown, Save, FilePlus, Copy, Eye, Sliders, Send,
} from 'lucide-react';
import { useAppContext, Worksheet, WorksheetSection } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { useToast } from './ToastProvider';
import { GENERATORS, getGenerator } from '../lib/worksheet/generators';
import { CATEGORY_LABELS, GeneratorCategory, SettingSpec } from '../lib/worksheet/types';
import { GRADES } from '../lib/worksheet/grades';
import { randomSeed } from '../lib/worksheet/rng';
import { printWorksheet, printWorksheetPack, sectionProblems } from '../lib/worksheetDocs';

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptyLayout = () => ({ orientation: 'portrait' as const, columns: 2, fontSize: 13, spacing: 10, bw: false, pageNumbers: true });

const newSection = (generatorId: string): WorksheetSection => {
  const gen = getGenerator(generatorId)!;
  return { id: uid('sec'), generatorId, settings: { ...gen.defaults }, count: 10, heading: gen.label, seed: randomSeed(), locked: false };
};

export function Worksheets() {
  const { worksheets, addWorksheet, updateWorksheet, deleteWorksheet, addQuizQuestion, branding, subjects } = useAppContext();
  const tc = useThemeClasses();
  const { toast } = useToast();

  const blank = (): Worksheet => ({
    id: uid('ws'), title: 'Numeracy Worksheet', subject: subjects[0]?.name || 'Mathematics',
    grade: GRADES[3], teacher: '', dateLabel: '', instructions: '', timeAllowed: '',
    layout: emptyLayout(), sections: [], createdAt: new Date().toISOString(),
  });

  const [ws, setWs] = useState<Worksheet>(blank);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [addGen, setAddGen] = useState(GENERATORS[0].id);
  const [showPreview, setShowPreview] = useState(true);
  const [copies, setCopies] = useState(1);

  const set = (patch: Partial<Worksheet>) => setWs(w => ({ ...w, ...patch }));
  const setLayout = (patch: Partial<Worksheet['layout']>) => setWs(w => ({ ...w, layout: { ...w.layout, ...patch } }));
  const patchSection = (id: string, patch: Partial<WorksheetSection>) =>
    setWs(w => ({ ...w, sections: w.sections.map(s => s.id === id ? { ...s, ...patch } : s) }));

  const addSection = () => setWs(w => ({ ...w, sections: [...w.sections, newSection(addGen)] }));
  const removeSection = (id: string) => setWs(w => ({ ...w, sections: w.sections.filter(s => s.id !== id) }));
  const moveSection = (i: number, dir: -1 | 1) => setWs(w => {
    const arr = w.sections.slice(); const j = i + dir;
    if (j < 0 || j >= arr.length) return w;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...w, sections: arr };
  });
  // Reroll only the questions that aren't individually locked (keeps their salts).
  const rerollSection = (s: WorksheetSection): WorksheetSection => {
    const locked = new Set(s.lockedItems ?? []);
    const salts = { ...(s.salts ?? {}) };
    for (let i = 0; i < s.count; i++) if (!locked.has(i)) salts[i] = (salts[i] ?? 0) + 1;
    return { ...s, salts };
  };
  const regenerate = (id: string) => setWs(w => ({ ...w, sections: w.sections.map(s => s.id === id ? rerollSection(s) : s) }));
  const regenerateAll = () => setWs(w => ({ ...w, sections: w.sections.map(s => s.locked ? s : rerollSection(s)) }));
  const rerollItem = (id: string, i: number) => setWs(w => ({ ...w, sections: w.sections.map(s => s.id === id ? { ...s, salts: { ...(s.salts ?? {}), [i]: (s.salts?.[i] ?? 0) + 1 } } : s) }));
  const toggleItemLock = (id: string, i: number) => setWs(w => ({ ...w, sections: w.sections.map(s => {
    if (s.id !== id) return s;
    const set = new Set(s.lockedItems ?? []);
    set.has(i) ? set.delete(i) : set.add(i);
    return { ...s, lockedItems: [...set] };
  }) }));
  const applyGradeDefaults = () => setWs(w => ({ ...w, sections: w.sections.map(s => { const g = getGenerator(s.generatorId); return g ? { ...s, settings: { ...g.defaults } } : s; }) }));

  const sendToBank = (s: WorksheetSection) => {
    const gen = getGenerator(s.generatorId);
    if (!gen?.bankable) { toast('This question type can’t be sent to the bank.', 'warning'); return; }
    const problems = sectionProblems(s, ws.grade).filter(p => p.bankQuestion);
    if (!problems.length) { toast('No bank-ready questions in this section.', 'warning'); return; }
    problems.forEach(p => addQuizQuestion({
      id: `qq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, subject: ws.subject || 'Mathematics',
      grade: ws.grade || undefined, question: p.bankQuestion!, options: [], type: 'short',
      answerText: p.bankAnswer || undefined, marks: p.marks || 1,
    }));
    toast(`Added ${problems.length} question(s) to the quiz bank.`, 'success');
  };

  const saveTemplate = () => {
    if (!ws.sections.length) { toast('Add at least one section first.', 'warning'); return; }
    if (savedId) { updateWorksheet(savedId, ws); toast('Worksheet updated.', 'success'); }
    else { addWorksheet(ws); setSavedId(ws.id); toast('Worksheet saved.', 'success'); }
  };
  const loadTemplate = (t: Worksheet) => { setWs({ ...t }); setSavedId(t.id); toast(`Loaded “${t.title}”.`, 'info'); };
  const duplicate = (t: Worksheet) => { const copy = { ...t, id: uid('ws'), title: `${t.title} (copy)`, createdAt: new Date().toISOString() }; addWorksheet(copy); setWs(copy); setSavedId(copy.id); toast('Duplicated.', 'success'); };
  const newSheet = () => { setWs(blank()); setSavedId(null); };

  const doPrint = (withAnswers: boolean, pdf = false) => {
    if (!ws.sections.length) { toast('Add a section first.', 'warning'); return; }
    if (copies > 1) printWorksheetPack(ws, branding, { copies, withAnswers, pdf });
    else printWorksheet(ws, branding, { withAnswers, pdf });
  };

  const inp = 'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm';
  const totalMarks = ws.sections.reduce((sum, s) => sum + sectionProblems(s, ws.grade).reduce((a, p) => a + (p.marks || 0), 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><PencilRuler className="h-6 w-6" />Worksheets</h1>
          <p className="text-gray-600">Generate printable numeracy worksheets — unlimited, offline, with an answer key.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => doPrint(false)} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Printer className="h-4 w-4" />Print</button>
          <button title="Export worksheet to PDF" onClick={() => doPrint(false, true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm hover:bg-gray-50"><FileDown className="h-4 w-4" /></button>
          <button onClick={() => doPrint(true)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><Printer className="h-4 w-4" />Answer Key</button>
          <button title="Export answer key to PDF" onClick={() => doPrint(true, true)} className="flex items-center border border-gray-300 text-gray-700 px-2 py-2 rounded-lg text-sm hover:bg-gray-50"><FileDown className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Sheet info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-xs font-medium text-gray-500">Title<input className={`${inp} w-full mt-1`} value={ws.title} onChange={e => set({ title: e.target.value })} /></label>
        <label className="text-xs font-medium text-gray-500">Subject<input className={`${inp} w-full mt-1`} value={ws.subject} onChange={e => set({ subject: e.target.value })} /></label>
        <label className="text-xs font-medium text-gray-500">Class / Grade
          <select className={`${inp} w-full mt-1`} value={ws.grade} onChange={e => set({ grade: e.target.value })}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
        </label>
        <label className="text-xs font-medium text-gray-500">Teacher<input className={`${inp} w-full mt-1`} value={ws.teacher} onChange={e => set({ teacher: e.target.value })} /></label>
        <label className="text-xs font-medium text-gray-500">Date<input className={`${inp} w-full mt-1`} value={ws.dateLabel} onChange={e => set({ dateLabel: e.target.value })} placeholder="e.g. 3 Aug 2026" /></label>
        <label className="text-xs font-medium text-gray-500">Time allowed<input className={`${inp} w-full mt-1`} value={ws.timeAllowed} onChange={e => set({ timeAllowed: e.target.value })} placeholder="e.g. 30 min" /></label>
        <label className="text-xs font-medium text-gray-500 sm:col-span-2 lg:col-span-3">Instructions<input className={`${inp} w-full mt-1`} value={ws.instructions} onChange={e => set({ instructions: e.target.value })} placeholder="Optional instructions shown under the header" /></label>
      </div>

      {/* Layout */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <label className="text-xs font-medium text-gray-500">Orientation
          <select className={`${inp} block mt-1`} value={ws.layout.orientation} onChange={e => setLayout({ orientation: e.target.value as 'portrait' | 'landscape' })}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
        </label>
        <label className="text-xs font-medium text-gray-500">Columns
          <select className={`${inp} block mt-1`} value={ws.layout.columns} onChange={e => setLayout({ columns: parseInt(e.target.value) })}>{[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{c}</option>)}</select>
        </label>
        <label className="text-xs font-medium text-gray-500">Font size
          <input type="number" min={9} max={20} className={`${inp} block mt-1 w-20`} value={ws.layout.fontSize} onChange={e => setLayout({ fontSize: parseInt(e.target.value) || 13 })} />
        </label>
        <label className="text-xs font-medium text-gray-500">Spacing
          <input type="number" min={0} max={40} className={`${inp} block mt-1 w-20`} value={ws.layout.spacing} onChange={e => setLayout({ spacing: parseInt(e.target.value) || 0 })} />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={ws.layout.bw} onChange={e => setLayout({ bw: e.target.checked })} />Black &amp; white</label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={ws.layout.pageNumbers} onChange={e => setLayout({ pageNumbers: e.target.checked })} />Footer</label>
        <label className="text-xs font-medium text-gray-500" title="Print several differentiated variants at once">Copies
          <input type="number" min={1} max={40} className={`${inp} block mt-1 w-20`} value={copies} onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))} />
        </label>
        <span className="text-xs text-gray-400 ml-auto">Total marks: <b className="text-gray-700">{totalMarks}</b></span>
      </div>

      {/* Sections builder */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-semibold text-gray-900">Sections ({ws.sections.length})</p>
          <div className="flex gap-2 items-center flex-wrap">
            <select value={addGen} onChange={e => setAddGen(e.target.value)} className={inp}>
              {(Object.keys(CATEGORY_LABELS) as GeneratorCategory[]).map(cat => (
                <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                  {GENERATORS.filter(g => g.category === cat).map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={addSection} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-1.5 rounded-lg text-sm`}><Plus className="h-4 w-4" />Add section</button>
            {ws.sections.length > 0 && <button onClick={regenerateAll} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"><RefreshCw className="h-4 w-4" />Regenerate all</button>}
            {ws.sections.length > 0 && <button onClick={applyGradeDefaults} title="Reset all sections to grade-appropriate defaults" className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"><Sliders className="h-4 w-4" />Grade defaults</button>}
          </div>
        </div>
        {ws.sections.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Pick a question type above and add a section to begin.</p>}
        {ws.sections.map((s, i) => <SectionEditor key={s.id} section={s} index={i} total={ws.sections.length} grade={ws.grade}
          onPatch={patchSection} onRemove={removeSection} onMove={moveSection} onRegenerate={regenerate}
          onRerollItem={rerollItem} onToggleItemLock={toggleItemLock} onSendToBank={sendToBank} showPreview={showPreview} />)}
      </div>

      {/* Save / templates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={saveTemplate} className={`flex items-center gap-1.5 ${tc.btn} text-white px-3 py-2 rounded-lg text-sm`}><Save className="h-4 w-4" />{savedId ? 'Update template' : 'Save template'}</button>
          <button onClick={newSheet} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><FilePlus className="h-4 w-4" />New sheet</button>
          <button onClick={() => setShowPreview(v => !v)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><Eye className="h-4 w-4" />{showPreview ? 'Hide' : 'Show'} preview</button>
        </div>
        {worksheets.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Saved worksheets</p>
            <div className="space-y-1.5">
              {worksheets.map(t => (
                <div key={t.id} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${savedId === t.id ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200'}`}>
                  <span className="font-medium text-gray-900 min-w-0 truncate">{t.title}</span>
                  <span className="text-xs text-gray-400">{t.grade} · {t.sections.length} section{t.sections.length !== 1 ? 's' : ''}</span>
                  <span className="flex-1" />
                  <button onClick={() => loadTemplate(t)} className="text-xs text-blue-600 hover:underline">Load</button>
                  <button onClick={() => duplicate(t)} title="Duplicate" className="p-1 text-gray-400 hover:text-gray-700"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (window.confirm(`Delete “${t.title}”?`)) { deleteWorksheet(t.id); if (savedId === t.id) setSavedId(null); } }} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionEditor({ section, index, total, grade, onPatch, onRemove, onMove, onRegenerate, onRerollItem, onToggleItemLock, onSendToBank, showPreview }: {
  section: WorksheetSection; index: number; total: number; grade: string;
  onPatch: (id: string, patch: Partial<WorksheetSection>) => void;
  onRemove: (id: string) => void; onMove: (i: number, dir: -1 | 1) => void; onRegenerate: (id: string) => void;
  onRerollItem: (id: string, i: number) => void; onToggleItemLock: (id: string, i: number) => void;
  onSendToBank: (s: WorksheetSection) => void; showPreview: boolean;
}) {
  const gen = getGenerator(section.generatorId);
  const setSetting = (key: string, value: unknown) => onPatch(section.id, { settings: { ...section.settings, [key]: value } });
  const inp = 'px-2 py-1 border border-gray-300 rounded text-sm';
  const preview = showPreview ? sectionProblems(section, grade).slice(0, 24) : [];
  const lockedItems = new Set(section.lockedItems ?? []);

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/40">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-900 text-sm">{gen?.label ?? section.generatorId}</span>
        <span className="flex-1" />
        {gen?.bankable && <button onClick={() => onSendToBank(section)} title="Add these questions to the Quiz Builder bank" className="p-1 text-gray-400 hover:text-gray-800"><Send className="h-4 w-4" /></button>}
        <label className="text-xs text-gray-500 flex items-center gap-1">Count
          <input type="number" min={1} max={60} className={`${inp} w-16`} value={section.count} onChange={e => onPatch(section.id, { count: Math.max(1, parseInt(e.target.value) || 1) })} />
        </label>
        <button onClick={() => onRegenerate(section.id)} title="Regenerate this section (keeps locked questions)" className="p-1 text-gray-500 hover:text-gray-800"><RefreshCw className="h-4 w-4" /></button>
        <button onClick={() => onPatch(section.id, { locked: !section.locked })} title={section.locked ? 'Locked (kept on Regenerate all)' : 'Unlocked'} className={`p-1 ${section.locked ? 'text-amber-600' : 'text-gray-400'} hover:text-gray-800`}>{section.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
        <button onClick={() => onMove(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
        <button onClick={() => onRemove(section.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
      </div>
      <input className={`${inp} w-full`} value={section.heading ?? ''} onChange={e => onPatch(section.id, { heading: e.target.value })} placeholder="Section heading" />
      <div className="flex flex-wrap gap-3">
        {(gen?.settings ?? []).map(spec => <SettingField key={spec.key} spec={spec} value={section.settings[spec.key]} onChange={v => setSetting(spec.key, v)} />)}
      </div>
      {showPreview && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Preview — hover a question to reroll or lock it</p>
          <div className="grid grid-cols-2 gap-x-3">
            {preview.map((p, k) => (
              <div key={k} className="group flex items-start gap-1 border-b border-gray-50 py-1">
                <span className="text-xs text-gray-400 mt-0.5 w-5 shrink-0">{k + 1}.</span>
                <div className="text-sm min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: p.questionHtml }} />
                <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                  <button onClick={() => onRerollItem(section.id, k)} title="Reroll this question" className="p-0.5 text-gray-400 hover:text-gray-800"><RefreshCw className="h-3 w-3" /></button>
                  <button onClick={() => onToggleItemLock(section.id, k)} title={lockedItems.has(k) ? 'Locked' : 'Lock this question'} className={`p-0.5 ${lockedItems.has(k) ? 'text-amber-600 opacity-100' : 'text-gray-400'} hover:text-gray-800`}>{lockedItems.has(k) ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}</button>
                </span>
              </div>
            ))}
            {preview.length === 0 && <p className="text-xs text-gray-400">No preview.</p>}
          </div>
          {section.count > preview.length && <p className="text-[11px] text-gray-400 mt-1">Showing {preview.length} of {section.count}.</p>}
        </div>
      )}
    </div>
  );
}

function SettingField({ spec, value, onChange }: { spec: SettingSpec; value: unknown; onChange: (v: unknown) => void }) {
  const inp = 'px-2 py-1 border border-gray-300 rounded text-sm';
  if (spec.type === 'toggle') {
    return <label className="text-xs text-gray-600 flex items-center gap-1.5"><input type="checkbox" checked={value !== false} onChange={e => onChange(e.target.checked)} />{spec.label}</label>;
  }
  if (spec.type === 'number') {
    return <label className="text-xs text-gray-500 flex flex-col">{spec.label}
      <input type="number" min={spec.min} max={spec.max} className={`${inp} w-24 mt-0.5`} value={value == null ? '' : String(value)} onChange={e => onChange(parseInt(e.target.value) || 0)} /></label>;
  }
  if (spec.type === 'text') {
    return <label className="text-xs text-gray-500 flex flex-col">{spec.label}
      <input className={`${inp} mt-0.5`} value={value == null ? '' : String(value)} onChange={e => onChange(e.target.value)} /></label>;
  }
  if (spec.type === 'select') {
    return <label className="text-xs text-gray-500 flex flex-col">{spec.label}
      <select className={`${inp} mt-0.5`} value={String(value ?? '')} onChange={e => onChange(e.target.value)}>{(spec.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
  }
  // multiselect
  const arr = Array.isArray(value) ? value.map(String) : [];
  const toggle = (v: string) => onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  return (
    <div className="text-xs text-gray-500">{spec.label}
      <div className="flex gap-2 mt-0.5 flex-wrap">
        {(spec.options ?? []).map(o => (
          <label key={o.value} className={`px-2 py-0.5 rounded border cursor-pointer ${arr.includes(o.value) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}>
            <input type="checkbox" className="hidden" checked={arr.includes(o.value)} onChange={() => toggle(o.value)} />{o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
