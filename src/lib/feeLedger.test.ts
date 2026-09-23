import { describe, expect, it } from 'vitest';
import type { Payment } from '../context/AppContext';
import { summarizeByTerm, summarizePayments } from './feeLedger';

let n = 0;
const pay = (amount: number, status: Payment['status'], term?: string): Payment => ({
  id: `p${++n}`, studentId: 's1', type: 'Fees', amount, status, term,
  dueDate: '2026-01-01T00:00:00.000Z', createdDate: '2026-01-01T00:00:00.000Z',
});

describe('summarizePayments', () => {
  it('returns zeros for no payments', () => {
    expect(summarizePayments([])).toEqual({ charged: 0, paid: 0, pending: 0, overdue: 0, outstanding: 0 });
  });

  it('splits charges by status; outstanding is pending + overdue', () => {
    const t = summarizePayments([pay(1000, 'paid'), pay(500, 'pending'), pay(250, 'overdue'), pay(300, 'paid')]);
    expect(t).toEqual({ charged: 2050, paid: 1300, pending: 500, overdue: 250, outstanding: 750 });
  });

  it('charged always equals paid + outstanding', () => {
    const t = summarizePayments([pay(1200.5, 'paid'), pay(799.25, 'overdue'), pay(0.25, 'pending')]);
    expect(t.charged).toBe(t.paid + t.outstanding);
  });

  it('does not drift on fractional amounts (0.1 + 0.2)', () => {
    const t = summarizePayments([pay(0.1, 'pending'), pay(0.2, 'overdue'), pay(0.1, 'paid'), pay(0.2, 'paid')]);
    expect(t.outstanding).toBe(0.3);
    expect(t.paid).toBe(0.3);
    expect(t.charged).toBe(0.6);
  });

  it('is fully paid when nothing is pending or overdue', () => {
    expect(summarizePayments([pay(1500, 'paid')]).outstanding).toBe(0);
  });
});

describe('summarizeByTerm', () => {
  it('groups by term in first-seen order with balance = charged − paid', () => {
    const rows = summarizeByTerm([
      pay(1000, 'paid', 'Term 1'), pay(400, 'pending', 'Term 2'),
      pay(600, 'overdue', 'Term 1'), pay(400, 'paid', 'Term 2'),
    ]);
    expect(rows).toEqual([
      { term: 'Term 1', charged: 1600, paid: 1000, balance: 600 },
      { term: 'Term 2', charged: 800, paid: 400, balance: 400 },
    ]);
  });

  it("groups payments without a term under '—'", () => {
    expect(summarizeByTerm([pay(100, 'paid'), pay(50, 'pending', '')])).toEqual([
      { term: '—', charged: 150, paid: 100, balance: 50 },
    ]);
  });
});
