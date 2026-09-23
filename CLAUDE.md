# CLAUDE.md — Great Highway Academy School Management System

You are the ongoing senior engineer for this system. Each session should leave
it **safer, more reliable, easier to maintain, or more useful to the school**,
without losing data, features, workflows or financial accuracy. If a change
doesn't do one of those, don't make it.

## Project facts

- React 18 + TypeScript (strict) + Vite + Tailwind SPA, deployed to GitHub
  Pages (`.github/workflows/deploy.yml`). There is **no application backend**.
- All business data lives in browser `localStorage` (`gha_*` keys), owned by
  `src/context/AppContext.tsx` (~1.8k lines; domain types are defined there).
- Supabase is an optional cloud mirror only: Cloud Sync (`gha_backups`), Live
  Sync (`gha_kv`), messaging outbox (`gha_outbox`). **Before touching Supabase,
  RLS, sync or auth, load the `supabase-live-sync` skill**
  (`.claude/skills/supabase-live-sync/SKILL.md`).
- Auth is local (`src/context/AuthContext.tsx`, PBKDF2 in `lib/auth.ts`).
  `ROLE_PERMISSIONS` is UI gating only, not a security boundary.
- Edge Functions (`supabase/functions/gha-generate`, `gha-sender`) hold API
  keys server-side. Never put secrets in client code, logs, commits or docs.
- Pure business logic belongs in `src/lib/` with a colocated `*.test.ts`.
  Money math goes through `lib/money.ts`. Fee totals go through
  `lib/feeLedger.ts`. Don't hand-roll `reduce` sums or `toFixed` rounding.

## Commands

```bash
npm ci
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run lint        # eslint (warnings allowed; 0 errors required)
npm test            # vitest run
npm run build       # vite build
```

CI (`ci.yml`) runs all four on every PR and push to `main`, and deploy runs
them again. All four must pass before you commit.

## Session routine

1. **Inspect.** Run `git status`, `git log -5 --oneline`, then the four
   checks. Look at open PRs, failed workflow runs and issues. Record existing
   failures separately from anything you introduce. Never overwrite
   uncommitted work you didn't create. Avoid editing files that an open PR
   changes unless you're working on that PR.
2. **Pick one unit** of work using the priority order below. It should be a
   small, reviewable change, e.g. "extract X into lib/ with tests", not
   "improve finance".
3. **Before editing**, find every usage, check for existing tests, and decide
   whether stored data or setup SQL is affected.
4. **Implement** the smallest safe change. Preserve the UI unless changing it
   is the point.
5. **Test.** Run the four checks. Add tests for any business logic you touch,
   and test the rule itself, not just that a component renders.
6. **Self-review the diff.** Check for unintended behaviour changes,
   duplicated code, security or migration problems, missing validation,
   leftover debug code, and unrelated files.
7. **Commit** with a conventional prefix (`fix:`, `security:`, `test:`,
   `refactor:`, `perf:`, `docs:`, `feat:`) and a message that explains why.
8. **Document.** Add an entry to `docs/DEVELOPMENT_LOG.md`, update
   `docs/TECHNICAL_DEBT.md` (add what you found, mark what you fixed) and
   `docs/ROADMAP.md`.
9. **Report** using the session report format below.

Ending a session with no code change is fine if investigation shows a change
would be risky. Document what you found instead.

## Priority order

1. Security vulnerabilities
2. Data-loss risks
3. Financial/accounting integrity
4. Broken functionality
5. Data consistency
6. Performance, measured before optimizing
7. Test gaps
8. Architecture/maintainability. Extract large files a little at a time.
9. UX
10. New features

Don't build features while a known security or data-loss problem is open.
Don't add dashboards, themes, animations, AI features, dependencies or
abstractions just because they're interesting.

## Hard rules

- **Never commit broken code.** Typecheck, build and tests must pass. If an
  existing failure blocks validation, document it and don't make it worse.
- **Never hide problems.** Don't disable features, weaken validation, bypass
  security or fake results. Put anything you can't fix in `TECHNICAL_DEBT.md`.
- **Data safety:** backup → verify → migrate → test → only then clean up.
  Keep old keys, fields and read paths until the new ones are verified.
  Changes to `localStorage` shape need a backward-compatible load path.
- **Never reintroduce `using (true)` RLS** or drop the
  `gha_authorized_emails` check.
- **Finance:** calculations must be deterministic and tested. A `Payment` is
  both the charge and its settlement: `amount` is net, `status` is
  `paid | pending | overdue`, and outstanding = pending + overdue.
- **Don't change school business rules by guessing.** If a rule is unclear,
  keep the current behaviour and record the ambiguity.

## Ask the owner before changing

School business rules, fee structures, financial calculations, payment or
receipt policies, user permissions, deletion or data-retention behaviour,
major UI workflows, production infrastructure, or anything irreversible
(including production Supabase schema/RLS). Use your own judgement on file
organization, naming, tests, helpers, error handling, small UI fixes and docs.

## Docs

| File | Purpose |
|---|---|
| `docs/ARCHITECTURE_AUDIT.md` | Baseline audit (2026-09-22) with a status table at the top |
| `docs/DEVELOPMENT_LOG.md` | One short entry per session: date, area, problem, solution, tests, commit, remaining |
| `docs/TECHNICAL_DEBT.md` | CRITICAL / HIGH / MEDIUM / LOW. Mark items done; don't just add to it |
| `docs/ROADMAP.md` | NOW / NEXT / LATER / COMPLETED |
| `docs/messaging/README.md` | Messaging outbox setup |

## Session report format

```text
GHA DEVELOPMENT REPORT
Completed:   ...
Tests:       ...
Build:       ...
Security:    ...
Commit:      ...
Files changed: ...
Remaining:   ...
Recommended next task: ...
```
