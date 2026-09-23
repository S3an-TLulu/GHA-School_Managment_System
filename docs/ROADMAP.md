# Roadmap

Direction: from a working school app to a production-grade platform that is
more secure, reliable, testable and database-driven, without losing data,
features or financial accuracy. Details are in
[`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md).

## NOW

- **Confirm production RLS is locked down** (owner action, see CRITICAL debt).
- **Land PR #49**: families become authoritative via `Student.familyId`.
- **Finish consolidating fee totals** onto `lib/feeLedger.ts`, a few call
  sites per session, with tests for any site whose rules differ.

## NEXT

- Decide on a receipt numbering policy, then implement a unique sequential
  series (needs an owner decision).
- Protect payments from concurrent-cashier overwrites: sync payments as an
  append-only, merge-by-id collection instead of last-write-wins per key.
- Design a payment allocation model (charges ↔ payments ↔ refunds) before
  building more finance features.
- Start splitting `AppContext` by domain, Finance first, with tests.
- Schema-validate AI-generated content in `gha-generate`.
- Resolve the Deploy Local self-hosted workflow (owner decision).

## LATER

- Real Postgres tables for families, students and guardians, with RLS.
  Parent accounts scoped to their own family.
- Server-side authorization (RLS per role) to replace UI-only
  `ROLE_PERMISSIONS`.
- Server-side, append-only audit log.
- Move images out of `localStorage` into Supabase Storage.
- Version the service worker cache per build. Force an admin password change
  on first login.
- Integration tests for the golden paths (enrol → charge → pay → receipt →
  statement; attendance; results).
- Measure bundle size, then split the main chunk.

## COMPLETED

- 2026-09-23: Unique receipt numbers within bulk fee collection. Bulk
  collection rejects zero and negative amounts.
- 2026-09-23: `lib/feeLedger.ts`, a shared, tested source of fee totals.
- 2026-09-23: Development docs set up (`CLAUDE.md`, `docs/`).
- 2026-09-22: Supabase Auth plus allow-list RLS (PR #46). CI gates and
  `lib/money.ts` (PR #47). Supabase live-sync skill (PR #48).
- 2026-09-22: Phase 1 architecture audit.
