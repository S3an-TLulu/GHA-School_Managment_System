import { UniformItem, UniformCategory, UniformSize, SchoolBranding, StudentMeasurement, TailorOrder, Student } from '../context/AppContext';
import { esc, printHtml, exportPdf } from './print';

// Build the shell + send it to the print dialog, or to Save-as-PDF when opts.pdf.
// Filename defaults to the document title.
type DocOpts = { pdf?: boolean };
function doc(title: string, branding: SchoolBranding, body: string, opts?: DocOpts) {
  const html = shell(title, branding, body);
  if (opts?.pdf) exportPdf(html, title);
  else printHtml(html);
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
export function printItemSpec(item: UniformItem, category: UniformCategory | undefined, branding: SchoolBranding, qr?: string, opts?: DocOpts) {
  const row = (label: string, val?: string | boolean | number) =>
    `<div class="field"><b>${label}</b><span>${val === true ? 'Yes' : val === false ? 'No' : esc(String(val ?? '—'))}</span></div>`;
  const imgs = Object.entries({ Front: item.images.front, Back: item.images.back, Side: item.images.side, Detail: item.images.detail, Material: item.images.material })
    .filter(([, u]) => u)
    .map(([label, u]) => `<figure><img src="${u}" alt="" /><figcaption>${label}</figcaption></figure>`).join('');
  doc('Uniform Specification Sheet', branding, `
    ${qr ? `<img src="${qr}" alt="QR" style="width:90px;height:90px;float:right" />` : ''}
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
  `, opts);
}

// Blank catalogue sheet for filling in by hand.
export function printBlankCatalogue(branding: SchoolBranding, opts?: DocOpts) {
  const fields = ['Item Code', 'Item Name', 'Category', 'Gender', 'Applicable Grades', 'Description', 'Material', 'Colour', 'Sleeve Type', 'Collar Type', 'Season', 'Badge Required', 'Logo Position', 'Price', 'Status', 'Notes'];
  doc('Uniform Catalogue Sheet', branding, `
    ${fields.map(f => `<div class="field"><b>${f}</b><span>&nbsp;</span></div>`).join('')}
    <div class="imgs">
      <figure><div style="width:150px;height:150px;border:1px dashed #cbd5e1;border-radius:6px"></div><figcaption>Front View</figcaption></figure>
      <figure><div style="width:150px;height:150px;border:1px dashed #cbd5e1;border-radius:6px"></div><figcaption>Back View</figcaption></figure>
      <figure><div style="width:150px;height:150px;border:1px dashed #cbd5e1;border-radius:6px"></div><figcaption>Side View</figcaption></figure>
    </div>`, opts);
}

// Master size chart — filled if sizes provided, otherwise a blank template.
export function printSizeChart(sizes: UniformSize[], branding: SchoolBranding, opts?: DocOpts) {
  const cols = ['Size', 'Age', 'Grade', 'Chest', 'Waist', 'Hip', 'Shoulder', 'Neck', 'Shirt L', 'Sleeve L', 'Trouser L', 'Skirt L', 'Short L', 'Sock', 'Shoe', 'Head'];
  const val = (n?: number | string) => n === undefined || n === '' ? '' : String(n);
  const rows = sizes.length > 0
    ? sizes.map(s => `<tr><td>${esc(s.sizeCode)}</td><td>${esc(s.ageRange || '')}</td><td>${esc(s.typicalGrade || '')}</td><td>${val(s.chest)}</td><td>${val(s.waist)}</td><td>${val(s.hip)}</td><td>${val(s.shoulder)}</td><td>${val(s.neck)}</td><td>${val(s.shirtLength)}</td><td>${val(s.sleeveLength)}</td><td>${val(s.trouserLength)}</td><td>${val(s.skirtLength)}</td><td>${val(s.shortLength)}</td><td>${esc(s.sockSize || '')}</td><td>${esc(s.shoeSize || '')}</td><td>${val(s.headCirc)}</td></tr>`).join('')
    : Array.from({ length: 12 }).map(() => `<tr class="blank">${cols.map(() => '<td></td>').join('')}</tr>`).join('');
  doc('Master Size Chart', branding, `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`, opts);
}

// Blank stock count sheet.
export function printStockCount(items: { name: string; itemCode: string }[], branding: SchoolBranding, opts?: DocOpts) {
  const rows = (items.length ? items : Array.from({ length: 20 }).map(() => ({ name: '', itemCode: '' })))
    .map(i => `<tr class="blank"><td>${esc(i.itemCode)}</td><td>${esc(i.name)}</td><td></td><td></td><td></td><td></td></tr>`).join('');
  doc('Stock Count Sheet', branding, `
    <p style="font-size:12px;color:#6b7280;margin-bottom:6px">Date: ______________  Counted by: ______________</p>
    <table><thead><tr><th>Item Code</th><th>Item</th><th>Colour</th><th>Size</th><th>System Qty</th><th>Counted Qty</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sig"><div>Counted By</div><div>Verified By</div></div>`, opts);
}

const MEASURE_ROWS = ['Height', 'Chest', 'Waist', 'Hip', 'Shoulder', 'Sleeve', 'Neck', 'Shirt Length', 'Trouser Length', 'Skirt Length', 'Foot Size', 'Head Size'];

// Student measurement form — blank if no measurement given, otherwise filled.
export function printMeasurementForm(student: Student | undefined, m: StudentMeasurement | undefined, branding: SchoolBranding, opts?: DocOpts) {
  const v = (n?: number | string) => (n === undefined || n === '') ? '' : String(n);
  const map: Record<string, number | string | undefined> = m ? {
    'Height': m.height, 'Chest': m.chest, 'Waist': m.waist, 'Hip': m.hip, 'Shoulder': m.shoulder,
    'Sleeve': m.sleeve, 'Neck': m.neck, 'Shirt Length': m.shirtLength, 'Trouser Length': m.trouserLength,
    'Skirt Length': m.skirtLength, 'Foot Size': m.footSize, 'Head Size': m.headSize,
  } : {};
  const rows = MEASURE_ROWS.map(label => `<tr><td>${label}</td><td style="width:120px">${v(map[label])}</td><td></td></tr>`).join('');
  doc('Student Measurement Form', branding, `
    <div class="field"><b>Student Name</b><span>${esc(student?.name || '')}</span></div>
    <div class="field"><b>Admission No.</b><span>${esc(student?.admissionNumber || '')}</span></div>
    <div class="field"><b>Class</b><span>${esc(student?.grade || m?.className || '')}</span></div>
    <div class="field"><b>Gender</b><span>${esc(student?.gender || m?.gender || '')}</span></div>
    <div class="field"><b>Date Measured</b><span>${m?.dateMeasured ? new Date(m.dateMeasured).toLocaleDateString('en-GB') : ''}</span></div>
    <div class="field"><b>Measured By</b><span>${esc(m?.measuredBy || '')}</span></div>
    <table style="margin-top:10px"><thead><tr><th>Measurement</th><th>Value (cm)</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="field" style="margin-top:10px"><b>Recommended Size</b><span>${esc(m?.recommendedSize || '')}</span></div>
    <div class="field"><b>Tailor Notes</b><span>${esc(m?.tailorNotes || '')}</span></div>
    <div class="sig"><div>Measured By</div><div>Signature &amp; Date</div></div>`, opts);
}

// Tailor production sheet for an order (rows pre-resolved by the caller).
export function printProductionSheet(order: TailorOrder, tailorName: string, rows: { name: string; size: string; qty: number; material?: string; instructions?: string }[], branding: SchoolBranding, opts?: DocOpts) {
  const body = rows.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.size)}</td><td style="text-align:center">${r.qty}</td><td>${esc(r.material || '')}</td><td>${esc(r.instructions || '')}</td></tr>`).join('');
  doc('Tailor Production Order', branding, `
    <div class="field"><b>Order No.</b><span>${esc(order.orderNo)}</span></div>
    <div class="field"><b>Tailor</b><span>${esc(tailorName)}</span></div>
    <div class="field"><b>Order Date</b><span>${new Date(order.date).toLocaleDateString('en-GB')}</span></div>
    <div class="field"><b>Due Date</b><span>${order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-GB') : '—'}</span></div>
    <div class="field"><b>Priority</b><span>${esc(order.priority)}</span></div>
    <div class="field"><b>Status</b><span>${esc(order.status)}</span></div>
    <table style="margin-top:10px"><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Material</th><th>Special Instructions</th></tr></thead><tbody>${body || '<tr><td colspan="5" style="color:#9ca3af">No items</td></tr>'}</tbody></table>
    ${order.notes ? `<p style="font-size:12px;color:#6b7280;margin-top:8px">Notes: ${esc(order.notes)}</p>` : ''}
    <div class="sig"><div>Issued By (School)</div><div>Received By (Tailor)</div></div>`, opts);
}

// Blank uniform issue / return form.
export function printIssueForm(kind: 'Issue' | 'Return', branding: SchoolBranding, opts?: DocOpts) {
  const rows = Array.from({ length: 6 }).map(() => '<tr class="blank"><td></td><td></td><td></td><td></td></tr>').join('');
  doc(`Uniform ${kind} Form`, branding, `
    <div class="field"><b>Student Name</b><span>&nbsp;</span></div>
    <div class="field"><b>Admission No.</b><span>&nbsp;</span></div>
    <div class="field"><b>Class</b><span>&nbsp;</span></div>
    <div class="field"><b>Date</b><span>&nbsp;</span></div>
    <table style="margin-top:10px"><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Condition</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sig"><div>${kind === 'Issue' ? 'Issued By' : 'Received By'}</div><div>Parent / Guardian Signature</div></div>`, opts);
}

// Purchase order to a supplier. Rows: item, size, qty, unit cost.
export function printPurchaseOrder(supplierName: string, supplierContact: string, poNo: string, rows: { name: string; size: string; qty: number; cost?: number }[], branding: SchoolBranding, opts?: DocOpts) {
  const body = (rows.length ? rows : [{ name: '', size: '', qty: 0 }, { name: '', size: '', qty: 0 }, { name: '', size: '', qty: 0 }])
    .map(r => `<tr${r.name ? '' : ' class="blank"'}><td>${esc(r.name)}</td><td>${esc(r.size)}</td><td style="text-align:center">${r.qty || ''}</td><td style="text-align:right">${r.cost ? 'K' + r.cost : ''}</td><td style="text-align:right">${r.cost && r.qty ? 'K' + (r.cost * r.qty).toLocaleString() : ''}</td></tr>`).join('');
  const total = rows.reduce((a, r) => a + (r.cost || 0) * r.qty, 0);
  doc('Purchase Order', branding, `
    <div class="field"><b>PO Number</b><span>${esc(poNo)}</span></div>
    <div class="field"><b>Date</b><span>${new Date().toLocaleDateString('en-GB')}</span></div>
    <div class="field"><b>Supplier</b><span>${esc(supplierName)}</span></div>
    ${supplierContact ? `<div class="field"><b>Contact</b><span>${esc(supplierContact)}</span></div>` : ''}
    <table style="margin-top:10px"><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr></thead><tbody>${body}</tbody>
    ${total > 0 ? `<tfoot><tr><td colspan="4" style="text-align:right;font-weight:700">Total</td><td style="text-align:right;font-weight:700">K${total.toLocaleString()}</td></tr></tfoot>` : ''}</table>
    <div class="sig"><div>Authorised By</div><div>Supplier Acknowledgement</div></div>`, opts);
}

// Receipt for uniforms issued to a student from the Store.
export function printUniformReceipt(student: Student | undefined, lines: { name: string; size: string; qty: number; price: number }[], branding: SchoolBranding, opts?: DocOpts) {
  const total = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const body = lines.map(l => `<tr><td>${esc(l.name)}</td><td>${esc(l.size)}</td><td style="text-align:center">${l.qty}</td><td style="text-align:right">K${l.price.toLocaleString()}</td><td style="text-align:right">K${(l.price * l.qty).toLocaleString()}</td></tr>`).join('');
  const bank = branding.bankName || branding.bankAccountNumber;
  doc('Uniform Receipt', branding, `
    <div style="text-align:center;margin-bottom:8px"><span style="display:inline-block;background:#d1fae5;color:#065f46;border:2px solid #059669;border-radius:6px;padding:3px 14px;font-size:12px;font-weight:700">UNIFORM RECEIPT</span></div>
    <div class="field"><b>Student</b><span>${esc(student?.name || '')}</span></div>
    <div class="field"><b>Class</b><span>${esc(student?.grade || '')}</span></div>
    <div class="field"><b>Admission No.</b><span>${esc(student?.admissionNumber || '—')}</span></div>
    <div class="field"><b>Date</b><span>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    <table style="margin-top:10px"><thead><tr><th>Item</th><th>Size</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${body || '<tr><td colspan="5" style="color:#9ca3af">No items</td></tr>'}</tbody>
      <tfoot><tr><td colspan="4" style="text-align:right;font-weight:700">TOTAL</td><td style="text-align:right;font-weight:700;font-size:14px">K${total.toLocaleString()}</td></tr></tfoot>
    </table>
    ${bank ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px;margin-top:12px;font-size:11px;color:#1e40af"><b>Banking:</b> ${esc(branding.bankName || '')}${branding.bankBranch ? ' · ' + esc(branding.bankBranch) : ''} · Acct ${esc(branding.bankAccountNumber || '')}</div>` : ''}
    <div class="sig"><div>Received By</div><div>Parent / Guardian</div></div>`, opts);
}
