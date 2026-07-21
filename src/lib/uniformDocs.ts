import { UniformItem, UniformCategory, UniformSize, SchoolBranding } from '../context/AppContext';

const esc = (s: string) => (s || '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function open(html: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function shell(title: string, branding: SchoolBranding, body: string) {
  return `<!DOCTYPE html><html><head><title>${esc(title)}</title><style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1a2332; padding: 8px; }
    .hd { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #12274a; padding-bottom: 8px; margin-bottom: 14px; }
    .logo { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; }
    .school { font-size: 18px; font-weight: 800; color: #12274a; }
    .sub { font-size: 11px; color: #6b7280; }
    .doctitle { margin-left: auto; text-align: right; font-size: 13px; font-weight: 700; color: #12274a; text-transform: uppercase; letter-spacing: .05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: left; }
    th { background: #eef2f7; font-weight: 700; }
    .field { display: flex; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #eef2f7; }
    .field b { width: 150px; color: #6b7280; font-weight: 600; }
    .imgs { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .imgs figure { width: 150px; }
    .imgs img { width: 150px; height: 150px; object-fit: cover; border: 1px solid #cbd5e1; border-radius: 6px; }
    .imgs figcaption { font-size: 10px; color: #6b7280; text-align: center; margin-top: 2px; }
    .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
    .sig div { border-top: 1px solid #12274a; padding-top: 5px; font-size: 11px; color: #6b7280; text-align: center; }
    .blank td { height: 26px; }
    @media print { button { display: none; } }
  </style></head><body>
    <div class="hd">
      ${branding.logoUrl ? `<img class="logo" src="${branding.logoUrl}" alt="" />` : ''}
      <div><div class="school">${esc(branding.schoolName) || 'School'}</div><div class="sub">${esc(branding.address || '')}${branding.phone ? ' · ' + esc(branding.phone) : ''}</div></div>
      <div class="doctitle">${esc(title)}</div>
    </div>
    ${body}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;
}

// Full specification sheet for one uniform item (with images).
export function printItemSpec(item: UniformItem, category: UniformCategory | undefined, branding: SchoolBranding) {
  const row = (label: string, val?: string | boolean | number) =>
    `<div class="field"><b>${label}</b><span>${val === true ? 'Yes' : val === false ? 'No' : esc(String(val ?? '—'))}</span></div>`;
  const imgs = Object.entries({ Front: item.images.front, Back: item.images.back, Side: item.images.side, Detail: item.images.detail, Material: item.images.material })
    .filter(([, u]) => u)
    .map(([label, u]) => `<figure><img src="${u}" alt="" /><figcaption>${label}</figcaption></figure>`).join('');
  open(shell('Uniform Specification Sheet', branding, `
    <h2 style="margin-bottom:8px">${esc(item.name)} <span style="color:#6b7280;font-size:13px">(${esc(item.itemCode)})</span></h2>
    ${row('Category', category?.name)}
    ${row('Gender', item.gender)}
    ${row('Applicable Grades', item.grades.join(', '))}
    ${row('Description', item.description)}
    ${row('Material', item.material)}
    ${row('Colour', item.colour)}
    ${row('Sleeve Type', item.sleeveType)}
    ${row('Collar Type', item.collarType)}
    ${row('Season', item.season)}
    ${row('Badge Required', item.badgeRequired)}
    ${row('Logo Position', item.logoPosition)}
    ${row('Price', `K${item.price}`)}
    ${row('Status', item.status)}
    ${item.notes ? row('Notes', item.notes) : ''}
    ${imgs ? `<div class="imgs">${imgs}</div>` : ''}
  `));
}

// Blank catalogue sheet for filling in by hand.
export function printBlankCatalogue(branding: SchoolBranding) {
  const fields = ['Item Code', 'Item Name', 'Category', 'Gender', 'Applicable Grades', 'Description', 'Material', 'Colour', 'Sleeve Type', 'Collar Type', 'Season', 'Badge Required', 'Logo Position', 'Price', 'Status', 'Notes'];
  open(shell('Uniform Catalogue Sheet', branding, `
    ${fields.map(f => `<div class="field"><b>${f}</b><span>&nbsp;</span></div>`).join('')}
    <div class="imgs">
      <figure><div style="width:150px;height:150px;border:1px dashed #cbd5e1;border-radius:6px"></div><figcaption>Front View</figcaption></figure>
      <figure><div style="width:150px;height:150px;border:1px dashed #cbd5e1;border-radius:6px"></div><figcaption>Back View</figcaption></figure>
      <figure><div style="width:150px;height:150px;border:1px dashed #cbd5e1;border-radius:6px"></div><figcaption>Side View</figcaption></figure>
    </div>`));
}

// Master size chart — filled if sizes provided, otherwise a blank template.
export function printSizeChart(sizes: UniformSize[], branding: SchoolBranding) {
  const cols = ['Size', 'Age', 'Grade', 'Chest', 'Waist', 'Hip', 'Shoulder', 'Neck', 'Shirt L', 'Sleeve L', 'Trouser L', 'Skirt L', 'Short L', 'Sock', 'Shoe', 'Head'];
  const val = (n?: number | string) => n === undefined || n === '' ? '' : String(n);
  const rows = sizes.length > 0
    ? sizes.map(s => `<tr><td>${esc(s.sizeCode)}</td><td>${esc(s.ageRange || '')}</td><td>${esc(s.typicalGrade || '')}</td><td>${val(s.chest)}</td><td>${val(s.waist)}</td><td>${val(s.hip)}</td><td>${val(s.shoulder)}</td><td>${val(s.neck)}</td><td>${val(s.shirtLength)}</td><td>${val(s.sleeveLength)}</td><td>${val(s.trouserLength)}</td><td>${val(s.skirtLength)}</td><td>${val(s.shortLength)}</td><td>${esc(s.sockSize || '')}</td><td>${esc(s.shoeSize || '')}</td><td>${val(s.headCirc)}</td></tr>`).join('')
    : Array.from({ length: 12 }).map(() => `<tr class="blank">${cols.map(() => '<td></td>').join('')}</tr>`).join('');
  open(shell('Master Size Chart', branding, `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`));
}

// Blank stock count sheet.
export function printStockCount(items: { name: string; itemCode: string }[], branding: SchoolBranding) {
  const rows = (items.length ? items : Array.from({ length: 20 }).map(() => ({ name: '', itemCode: '' })))
    .map(i => `<tr class="blank"><td>${esc(i.itemCode)}</td><td>${esc(i.name)}</td><td></td><td></td><td></td><td></td></tr>`).join('');
  open(shell('Stock Count Sheet', branding, `
    <p style="font-size:12px;color:#6b7280;margin-bottom:6px">Date: ______________  Counted by: ______________</p>
    <table><thead><tr><th>Item Code</th><th>Item</th><th>Colour</th><th>Size</th><th>System Qty</th><th>Counted Qty</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sig"><div>Counted By</div><div>Verified By</div></div>`));
}
