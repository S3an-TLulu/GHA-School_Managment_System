# Development Log

Newest first. Keep entries short: date, area, problem, solution, tests,
commit, remaining.

---

## 2026-09-23

**Health at start:** typecheck ✓ · lint 0 errors / 8 warnings · tests 42/42 ✓ ·
build ✓ (533 kB main-chunk warning). CI green on `main` and on PR #49.
"Deploy Local" runs are all `cancelled` because no self-hosted runner picks
them up (logged as debt).

### Finance: duplicate receipt numbers in bulk fee collection
- **Problem:** `BulkFeeCollection` generated `RCP-${Date.now().slice(-6)}`
  per student inside one synchronous loop, so an entire batch shared a single
  receipt number.
- **Solution:** `lib/receiptNumber.ts` `nextReceiptNumbers()` gives
  consecutive numbers in the same format and skips existing ones. It's used
  in bulk collection and in family-statement quick-pay.
- **Tests:** 5 new (uniqueness within a batch, skipping existing numbers,
  padding and wrap-around).
- **Commit:** 598b4a5
- **Remaining:** A true sequential series needs an owner decision on
  numbering policy.

### Finance: bulk collection accepted zero or negative amounts
- **Problem:** Record was only disabled for an empty amount, so `-500`
  recorded negative "paid" payments.
- **Solution:** Require an amount > 0 and update the warning text.
- **Commit:** c9381eb

### Finance: fee totals duplicated across three views
- **Problem:** Paid, pending, overdue, outstanding and per-term totals were
  recomputed with raw float sums in StudentProfile, FamilyStatements and the
  printed statement.
- **Solution:** `lib/feeLedger.ts` (`summarizePayments`,
  `summarizeByTerm`) built on `sumMoney`. Call sites keep their variable
  names, so the UI is unchanged.
- **Tests:** 7 new (status splits, charged = paid + outstanding, 0.1 + 0.2,
  term grouping).
- **Commit:** 2431389
- **Remaining:** About 20 other call sites (see TECHNICAL_DEBT MEDIUM).

### Docs: development structure
- Added `CLAUDE.md` (the session routine), `docs/TECHNICAL_DEBT.md`,
  `docs/ROADMAP.md` and this log. Moved `ARCHITECTURE_AUDIT.md` into `docs/`
  with a status table (§0 RLS and CI gates are now fixed in code) and updated
  every reference to it.

**Health at end:** typecheck ✓ · lint 0 errors / 8 warnings (unchanged) ·
tests 54/54 ✓ · build ✓.
