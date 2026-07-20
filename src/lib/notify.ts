// Helpers for reaching parents/debtors over WhatsApp. No server or API is
// involved — we just build a wa.me deep link that opens WhatsApp (web or app)
// with the recipient and a pre-filled message, which the user then sends
// themselves. This keeps the app free and avoids storing any credentials.

// Turn a locally-typed Zambian number into the international form wa.me needs.
// Handles the common shapes: "0977123456", "+260977123456", "260977123456",
// spaces/dashes, etc. Falls back to just the digits if it can't tell.
export function normalizeZmPhone(raw: string): string {
  let d = (raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('260')) return d;              // already international
  if (d.startsWith('0')) return '260' + d.slice(1); // national → international
  if (d.length === 9 && d.startsWith('9')) return '260' + d; // missing trunk 0
  return d;
}

// A wa.me link that opens a chat with a pre-filled message.
export function waLink(phone: string, message: string): string {
  const intl = normalizeZmPhone(phone);
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

// Friendly, ready-to-send fee/debt reminder.
export function buildFeeReminder(opts: {
  schoolName: string;
  recipientName: string;
  what: string;        // e.g. "school fees for Term 1 2026" or "2 tracksuits"
  balance: number;
  dueDate?: string;    // ISO
  studentName?: string;
}): string {
  const { schoolName, recipientName, what, balance, dueDate, studentName } = opts;
  const bal = `K${balance.toLocaleString()}`;
  const re = studentName ? ` for ${studentName}` : '';
  const due = dueDate ? ` The due date is ${new Date(dueDate).toLocaleDateString('en-ZM', { day: 'numeric', month: 'long', year: 'numeric' })}.` : '';
  return (
    `Good day ${recipientName},\n\n` +
    `This is a friendly reminder from ${schoolName} regarding an outstanding balance of ${bal}${re} (${what}).${due}\n\n` +
    `Kindly arrange payment at your earliest convenience. If you have already paid, please ignore this message and share your receipt.\n\n` +
    `Thank you,\n${schoolName}`
  );
}
