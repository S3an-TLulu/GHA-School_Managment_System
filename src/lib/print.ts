// Shared print / export-to-PDF helpers.
//
// Every printable document in the app is generated as a self-contained HTML
// string (with its own @page CSS) and opened in a new window that auto-invokes
// window.print(). This module centralises that plumbing so the document
// builders don't each re-implement it, and adds a no-dependency "Export to PDF"
// path: the browser's own print dialog can "Save as PDF", and browsers name the
// saved file after the document <title> — so exportPdf just forces the title to
// the filename we want and nudges the user to pick the PDF destination.

// The school's preferred document font (Century Gothic), with sensible fallbacks
// for machines that don't have it. Shared by every printable/Word document.
export const DOC_FONT = "'Century Gothic','Calibri','Segoe UI',Arial,sans-serif";

// Escape user text before injecting it into printable HTML. Shared by every
// document builder (previously duplicated in each *Docs.ts file).
export const esc = (s: string) => (s || '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// Open a fully-formed HTML document in a new window/tab. The document is
// expected to auto-print itself (the builders embed a window.print() script).
export function printHtml(html: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// Sanitise a base name into something safe for a saved filename.
const cleanName = (s: string) =>
  (s || 'document').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'document';

// Export the same document HTML as a PDF using the browser's built-in
// Save-as-PDF. We (1) force the <title> to the desired filename so the saved
// PDF is named correctly, and (2) inject a small on-screen hint (hidden when
// printing) telling the user to choose "Save as PDF" as the destination. The
// document's own auto-print script then opens the dialog.
export function exportPdf(html: string, filename: string) {
  const name = cleanName(filename);
  let out = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(name)}</title>`)
    : html.replace(/<head>/i, `<head><title>${esc(name)}</title>`);

  const hint = `<div class="pdf-export-hint" style="position:sticky;top:0;z-index:9999;background:#12274a;color:#fff;font-family:Arial,sans-serif;font-size:13px;padding:8px 14px;text-align:center">
    📄 To save this as a PDF, choose <b>“Save as PDF”</b> as the destination in the print dialog.
    <style>@media print{.pdf-export-hint{display:none!important}}</style>
  </div>`;
  out = /<body[^>]*>/i.test(out)
    ? out.replace(/(<body[^>]*>)/i, `$1${hint}`)
    : hint + out;

  printHtml(out);
}

// Export the same document HTML as an editable Word (.doc) file. Word opens
// HTML-based .doc documents and lets the teacher edit them. We add the Office
// XML namespaces + a "Print" view hint, force a clean Calibri base font to match
// a normal Word document, strip the auto-print script, and trigger a download.
// Note: inline SVG (number lines, clocks, etc.) may not render in Word — Word
// export suits text/image papers; use PDF for SVG-heavy worksheets.
export function exportWord(html: string, filename: string) {
  let out = html
    .replace(/<script>[\s\S]*?<\/script>/gi, '')
    .replace(/<html[^>]*>/i, "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>");
  const head = "<meta charset='utf-8'>"
    + "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->"
    + `<style>body{font-family:${DOC_FONT}}</style>`;
  out = /<head>/i.test(out) ? out.replace(/<head>/i, `<head>${head}`) : `<head>${head}</head>` + out;

  const blob = new Blob(['﻿', out], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName(filename)}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Route a finished HTML document to the chosen output.
export function emitDoc(html: string, filename: string, mode: 'print' | 'pdf' | 'word') {
  if (mode === 'word') exportWord(html, filename);
  else if (mode === 'pdf') exportPdf(html, filename);
  else printHtml(html);
}
