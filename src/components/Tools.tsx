import { useState } from 'react';
import {
  Trophy, Users2, Plus, Trash2, Printer, Download, ArrowLeft, Check, Lock, Pencil,
} from 'lucide-react';
import { useAppContext, Competition, CompetitionEntry, House } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import { leaderboard, entryPoints } from '../lib/scoring';
import { printJudgesSheet, printResults } from '../lib/scoreDocs';
import { exportCSV } from '../lib/exports';

const TYPES: Competition['type'][] = ['Sports', 'Quiz', 'Debate', 'Spelling Bee', 'Other'];
const DEFAULT_PLACES = [
  { label: '1st', points: 10 }, { label: '2nd', points: 8 }, { label: '3rd', points: 6 }, { label: '4th', points: 4 },
];

export function Tools() {
  const ctx = useAppContext();
  const { houses, competitions, competitionEntries, branding, addCompetition, deleteCompetition } = ctx;
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'scoreboard' | 'houses'>('scoreboard');
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
        <div className="px-3 py-3 border-b border-gray-200 flex gap-1">
          {([['scoreboard', 'Competition Scoreboard', Trophy], ['houses', 'Houses', Users2]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => { setTab(id); setOpenId(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${tab === id ? `${tc.light} ${tc.text}` : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'houses' && <HousesTab />}

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
                <div key={b.house.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${b.winner && b.total > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-center font-bold text-gray-400">{b.rank}</span>
                    <span className="w-3 h-3 rounded-sm" style={{ background: b.house.colour }} />
                    <span className="font-medium text-gray-900">{b.house.name}</span>
                    {b.winner && b.total > 0 && <span>🏆</span>}
                  </span>
                  <span className="font-bold text-gray-900">{b.total}</span>
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
