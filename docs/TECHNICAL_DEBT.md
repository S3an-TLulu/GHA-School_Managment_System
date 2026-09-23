# Technical Debt

Issues found during development, by severity. When an item is fixed, move it
to **Resolved** with the date and commit. The audit sections referenced are in
[`ARCHITECTURE_AUDIT.md`](ARCHITECTURE_AUDIT.md).

## CRITICAL

- [ ] **Verify production Supabase actually runs the tightened RLS.** The code
  fix (PR #46) only ships new setup SQL. Production stays open until an admin
  runs it and adds emails to `gha_authorized_emails`. Needs a check by the
  owner (read-only `pg_policies` query or the Supabase dashboard). *(Audit §0)*

## HIGH

- [ ] **Concurrent cashiers can lose payments.** Live Sync is last-write-wins
  per `localStorage` key, so two devices recording payments before syncing
  overwrite each other's whole `gha_payments` array. *(Audit §5)*
- [ ] **No payment allocation ledger.** A `Payment` row is both the charge and
  its settlement. There are no partial allocations or refund records, and
  edits change history in place. *(Audit §5, §7.4)*
- [ ] **Receipt numbers are not a guaranteed-unique sequence.** Some are
  derived from the clock (`RCP-` + 6 digits), `OfficeCashier` pre-fills a
  5-digit editable value, and `PaymentModal` takes manual entry. Duplicates
  within a bulk batch are fixed (598b4a5). A school-wide gap-free series
  needs an **owner decision** on format and on how to handle existing numbers.
- [ ] **Authorization is client-side only.** `ROLE_PERMISSIONS` hides UI but
  enforces nothing server-side. *(Audit §4.2)*
- [ ] **Parent portal is not an access boundary.** Every student's data is
  already in the browser before portal "login". *(Audit §4.3)*
- [ ] **Audit log is local and erasable** (`lib/audit.ts` → `localStorage`).
  *(Audit §4.4)*
- [ ] **Families linked by guardian phone.** In progress in PR #49
  (`Student.familyId`). *(Audit §5)*

## MEDIUM

- [ ] **Duplicated fee-total math remains** in ~20 other `status === 'paid'` +
  `reduce` sites (Dashboard, Debtors, Reports, ClassFees, Payments,
  DocumentTemplates, ParentPortal, …). Move them to `lib/feeLedger.ts` a few
  at a time. Where a site differs slightly, check the intended behaviour first.
- [ ] **Inconsistent money display rounding.** `receipt.ts` and
  `ClassFees.tsx` round to whole Kwacha, while `formatMoney` rounds to the
  cent. The difference only shows on fractional amounts. Decide on one rule
  before unifying.
- [ ] **Inconsistent payment date formats.** BulkFeeCollection stores
  `dueDate`/`paidDate` as `YYYY-MM-DD`. Most other paths store full ISO
  timestamps. Sorting still works (both are lexicographic), but date logic
  must handle both.
- [ ] **`AppContext.tsx` is ~1.8k lines** and holds every entity. Break it up
  by domain, Finance first. *(Audit §3, §7.9)*
- [ ] **Large components:** UniformManagement (967), Reports (847),
  Settings (804), HR (764), DocumentTemplates, Subjects, Tools (>650).
- [ ] **AI output not schema-validated.** `gha-generate`'s `extractJson()`
  parses without checking the shape. *(Audit §4.6)*
- [ ] **`dangerouslySetInnerHTML`** in `Worksheets.tsx:246`
  (`p.questionHtml`). Check whether it can ever carry user- or AI-supplied
  content.
- [ ] **Images stored as base64 in state**, which bloats every save and sync.
  *(Audit §3)*
- [ ] **"Deploy Local" workflow runs always end `cancelled`.** It uses
  `runs-on: self-hosted` and no runner picks the job up. Either bring the
  runner back or remove or disable the workflow. **Owner decision:**
  production infrastructure.
- [ ] **Main bundle is 533 kB** (145 kB gzip), over Vite's warning limit.
  Measure what's in it before splitting.

## LOW

- [ ] Service worker cache name `gha-cache-v1` is never versioned per build.
  *(Audit §4.8)*
- [ ] Default `admin`/`admin123` has no forced change on first login.
  *(Audit §4.9)*
- [ ] 8 lint warnings: 7 `react-refresh/only-export-components` (these only
  affect dev hot-reload) and 1 unused `eslint-disable` in
  `AppContext.tsx:1616` (left alone while PR #49 edits that file).
- [ ] `package.json` name is still `vite-react-typescript-starter`.
- [ ] Vitest prints deprecation warnings about `esbuild` options from
  `@vitejs/plugin-react`. They're harmless for now; review on the next
  dependency upgrade.

## Resolved

- [x] 2026-09-23: Bulk fee collection gave every payment in a batch the same
  receipt number (598b4a5).
- [x] 2026-09-23: Bulk fee collection accepted zero or negative amounts
  (c9381eb).
- [x] 2026-09-23: Fee totals were duplicated with float drift across
  StudentProfile, FamilyStatements and the printed statement. Extracted to
  `lib/feeLedger.ts` (2431389).
- [x] 2026-09-22: Open `using (true)` RLS replaced in setup SQL (PR #46).
  Production verification is still open, see CRITICAL.
- [x] 2026-09-22: CI gates added (typecheck, lint, test, build) (PR #47).
- [x] 2026-09-22: `lib/money.ts` added for rounding and parsing (PR #47).
