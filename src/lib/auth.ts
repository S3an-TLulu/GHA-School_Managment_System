// Legacy password hashing (SHA-256, salted with the username). Still used to
// verify accounts created before the PBKDF2 upgrade — those hashes are
// re-hashed to PBKDF2 automatically on the user's next successful login.
export async function hashPassword(username: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`gha:${username.toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

const PBKDF2_ITERATIONS = 100_000;

// Current password hashing: PBKDF2-HMAC-SHA256, 100k iterations, salted with
// the username. Far slower to brute-force offline than a bare SHA-256 digest.
// Stored as "pbkdf2$<iterations>$<hex>" so we can bump the work factor later.
export async function securePassword(username: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = enc.encode(`gha-pbkdf2:${username.toLowerCase()}`);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(bits)}`;
}

// Verify a plain password against a stored hash, transparently handling both
// the new PBKDF2 format and legacy SHA-256 hashes.
export async function verifyPassword(username: string, password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('pbkdf2$')) {
    const [, iterStr] = stored.split('$');
    const iterations = parseInt(iterStr, 10) || PBKDF2_ITERATIONS;
    const enc = new TextEncoder();
    const salt = enc.encode(`gha-pbkdf2:${username.toLowerCase()}`);
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
    return stored === `pbkdf2$${iterations}$${toHex(bits)}`;
  }
  // Legacy SHA-256 hash
  return stored === await hashPassword(username, password);
}

// True when a stored hash should be upgraded to the current PBKDF2 format.
export function needsRehash(stored: string): boolean {
  return !!stored && !stored.startsWith(`pbkdf2$${PBKDF2_ITERATIONS}$`);
}

// Rough password-strength score 0–4 with a short label, for the UI meter.
export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const label = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  return { score, label };
}

// Readable but strong password: Xxxx-Nnnn-Xxxx style, ~47 bits.
const CONSONANTS = 'bcdfghjkmnpqrstvwxz';
const VOWELS = 'aeiou';
function syllable() {
  const c = () => CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
  const v = () => VOWELS[Math.floor(Math.random() * VOWELS.length)];
  return c() + v() + c() + v();
}
export function generatePassword(): string {
  const word = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word(syllable())}${num}${word(syllable())}`;
}

export function generateMasterCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    if (i > 0 && i % 5 === 0) out += '-';
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out; // e.g. "K7NPQ-2XWZM"
}
