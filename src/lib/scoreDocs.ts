import { Competition, CompetitionEntry, House, SchoolBranding } from '../context/AppContext';
import { leaderboard, entryPoints } from './scoring';

const esc = (s: string) => (s || '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function open(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function head(title: string, branding: SchoolBranding, sub: string) {
  return `<div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid #12274a;padding-bottom:8px;margin-bottom:6px">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" style="width:52px;height:52px;object-fit:contain" />` : ''}
    <div style="flex:1;text-align:center"><div style="font-size:24px;font-weight:800;letter-spacing:.02em;color:#111">${esc(branding.schoolName) || 'SCHOOL'}</div>
    <div style="font-size:13px;font-weight:700;color:#374151">${esc(title)}</div></div></div>
    <div style="text-align:center;font-size:15px;font-weight:700;border:1px solid #111;padding:4px;margin-bottom:6px">${esc(sub)}</div>`;
}

const LEGEND = (comp: Competition) => `
  <div style="display:flex;gap:12px;margin-top:12px;font-size:11px">
    <div style="border:1px solid #111;padding:8px;min-width:150px">
      <div style="font-weight:700;text-decoration:underline;margin-bottom:4px">Position Score Sheet</div>
      ${comp.places.map(p => `<div>${esc(p.label)} = ${p.points} Pts</div>`).join('')}
    </div>
    <div style="border:1px solid #111;padding:8px;flex:1">
      <div style="font-weight:700;text-align:center">*NOTE*</div>
      <div>In case of a Draw, points are divided equally with their respective positions that follow.</div>
      <div style="margin-top:4px"><b>Example:</b> 1st (${comp.places[0]?.points ?? 10}) + 2nd (${comp.places[1]?.points ?? 8}) = ${((comp.places[0]?.points ?? 10) + (comp.places[1]?.points ?? 8)) / 2} pts each.</div>
    </div>
  </div>`;

const shell = (title: string, body: string) =>
  `<!DOCTYPE html><html><head><title>${esc(title)}</title><style>
    @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;padding:6px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th,td{border:1px solid #111;padding:5px 6px;font-size:11px;text-align:center}
    th{background:#f3f4f6}
    td.name{text-align:left}
    @media print{button{display:none}}
  </style></head><body>${body}<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`;

// Blank judges score sheet (mirrors the school's paper form).
export function printJudgesSheet(comp: Competition, houses: House[], branding: SchoolBranding) {
  const posCols = comp.places.map(p => `<th>${esc(p.label)} POSITION</th>`).join('');
  const rowsPerHouse = 3;
  const body = houses.map(h => {
    const rows = Array.from({ length: rowsPerHouse }).map((_, i) => `<tr>
      <td class="name"></td><td class="name"></td><td></td>
      ${i === Math.floor(rowsPerHouse / 2) ? `<td style="font-weight:700;background:${h.colour}22">${esc(h.name.toUpperCase())}</td>` : '<td></td>'}
      ${comp.places.map(() => '<td></td>').join('')}<td></td></tr>`).join('');
    return rows;
  }).join('');
  open(shell('Judges Score Sheet', `
    ${head('JUDGES SCORE SHEET', branding, `${comp.type.toUpperCase()} ACTIVITY: ${esc(comp.name)}`)}
    <table><thead><tr><th>FIRST NAME</th><th>LAST NAME</th><th>GRADE</th><th>TEAM COLOUR</th>${posCols}<th>POINTS EARNED</th></tr></thead>
    <tbody>${body}</tbody></table>
    ${LEGEND(comp)}`));
}

// Filled results sheet + final leaderboard/winner.
export function printResults(comp: Competition, houses: House[], entries: CompetitionEntry[], branding: SchoolBranding) {
  const compEntries = entries.filter(e => e.competitionId === comp.id);
  const board = leaderboard(compEntries, houses, comp);
  const houseName = (id: string) => houses.find(h => h.id === id)?.name || '—';
  const posLabel = (e: CompetitionEntry) => comp.scoringMode === 'points' ? (e.rawPoints ?? '') : (e.position ? (comp.places[e.position - 1]?.label || `${e.position}`) : '');
  const rows = [...compEntries]
    .sort((a, b) => entryPoints(b, compEntries, comp) - entryPoints(a, compEntries, comp))
    .map(e => `<tr><td class="name">${esc(e.name || houseName(e.houseId) + ' (team)')}</td><td>${esc(e.grade || '')}</td><td>${esc(houseName(e.houseId))}</td><td>${esc(String(posLabel(e)))}</td><td style="font-weight:700">${entryPoints(e, compEntries, comp)}</td></tr>`).join('');
  const winner = board.find(b => b.winner);
  open(shell('Results', `
    ${head('RESULTS', branding, `${comp.type.toUpperCase()}: ${esc(comp.name)} — ${new Date(comp.date).toLocaleDateString('en-GB')}`)}
    <div style="display:flex;gap:12px;align-items:flex-start">
      <table style="flex:2"><thead><tr><th>Participant</th><th>Grade</th><th>House</th><th>${comp.scoringMode === 'points' ? 'Points' : 'Position'}</th><th>Earned</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No entries</td></tr>'}</tbody></table>
      <table style="flex:1"><thead><tr><th colspan="3">LEADERBOARD</th></tr><tr><th>Rank</th><th>House</th><th>Points</th></tr></thead><tbody>
        ${board.map(b => `<tr style="${b.winner ? 'background:#fef9c3;font-weight:700' : ''}"><td>${b.rank}</td><td style="text-align:left"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${b.house.colour};margin-right:4px"></span>${esc(b.house.name)}</td><td>${b.total}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${winner ? `<div style="text-align:center;margin-top:12px;font-size:15px;font-weight:800;color:#12274a">🏆 Winner: ${esc(winner.house.name)} House — ${winner.total} points</div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:36px"><div style="border-top:1px solid #111;padding-top:4px;text-align:center;font-size:11px">Head Judge</div><div style="border-top:1px solid #111;padding-top:4px;text-align:center;font-size:11px">Verified By</div></div>`));
}
