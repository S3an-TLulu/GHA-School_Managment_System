# Great Highway Academy School Management System — Architecture Audit

Date: 2026-09-22
Scope: full repository (`src/`, `supabase/`, `public/`, `.github/`, config, docs)

This is a Phase 1 audit only. **No destructive or structural changes have been
made.** It exists to give a shared, accurate picture of the system before any
refactor, security fix, or database migration begins.

> **Status as of 2026-09-23.** The body below is the original snapshot and is
> kept unedited as a record. Several findings have since been addressed;
> check this table before acting on any section. Live tracking lives in
> [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) and [`ROADMAP.md`](ROADMAP.md).
>
> | Finding | Status |
> |---|---|
> | §0 / §4.1 Open `using (true)` RLS | **Fixed in code** (PR #46): Supabase Auth + `gha_authorized_emails` allow-list. The production project is only protected once an admin re-runs the updated setup SQL. That has not been verified from the repo. |
> | §4.7 No CI quality gate | **Fixed** (PR #47): `ci.yml` and `deploy.yml` run typecheck, lint, test, build |
> | §7.5 Centralize money math | **Partly done**: `lib/money.ts` (PR #47), `lib/feeLedger.ts` (2026-09-23) |
> | §5 Families not first-class | **In progress**: open PR #49 (`Student.familyId`) |
> | Everything else | Open. See `TECHNICAL_DEBT.md` |

---

## 0. Critical — read this first

**The production Supabase database is currently readable and writable by
anyone on the internet, with no login required, and this repository (public
on GitHub) ships the exact URL and key needed to do it.**

- `src/lib/supabase.ts` hardcodes `DEFAULT_SUPABASE_URL` and
  `DEFAULT_SUPABASE_KEY` for the live school project and commits them to a
  **public** repo.
- Every table this app provisions (`gha_backups`, `gha_kv`, and — per
  `docs/messaging/README.md` — `gha_outbox`) is set up with:
  ```sql
  create policy "... anon access" on public.<table>
    for all using (true) with check (true);
  ```
  i.e. `SELECT`, `INSERT`, `UPDATE`, `DELETE` are all open to the unauthenticated
  `anon` role.
- `gha_backups` holds the **entire school dataset** as one JSON blob — every
  student, guardian, phone number, payment, expense, HR record, and the local
  audit log, if it's ever pushed to cloud sync.
- The messaging docs already flag this themselves: *"gha_outbox currently uses
  the same open RLS as the other GHA tables. Before going live with real
  parent contacts, tighten its policy."* — it hasn't been tightened.

Shipping a Supabase anon key in a public client bundle is normal and expected
(that's what the anon key is for). The vulnerability is that **RLS is not
actually restricting anything** — `using (true)` neutralizes it entirely.
Combined with the app itself never authenticating to Supabase (see §4), this
is not a theoretical risk: any person who finds this repo (and public repos
with exposed Supabase credentials are actively scanned by bots) can dump or
alter every family's financial and personal data right now.

**This has to be fixed before anything else in this audit matters.** See
§10 for the two remediation options (quick mitigation vs. correct fix) and
the trade-off against "Cloud Sync" currently depending on the open policy to
function at all. I did not change any RLS policy or credential in this pass
— that's a live-production change and belongs in the security phase, done
deliberately, not as a side effect of an audit.

---

## 1. What the system actually is today

A single-page React 18 + TypeScript + Vite app, statically built and deployed
to GitHub Pages (`.github/workflows/deploy.yml`). There is **no application
backend**. All business data lives in the browser's `localStorage`, under
~90 `gha_*` keys, one per entity collection (see §5). Supabase is used only
as an optional, manually-triggered whole-database backup/restore mechanism
("Cloud Sync") and, more recently, as a best-effort realtime mirror
("Live Sync", per-key last-write-wins) and a message outbox.

Authentication is **entirely custom and local**: `AuthContext` stores
PBKDF2-hashed passwords in `localStorage`, does lockout/idle-timeout/audit
logging itself, and never touches Supabase Auth. Role checks
(`ROLE_PERMISSIONS`) are a static client-side lookup table with no
server-side enforcement of any kind — because there is no server.

The parent portal (`ParentPortal.tsx`) is not a separate authenticated
surface: it filters the same fully-loaded-in-browser `students` array by
admission number + guardian phone. Every parent's browser already has every
student's data in memory before the "login" screen does anything — the
portal login is a UI convenience, not an access boundary.

### What's good here, concretely
- TypeScript is in `strict` mode with `noUnusedLocals`/`noUnusedParameters`
  already on, and the codebase honors it — grep found only 1 `any`-adjacent
  cast in 25.8k lines and effectively no stray `console.*` calls.
- Passwords are salted/hashed (PBKDF2 via `lib/auth.ts`), with legacy
  plaintext migration, login lockout, and idle auto-logout already
  implemented in `AuthContext` — this is meaningfully better than a typical
  localStorage-only demo app.
- Domain types are centralized as exported interfaces in `AppContext.tsx`
  rather than scattered/duplicated per component.
- The service worker, offline support, PWA manifest, document/receipt
  generation, and worksheet generators are real, working, in-use features —
  not stubs.
- No `eval`/`new Function`, no obvious XSS via string concatenation into the
  DOM (`dangerouslySetInnerHTML` appears exactly once — worth a targeted
  look but not a pattern).

---

## 2. Feature inventory (confirmed present and working)

People: Students, Guardians (embedded in Student + separate `Family` model),
Teachers/Staff, HR (salary advances, payroll).
Academics: Classes, Subjects, Timetable, Attendance, Results/grading,
Question bank/Quizzes, Worksheets (generator library, sizeable — 18
generator modules), AI question/lesson generation via Edge Function.
Finance: Fee Structure, Payments, Bulk Fee Collection, Office Cashier,
Cash Book, Discounts, Expenses, Debtors, Family Statements, Fundraisers
(incl. external/non-enrolled contributors).
Services: Lunch (accounts, periods, kitchen view), Transport (routes,
assignments), Uniforms (catalog, stock, tailoring, measurements, issues,
returns — the largest single component in the app), Requirements, Inventory.
School life: Events, School Calendar, Announcements, Library (books/loans),
Gallery, Houses/Competitions, Class projects.
Admin: Settings (branding, theme, users & roles, backup/restore, cloud sync,
data cleanup/wipe), Document Templates (receipts, statements, ID cards,
certificates, reports), Messaging (multi-channel outbox), Audit log,
Reports Centre.
Infra: PWA/offline shell, GitHub Pages CI deploy, an alternate self-hosted
deploy workflow.

This is a genuinely large, mature feature set — the equivalent of several
separate SIS/ERP modules. Nothing here should be treated as disposable.

---

## 3. Codebase shape

- 104 TypeScript/TSX files, ~25,800 lines in `src/`.
- **`src/context/AppContext.tsx` is 1,770 lines** and is the single source
  of truth for ~60 entity types, all their CRUD, all localStorage
  persistence, backup/restore/wipe, and cloud sync orchestration. Every
  component in the app consumes this one context, so any change to it risks
  a full-app re-render and makes the dependency graph effectively "everything
  depends on everything."
- Ten components exceed 400 lines and mix data logic with rendering:

  | File | Lines | Note |
  |---|---:|---|
  | `UniformManagement.tsx` | 967 | catalog + stock + tailoring + measurements + issues in one file |
  | `Reports.tsx` | 847 | every report type computed inline in the component |
  | `HR.tsx` | 763 | staff + payroll + salary advances |
  | `Settings.tsx` | 757 | branding + theme + users + backup + cloud sync + wipe |
  | `Subjects.tsx` | 679 | |
  | `DocumentTemplates.tsx` | 677 | template selection + generation + print, inline |
  | `Tools.tsx` | 669 | grab-bag utility section |
  | `Results.tsx` | 593 | grading logic embedded in UI |
  | `Lunch.tsx` | 587 | |
  | `StudentProfile.tsx` | 548 | payments/uniforms/requirements/history all inline |

- Money is handled as JavaScript floats throughout (77 hits of
  `toFixed(2)`/`Math.round(...*100)`/`parseFloat` across 27 files, no
  shared money utility). For a system with 77 independent floating-point
  rounding sites and no integer-minor-units convention, cent-level drift in
  statements/balances over time is a real risk, not a hypothetical one.
- Dates: no centralized timezone/formatting utility; `new Date()` and
  formatting are ad hoc per component.
- Tests: 4 test files, all for pure `lib/` utilities (`worksheet`, `scoring`,
  `exports`, `print`) — **zero component, integration, or E2E tests.**
  There is no `vitest.config.*`; tests run on Vitest defaults.
- Images: student photos, logos, uniform/question images are stored as
  base64 strings directly in app state (confirmed in `Students.tsx`,
  `Subjects.tsx`, `Settings.tsx`, `Tools.tsx`, `lib/images.ts`) — i.e. inside
  the same localStorage blob that gets pushed whole to `gha_backups`. This
  bloats every save/sync and is part of why "whole-document" cloud sync is
  slow and collision-prone.

---

## 4. Security findings, in order of severity

1. **CRITICAL — Open RLS on live production data.** See §0. Affects
   `gha_backups`, `gha_kv`, `gha_outbox`. Exploitable today, by anyone, no
   auth.
2. **CRITICAL — No real backend authorization.** `ROLE_PERMISSIONS` in
   `AuthContext.tsx` is enforced only by hiding sidebar items and gating
   `canAccess()` calls in components. Since there is no server, this is a
   UI convenience, not a security boundary — but because of finding #1, the
   *actual* data is reachable directly via the Supabase REST API regardless
   of what the React app does. Once RLS is fixed, this finding will still
   matter for a future authenticated-Supabase design (§10), because a client
   that authenticates as "Teacher" must not be able to `PATCH` a payments row
   directly — that has to be enforced in RLS/policies, not just hidden UI.
3. **HIGH — Parent portal is not an access boundary.** It filters
   already-fully-loaded client data. Once real parent accounts exist (Phase
   as described in the task's §12), a parent's Supabase session must be
   scoped by RLS to their own family's rows; today nothing does that because
   nothing is scoped at all (see #1).
4. **HIGH — Audit log is client-side and self-erasable.** `lib/audit.ts`
   writes to `localStorage['gha_audit']`; any user with local access (or,
   today, anyone via the open `gha_backups`/`gha_kv` tables if the log gets
   synced) can alter or wipe it. It's genuinely useful for "what did this
   browser do" but cannot be treated as evidence of anything, and doesn't
   survive `Settings → full reset`.
5. **MEDIUM — API keys are handled correctly.** Worth stating explicitly:
   `supabase/functions/gha-generate` and `gha-sender` keep `ANTHROPIC_API_KEY`,
   `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `WHATSAPP_TOKEN` server-side as Edge
   Function secrets and never send them to the browser. This part of the
   design already follows the target architecture (§8) — no change needed
   beyond auth on the calls it makes.
6. **MEDIUM — AI-generated content is not schema-validated.**
   `gha-generate`'s `extractJson()` just slices between the first `{` and
   last `}` and `JSON.parse`s it — no shape validation (no Zod or similar)
   before the result is offered to the UI to save into the question
   bank/worksheets. A malformed or malicious-looking model response degrades
   gracefully into an error today (parse failure), but a *wrong-shaped but
   valid* JSON response (missing `correctIndex`, wrong option count, etc.)
   would currently flow through un-checked.
7. **LOW — No CI security/quality gate.** `.github/workflows/deploy.yml`
   runs `npm ci && npm run build` and deploys straight to GitHub Pages on
   every push to `main` — it does not run `typecheck`, `lint`, or `test`
   first. `deploy-local.yml` (self-hosted) is the same. A broken build would
   currently be caught (build fails → deploy skipped), but a change that
   passes `build` while failing typecheck/lint/tests would still ship.
8. **LOW — Service worker cache is not versioned to the build.**
   `public/sw.js` uses a static `CACHE = 'gha-cache-v1'` name. The
   network-first navigation strategy limits the damage (online users get
   fresh HTML), but the cache name itself never changes across deploys, so
   there's no clean mechanism to force-bust stale cached assets tied to an
   old build, and no version check against the schema the currently-loaded
   JS expects.
9. **LOW — Default credentials documented in README.** `admin`/`admin123`
   is the shipped default and the README tells operators to change it — fine
   as a first-run convenience, but worth a forced-change-on-first-login
   prompt rather than relying on the admin remembering to do it manually.

---

## 5. Database / data-model problems

There is no relational database in the target sense — `AppContext` is,
functionally, ~60 independent flat arrays (`students`, `payments`,
`families`, `uniformStock`, …) each serialized whole to its own
`localStorage` key, with relationships expressed only as string/ID fields
the app trusts to be consistent (e.g. a `Payment.studentId` that must
happen to match a `Student.id`; nothing enforces referential integrity).

Specific consequences already visible in the code:
- **Families are not first-class.** `Family` exists as a type (line 549)
  but guardian data also lives embedded per-student
  (`guardianPhone`/`guardianName` etc. on `Student`), and the parent portal
  groups "siblings" by normalizing and matching guardian **phone number**
  across students rather than a shared `familyId` — a wrong or re-used
  phone number silently merges or splits a family in the UI. This matches
  the task's own §9 concern almost exactly.
- **Payments are mutable balance edits, not a transaction ledger.** There is
  a `Payment` interface but no `payment_allocations`-style link from a
  payment to the specific charge(s) it covers; partial payments, refunds,
  and discounts appear to be modeled as more rows/fields on the same flat
  collections rather than as a proper double-entry-ish allocation chain
  (task §8). I have not yet traced every finance code path line-by-line —
  that trace is the first task of the Finance phase, not this audit — but
  the type shapes alone confirm the structural gap.
- **No real backup/restore beyond "download the whole JSON blob."**
  `Settings → Backup & Restore` (per README) is the only backup mechanism;
  it's a manual, whole-database export, same shape as the Supabase
  `gha_backups` sync. Restoration is untested by any automated check.
- **"Cloud Sync" is last-write-wins at the document level; "Live Sync" is
  last-write-wins per storage key.** The README is candid about this
  ("whoever pushes last overwrites the other"). For most sections that's an
  acceptable interim trade-off; for **financial data specifically**, two
  cashiers on two computers recording payments before either syncs is a
  silent-data-loss scenario today (one device's payment list wholly replaces
  the other's on push). This is the same risk the task's §22/§23 calls out
  in the abstract — here it's concretely reachable via normal daily cashier
  use on two machines.

---

## 6. Recommended target architecture (direction, not a rewrite plan)

The task brief's target layout (`app/`, `domains/`, `services/`, `lib/`,
etc.) is the right direction and nothing here argues against it. Concretely,
applied to *this* codebase:

- `AppContext` should be decomposed by the domain boundaries that already
  exist in its own type definitions (People/Family, Academics, Finance,
  Uniforms/Inventory, Transport, Lunch, Communications, Settings) rather
  than mechanically split by file size. Finance is the one domain that
  should move first and move furthest, because it's also the one with the
  worst structural gap (§5) and the highest cost of being wrong.
- Supabase/PostgreSQL becomes authoritative incrementally, starting with
  `families` → `students` → `guardians`, because the parent-portal and
  family-statement correctness problems in §5 are blocked on exactly this
  data existing as real rows with real foreign keys, not on anything else
  in the roadmap.
- The existing Edge Function pattern (`gha-generate`, `gha-sender`) is
  already the correct shape for "server-side secret holder" — extending it
  (rather than replacing it) to add authenticated, RLS-respecting endpoints
  is lower-risk than introducing a new backend framework.

Full target layout, database schema, and phase list from the brief are
adopted as-is for planning purposes; repeating them here would just
duplicate that document.

---

## 7. Priority-ordered issue list

1. **Fix RLS / auth boundary on Supabase** (§0, §4.1–4.3) — blocking
   everything else that touches real user data.
2. **Introduce Supabase Auth for real user identity**, replacing (or sitting
   alongside, during migration) the local `AuthContext` — required before
   #1 can be fixed *without breaking Cloud Sync*, so these two are really one
   piece of work done together.
3. **Stand up the `families`/`students`/`guardians` tables** and make the
   parent portal and family statements query them instead of client-side
   phone-matching — fixes §5's correctness bug, not just its architecture.
4. **Introduce a real payment/allocation model** for finance (§5, §8 of the
   brief) before building more finance features on top of the current flat
   shape — every new finance feature built on the current model is more to
   migrate later.
5. **Centralize money math** (`lib/finance/money.ts` or similar, integer
   minor units) — small, mechanical, high-value, low-risk; good first
   "domain services" extraction to prove the pattern before touching
   Finance's data model.
6. **Add CI gates** (`typecheck`, `lint`, `test` before `build`/deploy) —
   cheap, immediate, protects every change after this point.
7. **Version the service worker cache to the build** — cheap, immediate.
8. **Schema-validate AI-generated content** before it reaches the question
   bank (Zod) — cheap, contained.
9. **Begin `AppContext` decomposition**, Finance domain first, then
   People/Family, then the rest — ongoing, incremental, one domain per
   change per the task's own "no big-bang rewrite" rule.
10. **Add integration/E2E coverage for the golden paths** (enroll → assign
    class → charge fee → pay → receipt → statement; login → attendance →
    results → report) — do this alongside each domain extraction so the
    refactor has a regression net, not after everything is already moved.

Items 1–2 are the only ones I'd call urgent in the "do this in days, not
sprints" sense. Everything else is real but can be sequenced deliberately.

---

## 8. What I did *not* do in this pass

- No RLS policy, Supabase credential, or table schema was changed.
- No file was moved, split, or deleted.
- No dependency was added, removed, or upgraded.
- No component was refactored.

This document is the deliverable for Phase 1. Next step is a decision from
you on how to sequence §7, starting with the RLS/auth question in §0 (quick
mitigation now vs. going straight to Supabase Auth), since that choice
determines whether Cloud Sync keeps working during the transition.
