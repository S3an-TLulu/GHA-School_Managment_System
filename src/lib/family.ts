import type { Student, Family } from '../context/AppContext';

// Family.studentIds (edited via the Family editor in Families & Guardians) is
// the single surface an admin actually edits. These helpers are what keep
// Student.familyId — the field grouping code like ParentPortal reads — in
// sync with it, so there is never a second place that can silently drift out
// of agreement with studentIds. See .claude/skills for the broader context on
// why this replaced matching siblings by guardian phone number.

/**
 * Reconcile Student.familyId after a family's studentIds changes from
 * `before` to `after`. A student newly present in `after` gets `familyId`
 * set; a student dropped from `after` has it cleared, but only if it still
 * points at *this* family — never clobber a student that's meanwhile been
 * moved to a different family by some other update.
 */
export function syncFamilyMembership(students: Student[], familyId: string, before: string[], after: string[]): Student[] {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return students.map(s => {
    if (afterSet.has(s.id)) return s.familyId === familyId ? s : { ...s, familyId };
    if (beforeSet.has(s.id) && s.familyId === familyId) return { ...s, familyId: undefined };
    return s;
  });
}

/** Clear familyId from every student pointing at a family that's being deleted. */
export function clearFamilyMembership(students: Student[], familyId: string): Student[] {
  return students.map(s => s.familyId === familyId ? { ...s, familyId: undefined } : s);
}

/** Remove a deleted student's id from every family's studentIds list. */
export function removeStudentFromFamilies(families: Family[], studentId: string): Family[] {
  return families.map(f => f.studentIds.includes(studentId) ? { ...f, studentIds: f.studentIds.filter(id => id !== studentId) } : f);
}
