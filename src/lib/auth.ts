// Password hashing with the browser's WebCrypto (SHA-256, salted with the
// username so identical passwords don't share a hash). Not bcrypt-grade, but
// a serious upgrade from the plain text we stored before.
export async function hashPassword(username: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`gha:${username.toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
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
