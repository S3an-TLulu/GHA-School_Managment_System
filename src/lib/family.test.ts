import { describe, it, expect } from 'vitest';
import { syncFamilyMembership, clearFamilyMembership, removeStudentFromFamilies } from './family';
import type { Student, Family } from '../context/AppContext';

const student = (id: string, extra: Partial<Student> = {}): Student =>
  ({ id, name: id, grade: 'Grade 1', guardianName: 'G', guardianPhone: '0977000000', enrollmentDate: '2026-01-01', ...extra });

describe('syncFamilyMembership', () => {
  it('sets familyId on students newly added to the family', () => {
    const students = [student('a'), student('b')];
    const next = syncFamilyMembership(students, 'fam-1', [], ['a', 'b']);
    expect(next.find(s => s.id === 'a')?.familyId).toBe('fam-1');
    expect(next.find(s => s.id === 'b')?.familyId).toBe('fam-1');
  });

  it('clears familyId on a student dropped from the family', () => {
    const students = [student('a', { familyId: 'fam-1' }), student('b', { familyId: 'fam-1' })];
    const next = syncFamilyMembership(students, 'fam-1', ['a', 'b'], ['a']);
    expect(next.find(s => s.id === 'a')?.familyId).toBe('fam-1');
    expect(next.find(s => s.id === 'b')?.familyId).toBeUndefined();
  });

  it('never clobbers a student already reassigned to a different family', () => {
    // 'b' was in fam-1's studentIds before, but has since been moved to fam-2
    // by some other update — dropping 'b' from fam-1's list must not steal it back.
    const students = [student('a', { familyId: 'fam-1' }), student('b', { familyId: 'fam-2' })];
    const next = syncFamilyMembership(students, 'fam-1', ['a', 'b'], ['a']);
    expect(next.find(s => s.id === 'b')?.familyId).toBe('fam-2');
  });

  it('leaves students unrelated to the family untouched', () => {
    const students = [student('a'), student('c', { familyId: 'fam-9' })];
    const next = syncFamilyMembership(students, 'fam-1', [], ['a']);
    expect(next.find(s => s.id === 'c')?.familyId).toBe('fam-9');
  });
});

describe('clearFamilyMembership', () => {
  it('clears familyId from every student pointing at the deleted family', () => {
    const students = [student('a', { familyId: 'fam-1' }), student('b', { familyId: 'fam-2' })];
    const next = clearFamilyMembership(students, 'fam-1');
    expect(next.find(s => s.id === 'a')?.familyId).toBeUndefined();
    expect(next.find(s => s.id === 'b')?.familyId).toBe('fam-2');
  });
});

describe('removeStudentFromFamilies', () => {
  it('removes a deleted student from every family studentIds list', () => {
    const families: Family[] = [
      { id: 'fam-1', name: 'A', guardians: [], studentIds: ['a', 'b'], createdAt: '2026-01-01' },
      { id: 'fam-2', name: 'B', guardians: [], studentIds: ['c'], createdAt: '2026-01-01' },
    ];
    const next = removeStudentFromFamilies(families, 'a');
    expect(next.find(f => f.id === 'fam-1')?.studentIds).toEqual(['b']);
    expect(next.find(f => f.id === 'fam-2')?.studentIds).toEqual(['c']);
  });

  it('is a no-op for a student not in any family', () => {
    const families: Family[] = [{ id: 'fam-1', name: 'A', guardians: [], studentIds: ['a'], createdAt: '2026-01-01' }];
    const next = removeStudentFromFamilies(families, 'zzz');
    expect(next).toEqual(families);
  });
});
