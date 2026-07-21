// Spreadsheet export/import helpers. We emit CSV (opens natively in Excel,
// Google Sheets and LibreOffice) so there's no heavy dependency, and parse CSV
// back for bulk imports. Everything runs in the browser.

type Cell = string | number | null | undefined;

// Quote a value for CSV: wrap in quotes if it contains a comma, quote or newline,
// and double any embedded quotes.
function csvCell(v: Cell): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Build a CSV string from a header row + array of row objects/arrays.
export function toCSV(headers: string[], rows: Cell[][]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  return lines.join('\r\n');
}

// Trigger a browser download of the given text as a file.
export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + content], { type: mime }); // BOM so Excel reads UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convenience: build + download a CSV in one call. Adds a dated filename.
export function exportCSV(baseName: string, headers: string[], rows: Cell[][]) {
  const date = new Date().toISOString().split('T')[0];
  downloadFile(`${baseName}_${date}.csv`, toCSV(headers, rows));
}

// Minimal CSV parser that handles quoted fields, escaped quotes and CRLF/LF.
// Returns an array of rows, each an array of string cells.
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  // last field/row (unless the file ended on a newline)
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

// Parse a CSV into objects keyed by a normalised header name. Header matching is
// case-insensitive and ignores spaces/underscores, so "Guardian Phone",
// "guardian_phone" and "guardianphone" all map to the same key.
export function parseCSVObjects(text: string): Record<string, string>[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const norm = (h: string) => h.toLowerCase().replace(/[\s_]+/g, '');
  const headers = rows[0].map(norm);
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
}
