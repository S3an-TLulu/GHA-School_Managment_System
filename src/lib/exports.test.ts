import { describe, it, expect } from 'vitest';
import { toCSV, parseCSV, parseCSVObjects } from './exports';

describe('toCSV', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCSV(['A', 'B'], [[1, 2], [3, 4]])).toBe('A,B\r\n1,2\r\n3,4');
  });
  it('quotes values containing commas, quotes or newlines and escapes quotes', () => {
    expect(toCSV(['x'], [['a,b']])).toBe('x\r\n"a,b"');
    expect(toCSV(['x'], [['he said "hi"']])).toBe('x\r\n"he said ""hi"""');
    expect(toCSV(['x'], [['line1\nline2']])).toBe('x\r\n"line1\nline2"');
  });
  it('renders null/undefined as empty cells', () => {
    expect(toCSV(['x', 'y'], [[null, undefined]])).toBe('x,y\r\n,');
  });
});

describe('parseCSV', () => {
  it('round-trips quoted fields with commas and escaped quotes', () => {
    const csv = 'name,note\r\n"Doe, John","said ""hi"""';
    expect(parseCSV(csv)).toEqual([['name', 'note'], ['Doe, John', 'said "hi"']]);
  });
  it('handles CRLF and LF line endings and skips blank rows', () => {
    expect(parseCSV('a,b\n1,2\r\n\r\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
  });
  it('handles a quoted field containing a newline', () => {
    expect(parseCSV('x\n"a\nb"')).toEqual([['x'], ['a\nb']]);
  });
});

describe('parseCSVObjects', () => {
  it('maps rows to objects with normalised header keys', () => {
    const csv = 'Guardian Name,Guardian_Phone\r\nJane,0977';
    expect(parseCSVObjects(csv)).toEqual([{ guardianname: 'Jane', guardianphone: '0977' }]);
  });
  it('returns an empty array when there is no data row', () => {
    expect(parseCSVObjects('only,headers')).toEqual([]);
  });
});
