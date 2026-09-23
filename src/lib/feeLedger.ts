import type { Payment } from '../context/AppContext';
import { roundMoney, sumMoney } from './money';

// Fee-ledger totals for a set of Payment rows. A Payment is both the charge
// and its settlement: `amount` is the net charge, and `status` says whether
// it has been paid. These totals were previously recomputed inline (with raw
// float sums) in StudentProfile, FamilyStatements and the printed statement.

export interface PaymentTotals {
  /** Every charge, paid or not. */
  charged: number;
  paid: number;
  pending: number;
  overdue: number;
  /** pending + overdue — what is still owed. */
  outstanding: number;
}

export interface TermTotals {
  term: string;
  charged: number;
  paid: number;
  balance: number;
}

const amountsWhere = (ps: Payment[], status: Payment['status']) =>
  ps.filter(p => p.status === status).map(p => p.amount);

export function summarizePayments(payments: Payment[]): PaymentTotals {
  const pending = sumMoney(amountsWhere(payments, 'pending'));
  const overdue = sumMoney(amountsWhere(payments, 'overdue'));
  return {
    charged: sumMoney(payments.map(p => p.amount)),
    paid: sumMoney(amountsWhere(payments, 'paid')),
    pending,
    overdue,
    outstanding: roundMoney(pending + overdue),
  };
}

/** Charged / paid / balance per term, in first-seen order. Payments with no term group under '—'. */
export function summarizeByTerm(payments: Payment[]): TermTotals[] {
  const terms = [...new Set(payments.map(p => p.term || '—'))];
  return terms.map(term => {
    const { charged, paid } = summarizePayments(payments.filter(p => (p.term || '—') === term));
    return { term, charged, paid, balance: roundMoney(charged - paid) };
  });
}
