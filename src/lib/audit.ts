// Lightweight, tamper-evident-ish activity log kept in localStorage. It records
// who did what and when — logins, password changes, user management, edits to
// money records, backups and wipes — so an admin can review account activity.
// This is a client-side app with no server, so the log lives with the data;
// it is included in exports/backups and cleared by a full wipe like everything
// else. Capped to the most recent MAX entries (ring buffer).

export interface AuditEntry {
  id: string;
  at: string;       // ISO timestamp
  actor: string;    // username of the person who performed the action
  action: string;   // machine key, e.g. 'login', 'payment-deleted'
  detail?: string;  // human-readable extra context
}

const KEY = 'gha_audit';
const MAX = 500;

// The current actor is set by AuthContext on login/logout so that modules
// without access to the auth context (like AppContext) can still attribute
// their audit entries correctly.
let currentActor = 'system';
export function setAuditActor(username: string) {
  currentActor = username || 'system';
}

export function getAudit(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Append an entry. `actor` defaults to the current logged-in user.
export function logAudit(action: string, detail?: string, actor?: string) {
  try {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: actor || currentActor,
      action,
      detail,
    };
    const next = [entry, ...getAudit()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    // Let any open viewer refresh itself.
    window.dispatchEvent(new CustomEvent('gha-audit'));
  } catch {
    // logging must never break the actual operation
  }
}

export function clearAudit() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('gha-audit'));
  } catch { /* ignore */ }
}

// Friendly labels for the viewer.
export const AUDIT_LABELS: Record<string, string> = {
  'login': 'Signed in',
  'login-failed': 'Failed sign-in',
  'login-locked': 'Sign-in locked (too many attempts)',
  'logout': 'Signed out',
  'session-timeout': 'Auto sign-out (idle)',
  'password-change': 'Changed own password',
  'password-reset': 'Reset a user password',
  'user-added': 'Added a user',
  'user-updated': 'Updated a user',
  'user-deleted': 'Deleted a user',
  'mastercode-set': 'Set master access code',
  'payment-added': 'Recorded a payment',
  'payment-edited': 'Edited a payment',
  'payment-deleted': 'Deleted a payment',
  'data-imported': 'Restored data from backup',
  'data-wiped': 'Wiped data',
  'data-exported': 'Exported a backup',
  'message-queued': 'Queued a message',
  'message-broadcast': 'Sent a broadcast',
  'uniform-item-added': 'Added a uniform item',
  'stock-movement': 'Stock movement',
  'tailor-order-created': 'Created a tailor order',
};
