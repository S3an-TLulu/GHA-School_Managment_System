import { describe, it, expect } from 'vitest';
import { esc } from './print';

describe('esc', () => {
  it('escapes all HTML-significant characters', () => {
    expect(esc(`<b>Tom & "Jerry" 's</b>`)).toBe('&lt;b&gt;Tom &amp; &quot;Jerry&quot; &#39;s&lt;/b&gt;');
  });
  it('returns an empty string for null/undefined-ish input', () => {
    expect(esc('')).toBe('');
    expect(esc(undefined as unknown as string)).toBe('');
  });
  it('leaves plain text untouched', () => {
    expect(esc('Grade 5 Maths')).toBe('Grade 5 Maths');
  });
});
